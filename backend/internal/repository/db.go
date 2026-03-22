package repository

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"real_estate_crm/internal/models"
)

var DB *pgxpool.Pool

func ConnectDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Println("DATABASE_URL not set, running with empty Postgres pool")
		return
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatal("Unable to connect to database: ", err)
	}
	DB = pool
	fmt.Println("Connected to PostgreSQL successfully.")
}

// Memory fallback to test if db isn't set up yet
var MockLeads = []models.Lead{
	{ID: 1, Name: "Alice Smith", Phone: "555-0101", Email: "alice@example.com", Status: "New"},
	{ID: 2, Name: "Bob Johnson", Phone: "555-0202", Email: "bob@example.com", Status: "Contacted"},
}

var MockProperties = []models.Property{
	{ID: 1, Title: "Modern Downtown Apartment", Price: 350000, Status: "Available", AgentID: 1},
	{ID: 2, Title: "Suburban Family Home", Price: 650000, Status: "Sold", AgentID: 1},
}
