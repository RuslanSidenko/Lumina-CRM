package handlers

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

func GetProperties(c *gin.Context) {
	rows, err := repository.DB.Query(context.Background(), "SELECT id, title, price, status, agent_id, created_at FROM properties ORDER BY created_at DESC")
	if err != nil {
		log.Println("Error querying properties:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var properties []models.Property
	for rows.Next() {
		var p models.Property
		err := rows.Scan(&p.ID, &p.Title, &p.Price, &p.Status, &p.AgentID, &p.CreatedAt)
		if err != nil {
			log.Println("Error scanning property:", err)
			continue
		}
		properties = append(properties, p)
	}

	if properties == nil {
		properties = []models.Property{}
	}

	c.JSON(http.StatusOK, properties)
}
