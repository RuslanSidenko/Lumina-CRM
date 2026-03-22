package handlers

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

func GetDeals(c *gin.Context) {
	role, _ := c.Get("userRole")
	userID, _ := c.Get("userID")

	query := "SELECT id, lead_id, property_id, agent_id, price, status, close_date, created_at FROM deals"
	args := []interface{}{}

	if role.(string) == "agent" {
		uid := int(userID.(float64))
		query += " WHERE agent_id = $1"
		args = append(args, uid)
	}
	query += " ORDER BY created_at DESC"

	rows, err := repository.DB.Query(context.Background(), query, args...)
	if err != nil {
		log.Println("Error querying deals:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var deals []models.Deal
	for rows.Next() {
		var d models.Deal
		err := rows.Scan(&d.ID, &d.LeadID, &d.PropertyID, &d.AgentID, &d.Price, &d.Status, &d.CloseDate, &d.CreatedAt)
		if err != nil {
			log.Println("Scanning deal error:", err)
			continue
		}
		deals = append(deals, d)
	}
	if deals == nil { deals = []models.Deal{} }
	c.JSON(http.StatusOK, deals)
}

func CreateDeal(c *gin.Context) {
	var d models.Deal
	if err := c.ShouldBindJSON(&d); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	d.AgentID = int(userID.(float64))

	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO deals (lead_id, property_id, agent_id, price, status, close_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
		d.LeadID, d.PropertyID, d.AgentID, d.Price, d.Status, d.CloseDate).Scan(&d.ID)

	if err != nil {
		log.Println("Create deal error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create deal"})
		return
	}
	c.JSON(http.StatusCreated, d)
}

func UpdateDealStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := repository.DB.Exec(context.Background(), "UPDATE deals SET status = $1 WHERE id = $2", req.Status, id)
	if err != nil {
		log.Println("Update deal status error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update deal status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deal status updated successfully"})
}
