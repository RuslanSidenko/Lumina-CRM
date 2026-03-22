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
	perms, hasPerms := c.Get("permissions")

	query := "SELECT id, name, phone, email, status, assigned_to, custom_fields, created_at FROM leads"
	args := []interface{}{}

	// RBAC row-level filtering
	if role.(string) != "admin" && hasPerms {
		p := perms.(models.RolePermission)
		if !p.CanViewAll {
			uid := int(userID.(float64))
			query += " WHERE assigned_to = $1"
			args = append(args, uid)
		}
	} else if role.(string) == "agent" { // Fallback for legacy
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
		
		// RBAC field-level filtering
		if hasPerms {
			p := perms.(models.RolePermission)
			for _, rf := range p.RestrictedFields {
				switch rf {
				case "phone": l.Phone = "***"
				case "email": l.Email = "***"
				case "custom_fields": l.CustomFields = nil
				}
				// Also check custom fields specifically
				if l.CustomFields != nil {
					delete(l.CustomFields, rf)
				}
			}
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

func UpdateLead(c *gin.Context) {
	id := c.Param("id")
	role, _ := c.Get("userRole")
	userID, _ := c.Get("userID")
	perms, hasPerms := c.Get("permissions")

	var l models.Lead
	if err := c.ShouldBindJSON(&l); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. RBAC Check for Edit Permission (Row-level)
	if role.(string) != "admin" && hasPerms {
		p := perms.(models.RolePermission)
		if !p.CanEditAll {
			// Check if lead is assigned to current user
			var assignedTo *int
			err := repository.DB.QueryRow(context.Background(), "SELECT assigned_to FROM leads WHERE id = $1", id).Scan(&assignedTo)
			if err != nil || assignedTo == nil || *assignedTo != int(userID.(float64)) {
				c.JSON(http.StatusForbidden, gin.H{"error": "You only have permission to edit your own leads"})
				return
			}
		}
	}

	// 2. Fetch current lead data for field conservation
	var current models.Lead
	err := repository.DB.QueryRow(context.Background(), 
		"SELECT name, phone, email, status, assigned_to, custom_fields FROM leads WHERE id=$1", id).
		Scan(&current.Name, &current.Phone, &current.Email, &current.Status, &current.AssignedTo, &current.CustomFields)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lead not found"})
		return
	}

	// 3. Field-level protection: Restore restricted fields from the previous state
	if hasPerms {
		p := perms.(models.RolePermission)
		for _, rf := range p.RestrictedFields {
			switch rf {
			case "name": l.Name = current.Name
			case "phone": l.Phone = current.Phone
			case "email": l.Email = current.Email
			case "status": l.Status = current.Status
			case "assigned_to": l.AssignedTo = current.AssignedTo
			}
			// Maintain custom fields if restricted
			if l.CustomFields != nil && current.CustomFields != nil {
				if _, restricted := l.CustomFields[rf]; restricted {
					l.CustomFields[rf] = current.CustomFields[rf]
				}
			}
		}
	}

	_, err = repository.DB.Exec(context.Background(),
		"UPDATE leads SET name=$1, phone=$2, email=$3, status=$4, assigned_to=$5, custom_fields=$6 WHERE id=$7",
		l.Name, l.Phone, l.Email, l.Status, l.AssignedTo, l.CustomFields, id)

	if err != nil {
		log.Println("Update lead error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Lead updated successfully"})
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
