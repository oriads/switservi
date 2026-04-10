package api

import (
	"net/http"

	"github.com/gorilla/mux"
)

func Router(h *Handler) *mux.Router {
	r := mux.NewRouter()

	// Middleware para CORS
	r.Use(corsMiddleware)

	// Health check y Heartbeat
	r.HandleFunc("/api/health", h.Health).Methods("GET")
	r.HandleFunc("/api/heartbeat", h.GetHeartbeat).Methods("GET")

	// Jobs del IBM i
	r.HandleFunc("/api/jobs", h.GetJobs).Methods("GET")
	r.HandleFunc("/api/jobs/{name}", h.GetJobDetail).Methods("GET")
	r.HandleFunc("/api/jobs/execute", h.ExecuteCL).Methods("POST")

	return r
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
