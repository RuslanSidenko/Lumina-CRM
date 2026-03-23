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
	perms, hasPerms := c.Get("permissions")

	query := "SELECT id, title, address, description, price, bedrooms, bathrooms, area, status, agent_id, images, custom_fields, created_at FROM properties"
	args := []interface{}{}

	if role.(string) != "admin" && hasPerms {
		p := perms.(models.RolePermission)
		if !p.CanViewAll {
			uid := int(userID.(float64))
			query += " WHERE agent_id = $1"
			args = append(args, uid)
		}
	} else if role.(string) == "agent" {
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

		if hasPerms {
			perm := perms.(models.RolePermission)
			for _, rf := range perm.RestrictedFields {
				switch rf {
				case "price": p.Price = 0
				case "description": p.Description = "***"
				case "custom_fields": p.CustomFields = nil
				}
				if p.CustomFields != nil {
					delete(p.CustomFields, rf)
				}
			}
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

func UpdateProperty(c *gin.Context) {
	id := c.Param("id")
	role, _ := c.Get("userRole")
	userID, _ := c.Get("userID")
	perms, hasPerms := c.Get("permissions")

	var p models.Property
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if role.(string) != "admin" && hasPerms {
		perm := perms.(models.RolePermission)
		if !perm.CanEditAll {
			var agentID int
			err := repository.DB.QueryRow(context.Background(), "SELECT agent_id FROM properties WHERE id = $1", id).Scan(&agentID)
			if err != nil || agentID != int(userID.(float64)) {
				c.JSON(http.StatusForbidden, gin.H{"error": "You only have permission to edit your own listings"})
				return
			}
		}
	}

	var current models.Property
	err := repository.DB.QueryRow(context.Background(), 
		"SELECT title, address, description, price, bedrooms, bathrooms, area, status, images, custom_fields FROM properties WHERE id=$1", id).
		Scan(&current.Title, &current.Address, &current.Description, &current.Price, &current.Bedrooms, &current.Bathrooms, &current.Area, &current.Status, &current.Images, &current.CustomFields)
	
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}

	if hasPerms {
		perm := perms.(models.RolePermission)
		for _, rf := range perm.RestrictedFields {
			switch rf {
			case "title": p.Title = current.Title
			case "price": p.Price = current.Price
			case "description": p.Description = current.Description
			}
			if p.CustomFields != nil && current.CustomFields != nil {
				if _, restricted := p.CustomFields[rf]; restricted {
					p.CustomFields[rf] = current.CustomFields[rf]
				}
			}
		}
	}

	_, err = repository.DB.Exec(context.Background(),
		"UPDATE properties SET title=$1, address=$2, description=$3, price=$4, bedrooms=$5, bathrooms=$6, area=$7, status=$8, images=$9, custom_fields=$10 WHERE id=$11",
		p.Title, p.Address, p.Description, p.Price, p.Bedrooms, p.Bathrooms, p.Area, p.Status, p.Images, p.CustomFields, id)

	if err != nil {
		log.Println("Update property error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Property updated successfully"})
}

func CreatePublicProperty(c *gin.Context) {
	var p models.Property
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if p.Status == "" {
		p.Status = "Pending Review"
	}
	if p.CustomFields == nil {
		p.CustomFields = make(map[string]interface{})
	}

	var err error
	if p.AgentID == 0 {
		err = repository.DB.QueryRow(context.Background(),
			"INSERT INTO properties (title, address, description, price, bedrooms, bathrooms, area, status, agent_id, images, custom_fields) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9, $10) RETURNING id",
			p.Title, p.Address, p.Description, p.Price, p.Bedrooms, p.Bathrooms, p.Area, p.Status, p.Images, p.CustomFields).Scan(&p.ID)
	} else {
		err = repository.DB.QueryRow(context.Background(),
			"INSERT INTO properties (title, address, description, price, bedrooms, bathrooms, area, status, agent_id, images, custom_fields) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
			p.Title, p.Address, p.Description, p.Price, p.Bedrooms, p.Bathrooms, p.Area, p.Status, p.AgentID, p.Images, p.CustomFields).Scan(&p.ID)
	}

	if err != nil {
		log.Println("Create public property error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create public property listing"})
		return
	}
	c.JSON(http.StatusCreated, p)
}
