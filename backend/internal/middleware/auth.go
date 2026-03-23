package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
)

var JwtSecret = []byte("super_secret_crm_key") // Use ENV var in production

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return JwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid claims"})
			c.Abort()
			return
		}

		c.Set("userID", claims["user_id"])
		c.Set("userRole", claims["role"])
		c.Next()
	}
}

func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists || userRole.(string) != role {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Requires " + role + " access"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequirePermission(resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		roleName := userRole.(string)
		fmt.Printf("[RBAC DEBUG] Path: %s | Role: %s | Resource: %s | Action: %s\n", c.Request.URL.Path, roleName, resource, action)

		if roleName == "admin" {
			fmt.Println("[RBAC DEBUG] Admin bypass allowed.")
			c.Next() // Admin always bypasses specific permission checks
			return
		}

		var p models.RolePermission
		err := repository.DB.QueryRow(context.Background(),
			"SELECT can_view, can_view_all, can_create, can_edit, can_edit_all, can_delete, restricted_fields FROM role_permissions WHERE role_name = $1 AND resource = $2",
			roleName, resource).Scan(&p.CanView, &p.CanViewAll, &p.CanCreate, &p.CanEdit, &p.CanEditAll, &p.CanDelete, &p.RestrictedFields)

		if err != nil {
			fmt.Printf("[RBAC DEBUG] Error fetching permissions for role %s: %v\n", roleName, err)
			c.JSON(http.StatusForbidden, gin.H{"error": "Permissions not defined for this role"})
			c.Abort()
			return
		}

		allowed := false
		switch action {
		case "view":
			allowed = p.CanView
		case "create":
			allowed = p.CanCreate
		case "edit":
			allowed = p.CanEdit || p.CanEditAll
		case "delete":
			allowed = p.CanDelete
		}

		if !allowed {
			fmt.Printf("[RBAC DEBUG] Forbidden: Role %s does not have %s on %s\n", roleName, action, resource)
			c.JSON(http.StatusForbidden, gin.H{"error": fmt.Sprintf("You do not have permission to %s %s", action, resource)})
			c.Abort()
			return
		}

	c.Set("permissions", p)
		c.Next()
	}
}

func RequireAPIKey() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "X-API-Key header required"})
			c.Abort()
			return
		}

		var id int
		err := repository.DB.QueryRow(context.Background(), "SELECT id FROM api_keys WHERE key = $1", apiKey).Scan(&id)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API Key"})
			c.Abort()
			return
		}

		c.Next()
	}
}
