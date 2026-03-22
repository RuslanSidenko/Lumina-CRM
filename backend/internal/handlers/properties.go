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
	role, _ := c.Get("userRole")
	userID, _ := c.Get("userID")

	query := "SELECT id, title, address, description, price, bedrooms, bathrooms, area, status, agent_id, images, custom_fields, created_at FROM properties"
	args := []interface{}{}

	if role.(string) == "agent" {
		uid := int(userID.(float64))
		query += " WHERE agent_id = $1"
		args = append(args, uid)
	}
	query += " ORDER BY created_at DESC"

	rows, err := repository.DB.Query(context.Background(), query, args...)
	if err != nil {
		log.Println("Error querying properties:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var properties []models.Property
	for rows.Next() {
		var p models.Property
		err := rows.Scan(&p.ID, &p.Title, &p.Address, &p.Description, &p.Price, &p.Bedrooms, &p.Bathrooms, &p.Area, &p.Status, &p.AgentID, &p.Images, &p.CustomFields, &p.CreatedAt)
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

	userID, _ := c.Get("userID")
	p.AgentID = int(userID.(float64))

	if p.CustomFields == nil {
		p.CustomFields = make(map[string]interface{})
	}

	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO properties (title, address, description, price, bedrooms, bathrooms, area, status, agent_id, images, custom_fields) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
		p.Title, p.Address, p.Description, p.Price, p.Bedrooms, p.Bathrooms, p.Area, p.Status, p.AgentID, p.Images, p.CustomFields).Scan(&p.ID)

	if err != nil {
		log.Println("Create property error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create property"})
		return
	}
	c.JSON(http.StatusCreated, p)
}
