package utils

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

func GetGoogleOAuthTokenConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Endpoint:     google.Endpoint,
		Scopes: []string{
			"https://www.googleapis.com/auth/calendar.events",
		},
	}
}

func GetZoomOAuthTokenConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("ZOOM_CLIENT_ID"),
		ClientSecret: os.Getenv("ZOOM_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("ZOOM_REDIRECT_URL"),
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://zoom.us/oauth/authorize",
			TokenURL: "https://zoom.us/oauth/token",
		},
		Scopes: []string{"meeting:write"},
	}
}

func CreateGoogleMeet(ctx context.Context, token *oauth2.Token, startTime time.Time, durationMinutes int, title string) (string, error) {
	config := GetGoogleOAuthTokenConfig()
	client := config.Client(ctx, token)

	srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return "", fmt.Errorf("unable to retrieve Calendar client: %v", err)
	}

	endTime := startTime.Add(time.Duration(durationMinutes) * time.Minute)

	event := &calendar.Event{
		Summary:     title,
		Description: "Meeting scheduled via Lumina CRM",
		Start: &calendar.EventDateTime{
			DateTime: startTime.Format(time.RFC3339),
			TimeZone: "UTC",
		},
		End: &calendar.EventDateTime{
			DateTime: endTime.Format(time.RFC3339),
			TimeZone: "UTC",
		},
		ConferenceData: &calendar.ConferenceData{
			CreateRequest: &calendar.CreateConferenceRequest{
				RequestId: fmt.Sprintf("meet-%d", time.Now().UnixNano()),
				ConferenceSolutionKey: &calendar.ConferenceSolutionKey{
					Type: "hangoutsMeet",
				},
			},
		},
	}

	event, err = srv.Events.Insert("primary", event).ConferenceDataVersion(1).Do()
	if err != nil {
		return "", fmt.Errorf("unable to create event: %v", err)
	}

	return event.HangoutLink, nil
}

type ZoomMeetingRequest struct {
	Topic     string `json:"topic"`
	Type      int    `json:"type"` // 2 for scheduled meeting
	StartTime string `json:"start_time"`
	Duration  int    `json:"duration"`
	Settings  struct {
		JoinBeforeHost bool `json:"join_before_host"`
		JbhTime        int  `json:"jbh_time"` // 0, 5, 10
	} `json:"settings"`
}

type ZoomMeetingResponse struct {
	JoinURL string `json:"join_url"`
}

func CreateZoomMeeting(ctx context.Context, token *oauth2.Token, startTime time.Time, durationMinutes int, title string) (string, error) {
	config := GetZoomOAuthTokenConfig()
	client := config.Client(ctx, token)

	reqBody := ZoomMeetingRequest{
		Topic:     title,
		Type:      2,
		StartTime: startTime.Format("2006-01-02T15:04:05Z"),
		Duration:  durationMinutes,
	}
	reqBody.Settings.JoinBeforeHost = true

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	resp, err := client.Post("https://api.zoom.us/v2/users/me/meetings", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("zoom api error: status %d", resp.StatusCode)
	}

	var zoomResp ZoomMeetingResponse
	if err := json.NewDecoder(resp.Body).Decode(&zoomResp); err != nil {
		return "", err
	}

	return zoomResp.JoinURL, nil
}
