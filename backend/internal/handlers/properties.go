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
	rows, err := repository.DB.Query(context.Background(), "SELECT id, title, address, description, price, bedrooms, bathrooms, area, status, agent_id, images, created_at FROM properties ORDER BY created_at DESC")
	if err != nil {
		log.Println("Error querying properties:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var properties []models.Property
	for rows.Next() {
		var p models.Property
		err := rows.Scan(&p.ID, &p.Title, &p.Address, &p.Description, &p.Price, &p.Bedrooms, &p.Bathrooms, &p.Area, &p.Status, &p.AgentID, &p.Images, &p.CreatedAt)
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

func CreateProperty(c *gin.Context) {
	var p models.Property
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO properties (title, address, description, price, bedrooms, bathrooms, area, status, agent_id, images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
		p.Title, p.Address, p.Description, p.Price, p.Bedrooms, p.Bathrooms, p.Area, p.Status, p.AgentID, p.Images).Scan(&p.ID)

	if err != nil {
		log.Println("Create property error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create property"})
		return
	}
	c.JSON(http.StatusCreated, p)
}
