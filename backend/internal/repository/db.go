package repository

import (
	"context"
	"fmt"
	"log"
	"os"

	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"real_estate_crm/internal/models"
)

var DB *pgxpool.Pool

func ConnectDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:password@localhost:5432/crm_db?sslmode=disable"
	}

	ctx := context.Background()
	var pool *pgxpool.Pool
	var err error

	// 1. Connection Retry Loop
	maxRetries := 15
	for i := 0; i < maxRetries; i++ {
		log.Printf("Connecting to database (attempt %d/%d)...", i+1, maxRetries)
		
		// Attempt to ensure database exists first
		ensureDatabaseExists(dsn)

		pool, err = pgxpool.New(ctx, dsn)
		if err == nil {
			err = pool.Ping(ctx)
			if err == nil {
				DB = pool
				log.Println("Connected to PostgreSQL successfully.")
				break
			}
		}

		log.Printf("Database not ready: %v. Retrying in 2 seconds...", err)
		time.Sleep(2 * time.Second)
	}

	if DB == nil {
		log.Fatalf("Could not connect to database after %d attempts: %v", maxRetries, err)
	}

	SeedDatabase()
}

func ensureDatabaseExists(dsn string) {
	re := regexp.MustCompile(`/[^/?]+(\?|$)`)
	masterDSN := re.ReplaceAllString(dsn, "/postgres$1")
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, masterDSN)
	if err != nil {
		return
	}
	defer conn.Close(ctx)

	dbName := "crm_db"
	parts := strings.Split(dsn, "/")
	if len(parts) > 0 {
		lastPart := parts[len(parts)-1]
		dbName = strings.Split(lastPart, "?")[0]
	}

	var exists bool
	_ = conn.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)", dbName).Scan(&exists)
	if !exists {
		log.Printf("Database '%s' not found. Creating...", dbName)
		_, _ = conn.Exec(ctx, fmt.Sprintf("CREATE DATABASE %s", dbName))
	}
}

