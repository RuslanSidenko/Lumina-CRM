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

func GetCustomFields(c *gin.Context) {
	entityType := c.Query("entity_type")
	query := "SELECT id, entity_type, label, field_type, options, is_required FROM custom_field_definitions"
	args := []interface{}{}

	if entityType != "" {
		query += " WHERE entity_type = $1"
		args = append(args, entityType)
	}

	rows, err := repository.DB.Query(context.Background(), query, args...)
	if err != nil {
		log.Println("Error querying custom fields:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var fields []models.CustomFieldDefinition
	for rows.Next() {
		var f models.CustomFieldDefinition
		err := rows.Scan(&f.ID, &f.EntityType, &f.Label, &f.FieldType, &f.Options, &f.IsRequired)
		if err != nil {
			log.Println("Scanning error:", err)
			continue
		}
		fields = append(fields, f)
	}
	if fields == nil {
		fields = []models.CustomFieldDefinition{}
	}
	c.JSON(http.StatusOK, fields)
}

func CreateCustomField(c *gin.Context) {
	var f models.CustomFieldDefinition
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO custom_field_definitions (entity_type, label, field_type, options, is_required) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		f.EntityType, f.Label, f.FieldType, f.Options, f.IsRequired).Scan(&f.ID)

	if err != nil {
		log.Println("Create custom field error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create custom field"})
		return
	}
	c.JSON(http.StatusCreated, f)
}

func UpdateCustomField(c *gin.Context) {
	id := c.Param("id")
	var f models.CustomFieldDefinition
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := repository.DB.Exec(context.Background(),
		"UPDATE custom_field_definitions SET label = $1, field_type = $2, options = $3, is_required = $4 WHERE id = $5",
		f.Label, f.FieldType, f.Options, f.IsRequired, id)

	if err != nil {
		log.Println("Update custom field error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update custom field"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Custom field updated"})
}

func DeleteCustomField(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	var label, entityType string
	err := repository.DB.QueryRow(ctx, "SELECT label, entity_type FROM custom_field_definitions WHERE id = $1", id).Scan(&label, &entityType)
	if err != nil {
		log.Println("Find custom field error:", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Field not found"})
		return
	}

	// Purge from all entities
	table := "leads"
	if entityType == "property" {
		table = "properties"
	}
	purgeQuery := fmt.Sprintf("UPDATE %s SET custom_fields = custom_fields - $1", table)
	_, _ = repository.DB.Exec(ctx, purgeQuery, label)

	// Finally delete the definition
	_, err = repository.DB.Exec(ctx, "DELETE FROM custom_field_definitions WHERE id = $1", id)
	if err != nil {
		log.Println("Delete custom field error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete custom field"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Custom field deleted and data purged"})
}
