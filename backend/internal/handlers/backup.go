package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/utils"
)

func TriggerBackup(c *gin.Context) {
	// 1. Run pg_dump
	path, err := utils.RunBackup()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create database dump: " + err.Error()})
		return
	}
	defer utils.CleanUp(path)

	// 2. Upload to S3
	err = utils.UploadToS3(path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload backup to S3: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Backup successfully generated and uploaded to S3."})
}
