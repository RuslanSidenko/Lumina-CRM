package handlers

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

func GetInteractions(c *gin.Context) {
	leadID := c.Query("lead_id")
	query := "SELECT id, lead_id, agent_id, type, content, created_at FROM interactions"
	
	var args []interface{}
	if leadID != "" {
		query += " WHERE lead_id = $1"
		args = append(args, leadID)
	}
	query += " ORDER BY created_at DESC"

	rows, err := repository.DB.Query(context.Background(), query, args...)
	if err != nil {
		log.Println("Error querying interactions:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var interactions []models.Interaction
	for rows.Next() {
		var i models.Interaction
		err := rows.Scan(&i.ID, &i.LeadID, &i.AgentID, &i.Type, &i.Content, &i.CreatedAt)
		if err != nil {
			log.Println("Scanning error:", err)
			continue
		}
		interactions = append(interactions, i)
	}
	if interactions == nil {
		interactions = []models.Interaction{}
	}
	c.JSON(http.StatusOK, interactions)
}

func CreateInteraction(c *gin.Context) {
	var i models.Interaction
	if err := c.ShouldBindJSON(&i); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO interactions (lead_id, agent_id, type, content) VALUES ($1, $2, $3, $4) RETURNING id",
		i.LeadID, i.AgentID, i.Type, i.Content).Scan(&i.ID)

	if err != nil {
		log.Println("Create interaction error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create interaction"})
		return
	}
	c.JSON(http.StatusCreated, i)
}
