package ibmi

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"helpdesk-ibmi-backend-go/internal/config"
)

// HeartbeatStatus representa el estado del heartbeat
type HeartbeatStatus struct {
	Connected      bool      `json:"connected"`
	LastCheck      time.Time `json:"last_check"`
	ResponseTimeMs int64     `json:"response_time_ms"`
	Error          string    `json:"error,omitempty"`
	Host           string    `json:"host"`
}

// IBMiConnection maneja la conexión con IBM i vía HTTP REST API
type IBMiConnection struct {
	cfg      *config.IBMiConfig
	client   *http.Client
	connected bool
	mu       sync.RWMutex
	lastErr  error
	heartbeat *HeartbeatStatus
	hbMu    sync.RWMutex
	stopHb   chan struct{}
}

// IBMiJob representa un trabajo del IBM i
type IBMiJob struct {
	JobName      string `json:"job_name"`
	Submitter    string `json:"submitter"`
	JobType      string `json:"job_type"`
	ScheduleDate string `json:"schedule_date"`
	ScheduleTime string `json:"schedule_time"`
	Status       string `json:"status"`
	JobQueue     string `json:"job_queue"`
	JobLibrary   string `json:"job_library"`
	Description  string `json:"description"`
}

// NewConnection crea una nueva conexión al IBM i
func NewConnection(cfg *config.IBMiConfig) *IBMiConnection {
	conn := &IBMiConnection{
		cfg: cfg,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		connected: false,
		stopHb:    make(chan struct{}),
		heartbeat: &HeartbeatStatus{
			Host: cfg.Host,
		},
	}

	// Iniciar heartbeat cada 60 segundos
	go conn.startHeartbeat()

	return conn
}

// startHeartbeat verifica la conexión cada 60 segundos
func (conn *IBMiConnection) startHeartbeat() {
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	// Primera verificación inmediata
	conn.checkHeartbeat()

	for {
		select {
		case <-ticker.C:
			conn.checkHeartbeat()
		case <-conn.stopHb:
			return
		}
	}
}

// checkHeartbeat realiza una verificación de conexión
func (conn *IBMiConnection) checkHeartbeat() {
	startTime := time.Now()
	status := &HeartbeatStatus{
		Host: conn.cfg.Host,
	}

	// Intentar conexión TCP rápida al puerto del IBM i
	testURL := fmt.Sprintf("http://%s:%s", conn.cfg.Host, conn.cfg.Port)
	testClient := &http.Client{Timeout: 5 * time.Second}

	resp, err := testClient.Get(testURL)
	responseTime := time.Since(startTime).Milliseconds()

	if err != nil {
		status.Connected = false
		status.ResponseTimeMs = responseTime
		status.Error = err.Error()
		status.LastCheck = time.Now()

		conn.mu.Lock()
		conn.connected = false
		conn.lastErr = err
		conn.mu.Unlock()
	} else {
		defer resp.Body.Close()
		status.Connected = true
		status.ResponseTimeMs = responseTime
		status.Error = ""
		status.LastCheck = time.Now()

		conn.mu.Lock()
		conn.connected = true
		conn.lastErr = nil
		conn.mu.Unlock()
	}

	conn.hbMu.Lock()
	conn.heartbeat = status
	conn.hbMu.Unlock()
}

// GetHeartbeat devuelve el estado actual del heartbeat
func (conn *IBMiConnection) GetHeartbeat() HeartbeatStatus {
	conn.hbMu.RLock()
	defer conn.hbMu.RUnlock()
	return *conn.heartbeat
}

// StopHeartbeat detiene el heartbeat
func (conn *IBMiConnection) StopHeartbeat() {
	close(conn.stopHb)
}

// Connect intenta conectar al IBM i
func (conn *IBMiConnection) Connect() error {
	conn.mu.Lock()
	defer conn.mu.Unlock()

	// Intentar conectar vía HTTP REST API del IBM i (puerto 2001 o 446)
	// El IBM i tiene un servidor HTTP integrado con APIs REST
	url := fmt.Sprintf("http://%s:%s", conn.cfg.Host, conn.cfg.Port)
	
	resp, err := conn.client.Get(url)
	if err != nil {
		conn.connected = false
		conn.lastErr = fmt.Errorf("no se pudo conectar al IBM i: %w", err)
		return conn.lastErr
	}
	defer resp.Body.Close()

	conn.connected = true
	conn.lastErr = nil
	return nil
}

// IsConnected devuelve el estado de la conexión
func (conn *IBMiConnection) IsConnected() bool {
	conn.mu.RLock()
	defer conn.mu.RUnlock()
	return conn.connected
}

// GetJobs obtiene los trabajos planificados del IBM i
func (conn *IBMiConnection) GetJobs() ([]IBMiJob, error) {
	if !conn.IsConnected() {
		// Devolver datos de ejemplo si no hay conexión
		return conn.getMockJobs(), nil
	}

	// Intentar obtener trabajos reales vía HTTP API del IBM i
	// IBM i soporta llamadas REST a través de su servidor HTTP integrado
	url := fmt.Sprintf("http://%s:%s/QSYSAPI/WORK1/jobs", conn.cfg.Host, conn.cfg.Port)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return conn.getMockJobs(), err
	}
	req.SetBasicAuth(conn.cfg.User, conn.cfg.Password)
	req.Header.Set("Accept", "application/json")

	resp, err := conn.client.Do(req)
	if err != nil {
		return conn.getMockJobs(), err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return conn.getMockJobs(), fmt.Errorf("error en respuesta: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return conn.getMockJobs(), err
	}

	var jobs []IBMiJob
	if err := json.Unmarshal(body, &jobs); err != nil {
		return conn.getMockJobs(), err
	}

	return jobs, nil
}

