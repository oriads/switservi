package main

import (
	"fmt"
	"log"
	"net/http"

	"helpdesk-ibmi-backend-go/internal/api"
	"helpdesk-ibmi-backend-go/internal/config"
	"helpdesk-ibmi-backend-go/internal/ibmi"
)

func main() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Println("🚀 Iniciando Backend Go - IBM i Service")

	// Cargar configuración
	cfg := config.Load()
	log.Printf("📋 Configuración: Puerto=%s, IBMi=%s", cfg.Server.Port, cfg.IBMi.Host)

	// Inicializar conexión al IBM i
	ibmiConn := ibmi.NewConnection(&cfg.IBMi)

	// Intentar conectar al IBM i (no bloqueante)
	go func() {
		if err := ibmiConn.Connect(); err != nil {
			log.Printf("⚠️ IBM i no disponible (modo simulación): %v", err)
			log.Println("💡 El servicio funcionará con datos de ejemplo")
			log.Println("💡 Para datos reales, configura IBMI_HOST, IBMI_USER, IBMI_PASSWORD en .env")
		} else {
			log.Println("✅ Conectado al IBM i correctamente")
		}
	}()

	// Configurar API
	handler := api.NewHandler(ibmiConn)
	router := api.Router(handler)

	// Iniciar servidor
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	log.Printf("✅ Servidor iniciado en http://%s", addr)
	log.Printf("📍 Endpoints:")
	log.Printf("   - GET  /api/health")
	log.Printf("   - GET  /api/jobs")
	log.Printf("   - GET  /api/jobs/{name}")
	log.Printf("   - POST /api/jobs/execute")

	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("❌ Error: %v", err)
	}
}
