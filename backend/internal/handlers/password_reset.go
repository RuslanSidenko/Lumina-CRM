package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"real_estate_crm/internal/repository"
	"real_estate_crm/internal/utils"
)

func generateSecureToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid email is required"})
		return
	}

	// 1. Check if user exists
	var exists bool
	err := repository.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil || !exists {
		// For security, don't confirm if email exists or not
		c.JSON(http.StatusOK, gin.H{"message": "If your email is in our system, you will receive a reset link shortly."})
		return
	}

	// 2. Generate token
	token := generateSecureToken()
	expiresAt := time.Now().Add(30 * time.Minute)

	// 3. Store in DB (Update if already exists for this email)
	_, err = repository.DB.Exec(context.Background(),
		`INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)
		 ON CONFLICT (email) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`,
		req.Email, token, expiresAt)

	if err != nil {
		// Log error but respond success to avoid leaking user list
		log.Printf("Error storing password reset: %v", err)
	}

	// 4. Send Email
	subject := "Lumina CRM - Password Reset Request"
	// Replace with your actual domain in production
	resetLink := fmt.Sprintf("https://goldenregal.ru/reset-password/%s", token)
	body := fmt.Sprintf(`
		<h1>Password Reset</h1>
		<p>You requested a password reset for Lumina CRM.</p>
		<p>Click the link below to set a new password. This link expires in 30 minutes.</p>
		<a href="%s" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
		<p>If you did not request this, please ignore this email.</p>
	`, resetLink)

	err = utils.SendEmail(req.Email, subject, body)
	if err != nil {
		log.Printf("Failed to send reset email: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "If your email is in our system, you will receive a reset link shortly."})
}

func ResetPassword(c *gin.Context) {
	var req struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Verify token and get email
	var email string
	var expiresAt time.Time
	err := repository.DB.QueryRow(context.Background(),
		"SELECT email, expires_at FROM password_resets WHERE token = $1", req.Token).
		Scan(&email, &expiresAt)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
		return
	}

	if time.Now().After(expiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "Reset link has expired"})
		return
	}

	// 2. Hash new password
	hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	// 3. Update user
	_, err = repository.DB.Exec(context.Background(),
		"UPDATE users SET password_hash = $1 WHERE email = $2", string(hash), email)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// 4. Cleanup token
	_, _ = repository.DB.Exec(context.Background(), "DELETE FROM password_resets WHERE email = $1", email)

	c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully. You can now log in."})
}
