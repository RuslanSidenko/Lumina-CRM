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
	role, _ := c.Get("userRole")
	userID, _ := c.Get("userID")

	query := "SELECT id, name, phone, email, status, assigned_to, custom_fields, created_at FROM leads"
	args := []interface{}{}

	if role.(string) == "agent" {
		uid := int(userID.(float64))
		query += " WHERE assigned_to = $1"
		args = append(args, uid)
	}
	query += " ORDER BY created_at DESC"

	rows, err := repository.DB.Query(context.Background(), query, args...)
	if err != nil {
		log.Println("Error querying leads:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var leads []models.Lead
	for rows.Next() {
		var l models.Lead
		err := rows.Scan(&l.ID, &l.Name, &l.Phone, &l.Email, &l.Status, &l.AssignedTo, &l.CustomFields, &l.CreatedAt)
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

	userID, _ := c.Get("userID")
	currentUID := int(userID.(float64))

	if req.AssignedTo == nil {
		req.AssignedTo = &currentUID
	}

	if req.CustomFields == nil {
		req.CustomFields = make(map[string]interface{})
	}

	var newID int
	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO leads (name, phone, email, status, assigned_to, custom_fields) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
		req.Name, req.Phone, req.Email, req.Status, req.AssignedTo, req.CustomFields).Scan(&newID)

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
