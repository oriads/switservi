package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Server  ServerConfig
	IBMi    IBMiConfig
	Postgres PostgresConfig
}

type ServerConfig struct {
	Port string
	Host string
}

type IBMiConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Library  string
}

type PostgresConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

func Load() *Config {
	// Intentar cargar .env (no crítico si no existe)
	_ = godotenv.Load()

	return &Config{
		Server: ServerConfig{
			Port: getEnv("GO_SERVER_PORT", "8080"),
			Host: getEnv("GO_SERVER_HOST", "0.0.0.0"),
		},
		IBMi: IBMiConfig{
			Host:     getEnv("IBMI_HOST", "192.168.1.100"),
			Port:     getEnv("IBMI_PORT", "446"),
			User:     getEnv("IBMI_USER", "QSECOFR"),
			Password: getEnv("IBMI_PASSWORD", ""),
			Library:  getEnv("IBMI_LIBRARY", "QGPL"),
		},
		Postgres: PostgresConfig{
			Host:     getEnv("DB_HOST", "postgres"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "helpdesk"),
			Password: getEnv("DB_PASSWORD", "helpdesk_pass"),
			DBName:   getEnv("DB_NAME", "helpdesk_ibmi"),
		},
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func (c *Config) ValidateIBMi() bool {
	return c.IBMi.Host != "" && c.IBMi.User != "" && c.IBMi.Password != ""
}

func init() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
}
