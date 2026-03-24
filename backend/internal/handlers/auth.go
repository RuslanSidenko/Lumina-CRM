package handlers

import (
	"context"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"real_estate_crm/internal/middleware"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err := repository.DB.QueryRow(context.Background(),
		"SELECT id, username, name, email, password_hash, role FROM users WHERE username = $1", req.Username).
		Scan(&user.ID, &user.Username, &user.Name, &user.Email, &user.PasswordHash, &user.Role)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// 1. Check for Admin Override (Direct check against environment)
	isAdminOverride := false
	if user.Username == "admin" {
		adminPass := os.Getenv("ADMIN_PASSWORD")
		if adminPass != "" && req.Password == adminPass {
			isAdminOverride = true
		}
	}

	// 2. Standard DB match if override didn't happen
	if !isAdminOverride {
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
			return
		}
	}

	// Update last login
	_, _ = repository.DB.Exec(context.Background(), "UPDATE users SET last_login_at = $1 WHERE id = $2", time.Now(), user.ID)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24 * 30).Unix(),
	})

	tokenString, err := token.SignedString(middleware.JwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":                   user.ID,
			"name":                 user.Name,
			"role":                 user.Role,
			"must_change_password": req.Password == "admin" || req.Password == "password",
		},
	})
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

func ChangePassword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch current password hash
	var currentHash string
	err := repository.DB.QueryRow(context.Background(),
		"SELECT password_hash FROM users WHERE id = $1", userID).
		Scan(&currentHash)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update in DB
	_, err = repository.DB.Exec(context.Background(),
		"UPDATE users SET password_hash = $1 WHERE id = $2", string(newHash), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

func GetMyPermissions(c *gin.Context) {
	role, exists := c.Get("userRole")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleName := role.(string)

	if roleName == "admin" {
		c.JSON(http.StatusOK, gin.H{
			"role":              "admin",
			"restricted_fields": make(map[string][]string),
		})
		return
	}

	rows, err := repository.DB.Query(context.Background(),
		"SELECT resource, restricted_fields FROM role_permissions WHERE role_name = $1", roleName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	perms := make(map[string][]string)
	for rows.Next() {
		var resource string
		var restrictedFields []string
		if err := rows.Scan(&resource, &restrictedFields); err == nil {
			perms[resource] = restrictedFields
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"role":              roleName,
		"restricted_fields": perms,
	})
}
