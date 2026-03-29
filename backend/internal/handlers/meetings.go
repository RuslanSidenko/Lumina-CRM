package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"real_estate_crm/internal/repository"
	"real_estate_crm/internal/utils"
)

func GetMeetingAuthURL(c *gin.Context) {
	provider := c.Query("provider")
	if provider != "google" && provider != "zoom" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider"})
		return
	}

	var config *oauth2.Config
	if provider == "google" {
		config = utils.GetGoogleOAuthTokenConfig()
	} else {
		config = utils.GetZoomOAuthTokenConfig()
	}

	// State should be more secure in production (random nonce)
	state := fmt.Sprintf("%v", time.Now().UnixNano())
	url := config.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)

	c.JSON(http.StatusOK, gin.H{"url": url})
}

func MeetingOAuthCallback(c *gin.Context) {
	provider := c.Param("provider")
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code missing"})
		return
	}

	userID, _ := c.Get("userID")
	uid := int(userID.(float64))

	var config *oauth2.Config
	if provider == "google" {
		config = utils.GetGoogleOAuthTokenConfig()
	} else if provider == "zoom" {
		config = utils.GetZoomOAuthTokenConfig()
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider"})
		return
	}

	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange code: " + err.Error()})
		return
	}

	// Save token to DB
	_, err = repository.DB.Exec(context.Background(),
		`INSERT INTO user_oauth_tokens (user_id, provider, access_token, refresh_token, expiry)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (user_id, provider) DO UPDATE SET 
		 access_token = EXCLUDED.access_token,
		 refresh_token = EXCLUDED.refresh_token,
		 expiry = EXCLUDED.expiry`,
		uid, provider, token.AccessToken, token.RefreshToken, token.Expiry)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "provider": provider})
}

func GetMeetingConnections(c *gin.Context) {
	userID, _ := c.Get("userID")
	uid := int(userID.(float64))

	rows, err := repository.DB.Query(context.Background(),
		"SELECT provider FROM user_oauth_tokens WHERE user_id = $1", uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	connections := []string{}
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err == nil {
			connections = append(connections, p)
		}
	}
	c.JSON(http.StatusOK, connections)
}

func DisconnectMeetingService(c *gin.Context) {
	provider := c.Param("provider")
	userID, _ := c.Get("userID")
	uid := int(userID.(float64))

	_, err := repository.DB.Exec(context.Background(),
		"DELETE FROM user_oauth_tokens WHERE user_id = $1 AND provider = $2", uid, provider)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disconnect"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "disconnected"})
}

type BookMeetingRequest struct {
	LeadID          int       `json:"lead_id" binding:"required"`
	Provider        string    `json:"provider" binding:"required"`
	StartTime       time.Time `json:"start_time" binding:"required"`
	DurationMinutes int       `json:"duration_minutes" binding:"required"`
	Title           string    `json:"title" binding:"required"`
}

func BookMeeting(c *gin.Context) {
	var req BookMeetingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	uid := int(userID.(float64))

	// Fetch token from DB
	var token oauth2.Token
	err := repository.DB.QueryRow(context.Background(),
		"SELECT access_token, refresh_token, expiry FROM user_oauth_tokens WHERE user_id = $1 AND provider = $2",
		uid, req.Provider).Scan(&token.AccessToken, &token.RefreshToken, &token.Expiry)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Service not connected"})
		return
	}

	var meetingLink string
	if req.Provider == "google" {
		meetingLink, err = utils.CreateGoogleMeet(context.Background(), &token, req.StartTime, req.DurationMinutes, req.Title)
	} else if req.Provider == "zoom" {
		meetingLink, err = utils.CreateZoomMeeting(context.Background(), &token, req.StartTime, req.DurationMinutes, req.Title)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create meeting: " + err.Error()})
		return
	}

	// Log Interaction
	content := fmt.Sprintf("Meeting scheduled: %s\nLink: %s\nTime: %s", req.Title, meetingLink, req.StartTime.Format(time.RFC3339))
	_, _ = repository.DB.Exec(context.Background(),
		"INSERT INTO interactions (lead_id, agent_id, type, content) VALUES ($1, $2, $3, $4)",
		req.LeadID, uid, "meeting", content)

	// Create Task as well
	_, _ = repository.DB.Exec(context.Background(),
		"INSERT INTO tasks (lead_id, agent_id, title, description, due_at, status) VALUES ($1, $2, $3, $4, $5, $6)",
		req.LeadID, uid, "Meeting: "+req.Title, "Meeting Link: "+meetingLink, req.StartTime, "pending")

	c.JSON(http.StatusOK, gin.H{
		"meeting_link": meetingLink,
		"status":       "Meeting booked successfully",
	})
}
