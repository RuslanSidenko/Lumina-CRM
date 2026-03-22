package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

func GetRolePermissions(c *gin.Context) {
	rows, err := repository.DB.Query(context.Background(), 
		"SELECT id, role_name, resource, can_view, can_view_all, can_create, can_edit, can_edit_all, can_delete, restricted_fields FROM role_permissions")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var perms []models.RolePermission
	for rows.Next() {
		var p models.RolePermission
		err := rows.Scan(&p.ID, &p.RoleName, &p.Resource, &p.CanView, &p.CanViewAll, &p.CanCreate, &p.CanEdit, &p.CanEditAll, &p.CanDelete, &p.RestrictedFields)
		if err != nil {
			continue
		}
		perms = append(perms, p)
	}
	if perms == nil {
		perms = []models.RolePermission{}
	}
	c.JSON(http.StatusOK, perms)
}

func UpdateRolePermission(c *gin.Context) {
	id := c.Param("id")
	var p models.RolePermission
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := repository.DB.Exec(context.Background(),
		`UPDATE role_permissions SET 
			can_view=$1, can_view_all=$2, can_create=$3, can_edit=$4, can_edit_all=$5, can_delete=$6, restricted_fields=$7 
		 WHERE id=$8`,
		p.CanView, p.CanViewAll, p.CanCreate, p.CanEdit, p.CanEditAll, p.CanDelete, p.RestrictedFields, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update permission"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Permission updated successfully"})
}

func CreateRole(c *gin.Context) {
	var req struct {
		RoleName string `json:"role_name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resources := []string{"leads", "properties", "deals", "tasks", "interactions", "users", "custom_fields"}
	for _, res := range resources {
		_, _ = repository.DB.Exec(context.Background(),
			"INSERT INTO role_permissions (role_name, resource) VALUES ($1, $2) ON CONFLICT DO NOTHING",
			req.RoleName, res)
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Role created successfully"})
}
