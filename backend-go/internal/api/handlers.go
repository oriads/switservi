package api

import (
	"encoding/json"
	"net/http"

	"helpdesk-ibmi-backend-go/internal/ibmi"

	"github.com/gorilla/mux"
)

type Handler struct {
	ibmi *ibmi.IBMiConnection
}

func NewHandler(ibmiConn *ibmi.IBMiConnection) *Handler {
	return &Handler{ibmi: ibmiConn}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	status := h.ibmi.GetStatus()
	heartbeat := h.ibmi.GetHeartbeat()
	
	response := map[string]interface{}{
		"success": true,
		"data":    status,
		"heartbeat": heartbeat,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) GetHeartbeat(w http.ResponseWriter, r *http.Request) {
	heartbeat := h.ibmi.GetHeartbeat()
	
	response := map[string]interface{}{
		"success": true,
		"data":    heartbeat,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) GetJobs(w http.ResponseWriter, r *http.Request) {
	jobs, err := h.ibmi.GetJobs()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"data":    jobs,
		"count":   len(jobs),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) GetJobDetail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobName := vars["name"]

	detail, err := h.ibmi.GetJobDetail(jobName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"data":    detail,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) ExecuteCL(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Command string `json:"command"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error en request", http.StatusBadRequest)
		return
	}

	if req.Command == "" {
		http.Error(w, "Comando requerido", http.StatusBadRequest)
		return
	}

	result, err := h.ibmi.ExecuteCL(req.Command)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    result,
	})
}
