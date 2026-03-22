package handlers

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

func GetLeads(c *gin.Context) {
	rows, err := repository.DB.Query(context.Background(), "SELECT id, name, phone, email, status, assigned_to, created_at FROM leads ORDER BY created_at DESC")
	if err != nil {
		log.Println("Error querying leads:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var leads []models.Lead
	for rows.Next() {
		var l models.Lead
		err := rows.Scan(&l.ID, &l.Name, &l.Phone, &l.Email, &l.Status, &l.AssignedTo, &l.CreatedAt)
		if err != nil {
			log.Println("Error scanning lead:", err)
			continue
		}
		leads = append(leads, l)
	}
	if leads == nil {
		leads = []models.Lead{}
	}
	c.JSON(http.StatusOK, leads)
}

func CreateLead(c *gin.Context) {
	var req models.CreateLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var newID int
	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO leads (name, phone, email, status, assigned_to) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		req.Name, req.Phone, req.Email, req.Status, req.AssignedTo).Scan(&newID)

	if err != nil {
		log.Println("Failed to create lead:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create lead"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Lead created successfully", "id": newID})
}

func DeleteLead(c *gin.Context) {
	id := c.Param("id")
	
	cmd, err := repository.DB.Exec(context.Background(), "DELETE FROM leads WHERE id = $1", id)
	if err != nil {
		log.Println("Failed to delete lead:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete lead"})
		return
	}

	if cmd.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lead not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Lead deleted successfully"})
}
