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
	role, _ := c.Get("userRole")
	userID, _ := c.Get("userID")

	if leadID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lead_id is required"})
		return
	}

	query := "SELECT i.id, i.lead_id, i.agent_id, i.type, i.content, i.created_at FROM interactions i"
	args := []interface{}{leadID}

	if role.(string) == "agent" {
		uid := int(userID.(float64))
		query += " JOIN leads l ON i.lead_id = l.id WHERE i.lead_id = $1 AND l.assigned_to = $2"
		args = append(args, uid)
	} else {
		query += " WHERE i.lead_id = $1"
	}
	query += " ORDER BY i.created_at DESC"

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

	userID, _ := c.Get("userID")
	// Cast float64 to int if necessary
	i.AgentID = int(userID.(float64))

	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO interactions (lead_id, agent_id, type, content) VALUES ($1, $2, $3, $4) RETURNING id",
		i.LeadID, i.AgentID, i.Type, i.Content).Scan(&i.ID)

	if err != nil {
		log.Printf("Create interaction error: %v (LeadID: %d, AgentID: %d)", err, i.LeadID, i.AgentID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create interaction: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, i)
}
