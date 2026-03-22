package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

func generateKey() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func GetAPIKeys(c *gin.Context) {
	rows, err := repository.DB.Query(context.Background(), "SELECT id, key, name, created_at FROM api_keys ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var keys []models.APIKey
	for rows.Next() {
		var k models.APIKey
		rows.Scan(&k.ID, &k.Key, &k.Name, &k.CreatedAt)
		keys = append(keys, k)
	}
	if keys == nil { keys = []models.APIKey{} }
	c.JSON(http.StatusOK, keys)
}

func CreateAPIKey(c *gin.Context) {
	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	key := generateKey()
	var newID int
	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO api_keys (key, name) VALUES ($1, $2) RETURNING id",
		key, req.Name).Scan(&newID)

	if err != nil {
		log.Println("Create API key error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create API key"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": newID, "key": key, "name": req.Name})
}

func DeleteAPIKey(c *gin.Context) {
	id := c.Param("id")
	_, err := repository.DB.Exec(context.Background(), "DELETE FROM api_keys WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete API key"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "API key retracted"})
}