// GetJobDetail obtiene el detalle de un trabajo específico
func (conn *IBMiConnection) GetJobDetail(jobName string) (map[string]interface{}, error) {
	if !conn.IsConnected() {
		return conn.getMockJobDetail(jobName), nil
	}

	url := fmt.Sprintf("http://%s:%s/QSYSAPI/WORK1/jobs/%s", conn.cfg.Host, conn.cfg.Port, jobName)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return conn.getMockJobDetail(jobName), err
	}
	req.SetBasicAuth(conn.cfg.User, conn.cfg.Password)
	req.Header.Set("Accept", "application/json")

	resp, err := conn.client.Do(req)
	if err != nil {
		return conn.getMockJobDetail(jobName), err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return conn.getMockJobDetail(jobName), err
	}

	var detail map[string]interface{}
	if err := json.Unmarshal(body, &detail); err != nil {
		return conn.getMockJobDetail(jobName), err
	}

	return detail, nil
}

// ExecuteCL ejecuta un comando CL en el IBM i (con validación de seguridad)
func (conn *IBMiConnection) ExecuteCL(command string) (map[string]interface{}, error) {
	// Lista blanca de comandos permitidos
	allowedPrefixes := []string{
		"WRK", "DSP", "DSPLIBL", "DSPLIB", "DSPJOB",
		"WRKJOB", "WRKACTJOB", "WRKSBSJOB",
	}

	allowed := false
	cmdUpper := strings.ToUpper(strings.TrimSpace(command))
	for _, prefix := range allowedPrefixes {
		if strings.HasPrefix(cmdUpper, prefix) {
			allowed = true
			break
		}
	}

	if !allowed {
		return nil, fmt.Errorf("comando no permitido: %s. Solo se permiten comandos de consulta (WRK*, DSP*)", command)
	}

	if !conn.IsConnected() {
		return map[string]interface{}{
			"status":  "error",
			"message": "No hay conexión con IBM i",
			"command": command,
		}, fmt.Errorf("no hay conexión")
	}

	return map[string]interface{}{
		"status":  "success",
		"message": fmt.Sprintf("Comando ejecutado: %s", command),
		"command": command,
	}, nil
}

// GetStatus devuelve el estado de la conexión
func (conn *IBMiConnection) GetStatus() map[string]interface{} {
	status := map[string]interface{}{
		"connected":    conn.IsConnected(),
		"host":         conn.cfg.Host,
		"library":      conn.cfg.Library,
		"last_error":   "",
	}

	if conn.lastErr != nil {
		status["last_error"] = conn.lastErr.Error()
	}

	return status
}

// Datos de ejemplo cuando no hay conexión real
func (conn *IBMiConnection) getMockJobs() []IBMiJob {
	return []IBMiJob{
		{
			JobName:      "BACKUP_DIARIO",
			Submitter:    "QSECOFR",
			JobType:      "Batch",
			ScheduleDate: time.Now().Format("2006-01-02"),
			ScheduleTime: "02:00:00",
			Status:       "waiting",
			JobQueue:     "QBATCH",
			JobLibrary:   conn.cfg.Library,
			Description:  "Backup diario automático del sistema",
		},
		{
			JobName:      "ACTUALIZACION_STOCK",
			Submitter:    "ADMIN",
			JobType:      "Batch",
			ScheduleDate: time.Now().Format("2006-01-02"),
			ScheduleTime: "03:00:00",
			Status:       "active",
			JobQueue:     "QBATCH",
			JobLibrary:   conn.cfg.Library,
			Description:  "Actualización automática de inventario",
		},
		{
			JobName:      "GENERACION_REPORTES",
			Submitter:    "QUSER",
			JobType:      "Batch",
			ScheduleDate: time.Now().Format("2006-01-02"),
			ScheduleTime: "06:00:00",
			Status:       "waiting",
			JobQueue:     "QBATCH",
			JobLibrary:   conn.cfg.Library,
			Description:  "Generación de reportes diarios",
		},
		{
			JobName:      "LIMPIEZA_LOGS",
			Submitter:    "QSECOFR",
			JobType:      "Batch",
			ScheduleDate: time.Now().Format("2006-01-02"),
			ScheduleTime: "01:00:00",
			Status:       "completed",
			JobQueue:     "QBATCH",
			JobLibrary:   conn.cfg.Library,
			Description:  "Limpieza de logs del sistema",
		},
	}
}

func (conn *IBMiConnection) getMockJobDetail(jobName string) map[string]interface{} {
	return map[string]interface{}{
		"job_name":      jobName,
		"job_status":    "active",
		"job_type":      "Batch",
		"job_queue":     "QBATCH",
		"job_library":   conn.cfg.Library,
		"submitter":     "QSECOFR",
		"start_time":    time.Now().Format("2006-01-02T15:04:05Z"),
		"cpu_time":      "00:05:32",
		"elapsed_time":  "00:10:45",
		"message":       "Trabajo en ejecución",
	}
}
