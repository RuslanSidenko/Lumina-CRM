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
)

func main() {
	_ = godotenv.Load()
	repository.ConnectDB()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api/v1")
	{
		// Public Routes
		api.POST("/auth/login", handlers.Login)

		// Evaluated against Auth JWT token
		protected := api.Group("/")
		protected.Use(middleware.AuthRequired())
		{
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

			// Admin Only Sections (Managing Users, Roles, Fields)
			adminOnly := protected.Group("/")
			adminOnly.Use(middleware.RequireRole("admin"))
			{
				adminOnly.GET("/users", handlers.GetUsers)
				adminOnly.POST("/users", handlers.CreateUser)
				adminOnly.PUT("/users/:id/role", handlers.UpdateUserRole)
				adminOnly.DELETE("/users/:id", handlers.DeleteUser)
				adminOnly.DELETE("/leads/:id", handlers.DeleteLead)

				// RBAC Management
				adminOnly.GET("/roles", handlers.GetRolePermissions)
				adminOnly.POST("/roles", handlers.CreateRole)
				adminOnly.PUT("/roles/:id", handlers.UpdateRolePermission)

				// Custom Fields Management
				adminOnly.POST("/custom-fields", handlers.CreateCustomField)
				adminOnly.PUT("/custom-fields/:id", handlers.UpdateCustomField)
				adminOnly.DELETE("/custom-fields/:id", handlers.DeleteCustomField)
			}
			// Agents can also read field definitions
			protected.GET("/custom-fields", handlers.GetCustomFields)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Starting Gin backend API on :%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
