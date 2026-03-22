package handlers

import (
	"context"
	"log"
	"net/http"
	"strings"

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
		Username string `json:"username"`
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
		Role     string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default username to the part before @ in email
	if req.Username == "" {
		parts := strings.SplitN(req.Email, "@", 2)
		req.Username = parts[0]
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	
	var newID int
	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO users (username, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		req.Username, req.Name, req.Email, string(hash), req.Role).Scan(&newID)

	if err != nil {
		log.Println("Create user error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user (maybe email or username exists?)"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": newID, "message": "User created successfully"})
}

func UpdateUserRole(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if target user is an admin before allowing role change
	var targetRole string
	err := repository.DB.QueryRow(context.Background(), "SELECT role FROM users WHERE id = $1", id).Scan(&targetRole)
	if err == nil && targetRole == "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot change the role of an administrator"})
		return
	}

	_, err = repository.DB.Exec(context.Background(), "UPDATE users SET role = $1 WHERE id = $2", req.Role, id)
	if err != nil {
		log.Println("Update user role error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User role updated successfully"})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	// Check if target user is an admin before allowing deletion
	var targetRole string
	err := repository.DB.QueryRow(context.Background(), "SELECT role FROM users WHERE id = $1", id).Scan(&targetRole)
	if err == nil && targetRole == "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete an administrator account"})
		return
	}

	_, err = repository.DB.Exec(context.Background(), "DELETE FROM users WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
