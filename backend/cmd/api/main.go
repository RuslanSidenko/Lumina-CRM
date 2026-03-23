package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"real_estate_crm/internal/handlers"
	"real_estate_crm/internal/middleware"
	"real_estate_crm/internal/repository"
	"real_estate_crm/internal/utils"
)

func main() {
	_ = godotenv.Load()
	repository.ConnectDB()

	r := gin.Default()
	r.SetTrustedProxies(nil)

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	origins := []string{"http://localhost:3000", "http://localhost:3001"}
	if allowedOrigin != "" {
		origins = append(origins, allowedOrigin)
	}

	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api/v1")
	{
		// Public Routes
		api.POST("/auth/login", handlers.Login)
		api.POST("/public/leads", middleware.RequireAPIKey(), handlers.CreatePublicLead)

		// Evaluated against Auth JWT token
		protected := api.Group("/")
		protected.Use(middleware.AuthRequired())
		{
			// Auth actions available to all logged-in users
			protected.PUT("/auth/change-password", handlers.ChangePassword)

			// Dynamic RBAC for Leads
			protected.GET("/leads", middleware.RequirePermission("leads", "view"), handlers.GetLeads)
			protected.POST("/leads", middleware.RequirePermission("leads", "create"), handlers.CreateLead)
			protected.PUT("/leads/:id", middleware.RequirePermission("leads", "edit"), handlers.UpdateLead)
			
			// Dynamic RBAC for Properties
			protected.GET("/properties", middleware.RequirePermission("properties", "view"), handlers.GetProperties)
			protected.POST("/properties", middleware.RequirePermission("properties", "create"), handlers.CreateProperty)
			protected.PUT("/properties/:id", middleware.RequirePermission("properties", "edit"), handlers.UpdateProperty)

			// Interaction Logs
			protected.GET("/interactions", middleware.RequirePermission("interactions", "view"), handlers.GetInteractions)
			protected.POST("/interactions", middleware.RequirePermission("interactions", "create"), handlers.CreateInteraction)

			// Task Management
			protected.GET("/tasks", middleware.RequirePermission("tasks", "view"), handlers.GetTasks)
			protected.POST("/tasks", middleware.RequirePermission("tasks", "create"), handlers.CreateTask)
			protected.PATCH("/tasks/:id/status", middleware.RequirePermission("tasks", "edit"), handlers.UpdateTaskStatus)

			// Deal Management
			protected.GET("/deals", middleware.RequirePermission("deals", "view"), handlers.GetDeals)
			protected.POST("/deals", middleware.RequirePermission("deals", "create"), handlers.CreateDeal)
			protected.PATCH("/deals/:id/status", middleware.RequirePermission("deals", "edit"), handlers.UpdateDealStatus)

			// Analytics
			protected.GET("/analytics", middleware.RequirePermission("leads", "view"), handlers.GetAnalytics)

			// User Management (Dynamic RBAC)
			protected.GET("/users", middleware.RequirePermission("users", "view"), handlers.GetUsers)
			protected.POST("/users", middleware.RequirePermission("users", "create"), handlers.CreateUser)
			protected.PUT("/users/:id/role", middleware.RequirePermission("users", "edit"), handlers.UpdateUserRole)
			protected.DELETE("/users/:id", middleware.RequirePermission("users", "delete"), handlers.DeleteUser)

			// Admin Only Sections (Managing Roles, Fields, API Keys)
			adminOnly := protected.Group("/")
			adminOnly.Use(middleware.RequireRole("admin"))
			{
				adminOnly.DELETE("/leads/:id", handlers.DeleteLead)

				// RBAC Management
				adminOnly.GET("/roles", handlers.GetRolePermissions)
				adminOnly.POST("/roles", handlers.CreateRole)
				adminOnly.PUT("/roles/:id", handlers.UpdateRolePermission)

				// Custom Fields Management
				adminOnly.POST("/custom-fields", handlers.CreateCustomField)
				adminOnly.PUT("/custom-fields/:id", handlers.UpdateCustomField)
				adminOnly.DELETE("/custom-fields/:id", handlers.DeleteCustomField)

				// API Key Management
				adminOnly.GET("/api-keys", handlers.GetAPIKeys)
				adminOnly.POST("/api-keys", handlers.CreateAPIKey)
				adminOnly.DELETE("/api-keys/:id", handlers.DeleteAPIKey)

				// Invitations
				adminOnly.POST("/invitations", handlers.CreateInvitation)

				// Backup Management
				adminOnly.POST("/backups/trigger", handlers.TriggerBackup)
				adminOnly.GET("/backups/status", handlers.GetBackupStatus)

				// Automation Management
				adminOnly.GET("/automation/settings", handlers.GetAutomationSettings)
				adminOnly.PUT("/automation/settings", handlers.UpdateAutomationSetting)
			}
			// Agents can also read field definitions
			protected.GET("/custom-fields", handlers.GetCustomFields)
		}

		// Public Invitation validation and fulfillment
		api.GET("/invitations/:token", handlers.GetInvitation)
		api.POST("/invitations/fulfill", handlers.FulfillInvitation)

		// Password Reset
		api.POST("/auth/forgot-password", handlers.ForgotPassword)
		api.POST("/auth/reset-password", handlers.ResetPassword)
	}

	// Start background processes
	utils.StartAutoBackup()
	utils.StartLeadAutomation()


	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Starting Gin backend API on :%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
