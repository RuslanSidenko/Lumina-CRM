package models

import "time"

type User struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

type Lead struct {
	ID         int       `json:"id"`
	Name       string    `json:"name"`
	Phone      string    `json:"phone"`
	Email      string    `json:"email"`
	Status     string    `json:"status"`
	AssignedTo *int      `json:"assigned_to"`
	CreatedAt  time.Time `json:"created_at"`
}

type Property struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Address     string    `json:"address"`
	Description string    `json:"description"`
	Price       int       `json:"price"`
	Bedrooms    int       `json:"bedrooms"`
	Bathrooms   int       `json:"bathrooms"`
	Area        int       `json:"area"`
	Status      string    `json:"status"`
	AgentID     int       `json:"agent_id"`
	Images      []string  `json:"images"`
	CreatedAt   time.Time `json:"created_at"`
}

// Struct for creating a New Lead via POST
type CreateLeadRequest struct {
	Name       string `json:"name" binding:"required"`
	Phone      string `json:"phone" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Status     string `json:"status" binding:"required"`
	AssignedTo *int   `json:"assigned_to"`
}

type Interaction struct {
	ID        int       `json:"id"`
	LeadID    int       `json:"lead_id"`
	AgentID   int       `json:"agent_id"`
	Type      string    `json:"type"` // call, email, meeting, note
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Task struct {
	ID          int       `json:"id"`
	LeadID      *int      `json:"lead_id"`
	PropertyID  *int      `json:"property_id"`
	AgentID     int       `json:"agent_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DueAt       time.Time `json:"due_at"`
	Status      string    `json:"status"` // pending, completed
	CreatedAt   time.Time `json:"created_at"`
}

type Deal struct {
	ID         int       `json:"id"`
	LeadID     int       `json:"lead_id"`
	PropertyID int       `json:"property_id"`
	AgentID    int       `json:"agent_id"`
	Price      int       `json:"price"`
	Status     string    `json:"status"` // Offer, Under Contract, Escrow, Closed, Lost
	CloseDate  *time.Time `json:"close_date"`
	CreatedAt  time.Time `json:"created_at"`
}
