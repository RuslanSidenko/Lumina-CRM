package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

func GenerateToken() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return ""
	}
	return hex.EncodeToString(b)
}

func CreateInvitation(c *gin.Context) {
	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token := GenerateToken()
	expiresAt := time.Now().Add(1 * time.Hour)

	_, err := repository.DB.Exec(context.Background(),
		"INSERT INTO invitations (token, role, expires_at) VALUES ($1, $2, $3)",
		token, req.Role, expiresAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invitation"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token":      token,
		"expires_at": expiresAt,
		"invite_url": "/invite/" + token,
	})
}

func GetInvitation(c *gin.Context) {
	token := c.Param("token")
	var invitation models.Invitation

	err := repository.DB.QueryRow(context.Background(),
		"SELECT id, token, role, expires_at FROM invitations WHERE token = $1", token).
		Scan(&invitation.ID, &invitation.Token, &invitation.Role, &invitation.ExpiresAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}

	if time.Now().After(invitation.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "Invitation has expired"})
		return
	}

	c.JSON(http.StatusOK, invitation)
}

func FulfillInvitation(c *gin.Context) {
	var req models.FulfillInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Verify token
	var invitation models.Invitation
	err := repository.DB.QueryRow(context.Background(),
		"SELECT id, role, expires_at FROM invitations WHERE token = $1", req.Token).
		Scan(&invitation.ID, &invitation.Role, &invitation.ExpiresAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid invitation token"})
		return
	}

	if time.Now().After(invitation.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "Invitation has expired"})
		return
	}

	// 2. Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}

	// 3. Create user (using Email as Username as requested)
	_, err = repository.DB.Exec(context.Background(),
		"INSERT INTO users (username, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)",
		req.Email, req.Name, req.Email, string(hash), invitation.Role)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user account. Email might be already in use."})
		return
	}

	// 4. Delete invitation
	_, _ = repository.DB.Exec(context.Background(), "DELETE FROM invitations WHERE id = $1", invitation.ID)

	c.JSON(http.StatusCreated, gin.H{"message": "Account created successfully. You can now log in."})
}
