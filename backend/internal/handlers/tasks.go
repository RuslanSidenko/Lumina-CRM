package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

func GetTasks(c *gin.Context) {
	leadID := c.Query("lead_id")
	propertyID := c.Query("property_id")
	role, _ := c.Get("userRole")
	userID, _ := c.Get("userID")

	query := "SELECT id, lead_id, property_id, agent_id, title, description, due_at, status, created_at FROM tasks WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if role.(string) == "agent" {
		uid := int(userID.(float64))
		query += fmt.Sprintf(" AND agent_id = $%d", argIdx)
		args = append(args, uid)
		argIdx++
	}

	if leadID != "" {
		query += fmt.Sprintf(" AND lead_id = $%d", argIdx)
		args = append(args, leadID)
		argIdx++
	}
	if propertyID != "" {
		query += fmt.Sprintf(" AND property_id = $%d", argIdx)
		args = append(args, propertyID)
		argIdx++
	}
	query += " ORDER BY due_at ASC"

	rows, err := repository.DB.Query(context.Background(), query, args...)
	if err != nil {
		log.Println("Error querying tasks:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		err := rows.Scan(&t.ID, &t.LeadID, &t.PropertyID, &t.AgentID, &t.Title, &t.Description, &t.DueAt, &t.Status, &t.CreatedAt)
		if err != nil {
			log.Println("Scanning task error:", err)
			continue
		}
		tasks = append(tasks, t)
	}
	if tasks == nil { tasks = []models.Task{} }
	c.JSON(http.StatusOK, tasks)
}

func CreateTask(c *gin.Context) {
	var t models.Task
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	t.AgentID = int(userID.(float64))

	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO tasks (lead_id, property_id, agent_id, title, description, due_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
		t.LeadID, t.PropertyID, t.AgentID, t.Title, t.Description, t.DueAt, t.Status).Scan(&t.ID)

	if err != nil {
		log.Println("Create task error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}
	c.JSON(http.StatusCreated, t)
}

func UpdateTaskStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := repository.DB.Exec(context.Background(), "UPDATE tasks SET status = $1 WHERE id = $2", req.Status, id)
	if err != nil {
		log.Println("Update task status error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Task updated successfully"})
}
