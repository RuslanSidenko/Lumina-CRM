package handlers

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

func GetUsers(c *gin.Context) {
	rows, err := repository.DB.Query(context.Background(), "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC")
	if err != nil {
		log.Println("Error querying users:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
		if err != nil {
			log.Println("Scanning user error:", err)
			continue
		}
		users = append(users, u)
	}
	if users == nil { users = []models.User{} }
	c.JSON(http.StatusOK, users)
}

func CreateUser(c *gin.Context) {
	var req struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
		Role     string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	
	var newID int
	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
		req.Name, req.Email, string(hash), req.Role).Scan(&newID)

	if err != nil {
		log.Println("Create user error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user (maybe email exists?)"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": newID, "message": "User created successfully"})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	_, err := repository.DB.Exec(context.Background(), "DELETE FROM users WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
