package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

func GetLeads(c *gin.Context) {
	role, _ := c.Get("userRole")
	userID, _ := c.Get("userID")
	perms, hasPerms := c.Get("permissions")

	// Get query params
	search := c.Query("search")
	queryParams := c.Request.URL.Query()
	statuses := queryParams["status"]
	excludeStatus := c.Query("exclude_status") == "true"
	unassignedOnly := c.Query("unassigned_only") == "true"
	assignedTo := c.Query("assigned_to")
	createdBy := c.Query("created_by")
	source := c.Query("source")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := "SELECT id, name, phone, email, status, assigned_to, source, custom_fields, created_at FROM leads WHERE 1=1"
	args := []interface{}{}
	argCount := 1

	// Dynamic Filters
	if search != "" {
		query += fmt.Sprintf(" AND (name ILIKE $%d OR email ILIKE $%d OR phone LIKE $%d OR source ILIKE $%d)", argCount, argCount, argCount, argCount)
		args = append(args, "%"+search+"%")
		argCount++
	}
	
	if len(statuses) > 0 {
		operator := "IN"
		if excludeStatus {
			operator = "NOT IN"
		}
		
		placeholders := []string{}
		for _, s := range statuses {
			if s == "" { continue }
			placeholders = append(placeholders, fmt.Sprintf("$%d", argCount))
			args = append(args, s)
			argCount++
		}
		if len(placeholders) > 0 {
			query += fmt.Sprintf(" AND status %s (%s)", operator, strings.Join(placeholders, ","))
		}
	}

	if unassignedOnly {
		query += " AND assigned_to IS NULL"
	} else if assignedTo != "" {
		query += fmt.Sprintf(" AND assigned_to = $%d", argCount)
		args = append(args, assignedTo)
		argCount++
	}

	if createdBy != "" {
		query += fmt.Sprintf(" AND created_by = $%d", argCount)
		args = append(args, createdBy)
		argCount++
	}

	if source != "" {
		query += fmt.Sprintf(" AND source = $%d", argCount)
		args = append(args, source)
		argCount++
	}
	
	// Custom Fields Filtering (params starting with cf_)
	for key, values := range queryParams {
		if strings.HasPrefix(key, "cf_") && len(values) > 0 && values[0] != "" {
			fieldName := strings.TrimPrefix(key, "cf_")
			// We use ->> to get text value from JSONB and compare
			query += fmt.Sprintf(" AND custom_fields ->> $%d ILIKE $%d", argCount, argCount+1)
			args = append(args, fieldName, "%"+values[0]+"%")
			argCount += 2
		}
	}

	if startDate != "" {
		query += fmt.Sprintf(" AND created_at >= $%d", argCount)
		args = append(args, startDate)
		argCount++
	}
	if endDate != "" {
		query += fmt.Sprintf(" AND created_at <= $%d", argCount)
		args = append(args, endDate)
		argCount++
	}

	// RBAC row-level filtering:
	if role.(string) != "admin" && hasPerms {
		p := perms.(models.RolePermission)
		if !p.CanViewAll {
			uid := int(userID.(float64))
			query += fmt.Sprintf(" AND (assigned_to = $%d OR created_by = $%d)", argCount, argCount)
			args = append(args, uid)
			argCount++
		}
	} else if role.(string) == "agent" { // Fallback for legacy
		uid := int(userID.(float64))
		query += fmt.Sprintf(" AND (assigned_to = $%d OR created_by = $%d)", argCount, argCount)
		args = append(args, uid)
		argCount++
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
		err := rows.Scan(&l.ID, &l.Name, &l.Phone, &l.Email, &l.Status, &l.AssignedTo, &l.Source, &l.CustomFields, &l.CreatedAt)
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
	uid := int(userID.(float64))

	if req.Source == "" {
		req.Source = "manual"
	}

	var newID int
	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO leads (name, phone, email, status, assigned_to, source, custom_fields, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
		req.Name, req.Phone, req.Email, req.Status, req.AssignedTo, req.Source, req.CustomFields, uid).Scan(&newID)

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
		"SELECT name, phone, email, status, assigned_to, source, custom_fields FROM leads WHERE id=$1", id).
		Scan(&current.Name, &current.Phone, &current.Email, &current.Status, &current.AssignedTo, &current.Source, &current.CustomFields)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lead not found"})
		return
	}

	// 3. Field-level protection: Restore restricted fields from the previous state
	if hasPerms {
		p := perms.(models.RolePermission)
		var violations []string
		log.Printf("DEBUG: Restricted fields for this user: %v", p.RestrictedFields)
		
		customKeys := []string{}
		for k := range l.CustomFields {
			customKeys = append(customKeys, k)
		}
		log.Printf("DEBUG: Custom fields in request: %v", customKeys)

		for _, rf := range p.RestrictedFields {
			isViolated := false
			fieldKey := strings.ToLower(rf)
			
			switch fieldKey {
			case "name": if l.Name != current.Name { isViolated = true; l.Name = current.Name }
			case "phone": if l.Phone != current.Phone { isViolated = true; l.Phone = current.Phone }
			case "email": if l.Email != current.Email { isViolated = true; l.Email = current.Email }
			case "status": if l.Status != current.Status { isViolated = true; l.Status = current.Status }
			case "assigned_to": 
				if (l.AssignedTo == nil && current.AssignedTo != nil) || (l.AssignedTo != nil && current.AssignedTo == nil) || (l.AssignedTo != nil && current.AssignedTo != nil && *l.AssignedTo != *current.AssignedTo) {
					isViolated = true; l.AssignedTo = current.AssignedTo
				}
			}

			// Custom fields check (case-insensitive key matching)
			if l.CustomFields != nil {
				for k, newVal := range l.CustomFields {
					if strings.EqualFold(k, rf) {
						oldVal, exists := current.CustomFields[k]
						if !exists || !reflect.DeepEqual(newVal, oldVal) {
							isViolated = true
							l.CustomFields[k] = oldVal
						}
					}
				}
			}

			if isViolated {
				violations = append(violations, rf)
			}
		}
		if len(violations) > 0 {
			log.Printf("Update blocked for user %v due to violations: %v", userID, violations)
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to modify: " + strings.Join(violations, ", ")})
			return
		}
	}

	_, err = repository.DB.Exec(context.Background(),
		"UPDATE leads SET name=$1, phone=$2, email=$3, status=$4, assigned_to=$5, source=$6, custom_fields=$7 WHERE id=$8",
		l.Name, l.Phone, l.Email, l.Status, l.AssignedTo, l.Source, l.CustomFields, id)

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

func CreatePublicLead(c *gin.Context) {
	var req models.CreateLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default values for public leads
	if req.Status == "" {
		req.Status = "New"
	}
	if req.Source == "" {
		req.Source = "external"
	}
	if req.CustomFields == nil {
		req.CustomFields = make(map[string]interface{})
	}

	// For public leads, we might not have an assigned_to yet
	var newID int
	err := repository.DB.QueryRow(context.Background(),
		"INSERT INTO leads (name, phone, email, status, assigned_to, source, custom_fields) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
		req.Name, req.Phone, req.Email, req.Status, req.AssignedTo, req.Source, req.CustomFields).Scan(&newID)

	if err != nil {
		log.Println("Failed to create public lead:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process lead source"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Lead received successfully", "id": newID})
}
