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
			// Authorized for Agent + Admin
			protected.GET("/leads", handlers.GetLeads)
			protected.POST("/leads", handlers.CreateLead)
			protected.GET("/properties", handlers.GetProperties)

			// Authorized for Admin ONLY
			adminOnly := protected.Group("/")
			adminOnly.Use(middleware.RequireRole("admin"))
			{
				adminOnly.DELETE("/leads/:id", handlers.DeleteLead)
			}
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
