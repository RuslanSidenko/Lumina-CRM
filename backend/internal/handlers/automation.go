package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/repository"
)

func GetAutomationSettings(c *gin.Context) {
	rows, err := repository.DB.Query(context.Background(), "SELECT key, value FROM automation_settings")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}
	defer rows.Close()

	settings := make(map[string]string)
	for rows.Next() {
		var k, v string
		rows.Scan(&k, &v)
		settings[k] = v
	}

	c.JSON(http.StatusOK, settings)
}

func UpdateAutomationSetting(c *gin.Context) {
	var req struct {
		Key   string `json:"key" binding:"required"`
		Value string `json:"value" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := repository.DB.Exec(context.Background(),
		"INSERT INTO automation_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
		req.Key, req.Value)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update setting"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Setting updated successfully"})
}
