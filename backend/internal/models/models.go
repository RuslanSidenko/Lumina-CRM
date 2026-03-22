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
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Price     int       `json:"price"`
	Status    string    `json:"status"`
	AgentID   int       `json:"agent_id"`
	CreatedAt time.Time `json:"created_at"`
}

// Struct for creating a New Lead via POST
type CreateLeadRequest struct {
	Name       string `json:"name" binding:"required"`
	Phone      string `json:"phone" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Status     string `json:"status" binding:"required"`
	AssignedTo *int   `json:"assigned_to"`
}
