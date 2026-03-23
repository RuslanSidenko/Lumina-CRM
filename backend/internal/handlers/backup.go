package handlers

import (
	"context"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/repository"
	"real_estate_crm/internal/utils"
)

func TriggerBackup(c *gin.Context) {
	// 1. Run pg_dump
	path, err := utils.RunBackup()
	if err != nil {
		utils.UpdateBackupStatus("failed", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create database dump: " + err.Error()})
		return
	}
	defer utils.CleanUp(path)

	// 2. Upload to S3
	err = utils.UploadToS3(path)
	if err != nil {
		utils.UpdateBackupStatus("failed", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload backup to S3: " + err.Error()})
		return
	}

	utils.UpdateBackupStatus("success", nil)
	c.JSON(http.StatusOK, gin.H{"message": "Backup successfully generated and uploaded to S3."})
}

func GetBackupStatus(c *gin.Context) {
	bucket := os.Getenv("S3_BUCKET")
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")

	isS3Active := bucket != "" && accessKey != "" && secretKey != ""

	var lastStatus, lastTime string
	_ = repository.DB.QueryRow(context.Background(), "SELECT value FROM automation_settings WHERE key = 'last_backup_status'").Scan(&lastStatus)
	_ = repository.DB.QueryRow(context.Background(), "SELECT value FROM automation_settings WHERE key = 'last_backup_time'").Scan(&lastTime)

	c.JSON(http.StatusOK, gin.H{
		"s3_active":      isS3Active,
		"daily_enabled":  true,
		"last_status":    lastStatus,
		"last_time":      lastTime,
	})
}