func SeedDatabase() {
	log.Println("Initializing database schema...")
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(50) UNIQUE,
		name VARCHAR(100) NOT NULL,
		email VARCHAR(100) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		role VARCHAR(20) DEFAULT 'agent',
		last_login_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS leads (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		phone VARCHAR(20) NOT NULL,
		email VARCHAR(100),
		status VARCHAR(20) NOT NULL,
		assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS properties (
		id SERIAL PRIMARY KEY,
		title VARCHAR(200) NOT NULL,
		address VARCHAR(255),
		description TEXT,
		price INTEGER NOT NULL,
		bedrooms INTEGER DEFAULT 0,
		bathrooms INTEGER DEFAULT 0,
		area INTEGER DEFAULT 0,
		status VARCHAR(20) NOT NULL,
		agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		images TEXT[] DEFAULT '{}',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS interactions (
		id SERIAL PRIMARY KEY,
		lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
		agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		type VARCHAR(20) NOT NULL,
		content TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS whatsapp_messages (
		id SERIAL PRIMARY KEY,
		lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
		wa_message_id VARCHAR(100) UNIQUE,
		direction VARCHAR(10) NOT NULL, -- incoming, outgoing
		message_type VARCHAR(10) NOT NULL, -- text, image, document
		content TEXT NOT NULL,
		media_caption TEXT,
		status VARCHAR(20) DEFAULT 'received',
		timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_id ON whatsapp_messages(lead_id);
	CREATE TABLE IF NOT EXISTS tasks (
		id SERIAL PRIMARY KEY,
		lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
		property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
		agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		title VARCHAR(200) NOT NULL,
		description TEXT,
		due_at TIMESTAMP,
		status VARCHAR(20) DEFAULT 'pending',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS deals (
		id SERIAL PRIMARY KEY,
		lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
		property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
		agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		price INTEGER NOT NULL,
		status VARCHAR(30) NOT NULL,
		close_date TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE TABLE IF NOT EXISTS custom_field_definitions (
		id SERIAL PRIMARY KEY,
		entity_type VARCHAR(20) NOT NULL,
		label VARCHAR(100) NOT NULL,
		field_type VARCHAR(20) NOT NULL,
		options TEXT[] DEFAULT '{}',
		is_required BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS api_keys (
		id SERIAL PRIMARY KEY,
		key VARCHAR(64) UNIQUE NOT NULL,
		name VARCHAR(100),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS role_permissions (
		id SERIAL PRIMARY KEY,
		role_name VARCHAR(50) NOT NULL,
		resource VARCHAR(50) NOT NULL, -- leads, properties, deals, tasks, interactions, users
		can_view BOOLEAN DEFAULT FALSE,
		can_view_all BOOLEAN DEFAULT FALSE, -- if false, only assigned to them
		can_create BOOLEAN DEFAULT FALSE,
		can_edit BOOLEAN DEFAULT FALSE,
		can_edit_all BOOLEAN DEFAULT FALSE,
		can_delete BOOLEAN DEFAULT FALSE,
		restricted_fields TEXT[] DEFAULT '{}', -- fields they cannot see or edit
		UNIQUE(role_name, resource) -- resource: leads, properties, deals, tasks, interactions, users, meetings
	);
	CREATE TABLE IF NOT EXISTS invitations (
		id SERIAL PRIMARY KEY,
		token VARCHAR(64) UNIQUE NOT NULL,
		role VARCHAR(20) NOT NULL,
		expires_at TIMESTAMP NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS password_resets (
		id SERIAL PRIMARY KEY,
		email VARCHAR(100) UNIQUE NOT NULL,
		token VARCHAR(64) UNIQUE NOT NULL,
		expires_at TIMESTAMP NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS automation_settings (
		key VARCHAR(100) PRIMARY KEY,
		value TEXT NOT NULL
	);
	CREATE TABLE IF NOT EXISTS refresh_tokens (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		token VARCHAR(255) UNIQUE NOT NULL,
		expires_at TIMESTAMP NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS user_oauth_tokens (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		provider VARCHAR(20) NOT NULL, -- 'google' or 'zoom'
		access_token TEXT NOT NULL,
		refresh_token TEXT,
		expiry TIMESTAMP,
		UNIQUE(user_id, provider)
	);
	CREATE TABLE IF NOT EXISTS meetings (
		id SERIAL PRIMARY KEY,
		lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
		agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		title VARCHAR(200) NOT NULL,
		provider VARCHAR(20),
		meeting_link TEXT,
		start_time TIMESTAMP NOT NULL,
		end_time TIMESTAMP NOT NULL,
		status VARCHAR(20) DEFAULT 'scheduled',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`

	
	var err error
	_, err = DB.Exec(context.Background(), schema)
	if err != nil {
		log.Fatalf("CRITICAL: Error creating schema: %v. Execution aborted.", err)
	}
	log.Println("Schema initialized successfully.")

	// Default Roles Seeding
	log.Println("Seeding default roles and permissions...")
	defaultPermissions := []struct {
		Role     string
		Resource string
		View     bool
		ViewAll  bool
		Create   bool
		Edit     bool
		EditAll  bool
		Delete   bool
	}{
		// Admin: All access
		{"admin", "leads", true, true, true, true, true, true},
		{"admin", "properties", true, true, true, true, true, true},
		{"admin", "deals", true, true, true, true, true, true},
		{"admin", "tasks", true, true, true, true, true, true},
		{"admin", "interactions", true, true, true, true, true, true},
		{"admin", "users", true, true, true, true, true, true},
		{"admin", "custom_fields", true, true, true, true, true, true},
		{"admin", "meetings", true, true, true, true, true, true},
		
		// Agent: View all properties, but only manage own leads
		{"agent", "leads", true, false, true, true, false, false},
		{"agent", "properties", true, true, true, true, false, false},
		{"agent", "deals", true, false, true, true, false, false},
		{"agent", "tasks", true, false, true, true, false, false},
		{"agent", "interactions", true, false, true, true, false, false},
		{"agent", "users", true, true, false, false, false, false},
		{"agent", "meetings", true, false, true, true, false, false},
	}

	for _, p := range defaultPermissions {
		_, _ = DB.Exec(context.Background(), 
			`INSERT INTO role_permissions (role_name, resource, can_view, can_view_all, can_create, can_edit, can_edit_all, can_delete) 
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
			 ON CONFLICT (role_name, resource) DO UPDATE SET 
				can_view = EXCLUDED.can_view,
				can_view_all = EXCLUDED.can_view_all,
				can_create = EXCLUDED.can_create,
				can_edit = EXCLUDED.can_edit,
				can_edit_all = EXCLUDED.can_edit_all,
				can_delete = EXCLUDED.can_delete`,
			p.Role, p.Resource, p.View, p.ViewAll, p.Create, p.Edit, p.EditAll, p.Delete)
	}

	// Ensure all existing roles have the 'users' resource entry
	_, _ = DB.Exec(context.Background(), `
		INSERT INTO role_permissions (role_name, resource)
		SELECT DISTINCT role_name, 'users' FROM role_permissions
		ON CONFLICT DO NOTHING
	`)
	_, _ = DB.Exec(context.Background(), `
		INSERT INTO role_permissions (role_name, resource)
		SELECT DISTINCT role_name, 'meetings' FROM role_permissions
		ON CONFLICT DO NOTHING
	`)
	
	// Migrations for existing tables
	if _, err := DB.Exec(context.Background(), "ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'"); err != nil {
		log.Printf("Migration error (leads custom_fields): %v", err)
	}
	if _, err := DB.Exec(context.Background(), "ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual'"); err != nil {
		log.Printf("Migration error (leads source): %v", err)
	}
	if _, err := DB.Exec(context.Background(), "ALTER TABLE leads ALTER COLUMN email DROP NOT NULL"); err != nil {
		log.Printf("Migration error (leads email optional): %v", err)
	}
	if _, err := DB.Exec(context.Background(), "ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL"); err != nil {
		log.Printf("Migration error (leads assigned_to): %v", err)
	}
	if _, err := DB.Exec(context.Background(), "ALTER TABLE properties ADD COLUMN IF NOT EXISTS address VARCHAR(255)"); err != nil {
		log.Printf("Migration error (properties address): %v", err)
	}
	if _, err := DB.Exec(context.Background(), "ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT"); err != nil {
		log.Printf("Migration error (properties description): %v", err)
	}
	if _, err := DB.Exec(context.Background(), "ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 0"); err != nil {
		log.Printf("Migration error (properties bedrooms): %v", err)
	}
	if _, err := DB.Exec(context.Background(), "ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 0"); err != nil {
		log.Printf("Migration error (properties bathrooms): %v", err)
	}
	if _, err := DB.Exec(context.Background(), "ALTER TABLE properties ADD COLUMN IF NOT EXISTS area INTEGER DEFAULT 0"); err != nil {
		log.Printf("Migration error (properties area): %v", err)
	}
	if _, err := DB.Exec(context.Background(), "ALTER TABLE properties ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'"); err != nil {
		log.Printf("Migration error (properties images): %v", err)
	}
	if _, err := DB.Exec(context.Background(), "ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'"); err != nil {
		log.Printf("Migration error (properties custom_fields): %v", err)
	}

	// Add whatsapp_messages table if it's missing (failsafe)
	_, _ = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS whatsapp_messages (
			id SERIAL PRIMARY KEY,
			lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
			wa_message_id VARCHAR(100) UNIQUE,
			direction VARCHAR(10) NOT NULL,
			message_type VARCHAR(10) NOT NULL,
			content TEXT NOT NULL,
			media_caption TEXT,
			status VARCHAR(20) DEFAULT 'received',
			timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	_, _ = DB.Exec(context.Background(), "CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_id ON whatsapp_messages(lead_id)")
	
	// Add unique constraint only if it doesn't exist
	_, err = DB.Exec(context.Background(), `
		DO $$ 
		BEGIN 
			IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_label_per_entity') THEN
				ALTER TABLE custom_field_definitions ADD CONSTRAINT unique_label_per_entity UNIQUE (entity_type, label);
			END IF;
		END $$;
	`)
	if err != nil {
		log.Printf("Error applying constraints: %v", err)
	}

	// Seed Essential Custom Fields for Leads
	log.Println("Seeding essential custom fields...")
	fieldsToSeed := []struct {
		EntityType string
		Label      string
		FieldType  string
		Options    []string
	}{
		{"lead", "Budget", "number", nil},
		{"lead", "Intended Date", "text", nil},
		{"lead", "Decision Maker", "select", []string{"Yes", "No"}},
		{"lead", "First Deposit", "number", nil},
		{"lead", "Condo Interest", "text", nil},
		{"lead", "Bedrooms", "number", nil},
		{"lead", "Goal", "select", []string{"Investment", "Living"}},
		{"lead", "Country", "text", nil},
	}

	for _, f := range fieldsToSeed {
		_, _ = DB.Exec(context.Background(), 
			"INSERT INTO custom_field_definitions (entity_type, label, field_type, options) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
			f.EntityType, f.Label, f.FieldType, f.Options)
	}

	// Add username column migration for existing tables
	if _, err := DB.Exec(context.Background(), "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE"); err != nil {
		log.Printf("Migration error (users username): %v", err)
	}

	// Ensure local users have correct passwords for testing
	adminPass := os.Getenv("ADMIN_PASSWORD")
	if adminPass == "" {
		adminPass = "admin"
	}
	agentPass := os.Getenv("AGENT_PASSWORD")
	if agentPass == "" {
		agentPass = "agent"
	}

	log.Printf("Ensuring admin user exists and password matches environment...")
	adminHash, _ := bcrypt.GenerateFromPassword([]byte(adminPass), bcrypt.DefaultCost)
	agentHash, _ := bcrypt.GenerateFromPassword([]byte(agentPass), bcrypt.DefaultCost)
	
	// Upsert Admin (Target by username 'admin')
	_, _ = DB.Exec(context.Background(), `
		INSERT INTO users (username, name, email, password_hash, role) 
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
	`, "admin", "Administrator", "admin@example.com", string(adminHash), "admin")

	seedQuery := `
		INSERT INTO users (username, name, email, password_hash, role) 
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (email) DO NOTHING
	`
	_, err = DB.Exec(context.Background(), seedQuery,
		"agent", "Agent User", "agent@example.com", string(agentHash), "agent",
	)
	if err != nil {
		log.Printf("Error seeding users: %v", err)
	} else {
		log.Println("Database users synchronized successfully.")
	}
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
