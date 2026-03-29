package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/models"
	"real_estate_crm/internal/repository"
	"real_estate_crm/internal/utils"
)

// WhatsAppWebhookGET handles Meta's webhook verification
func WhatsAppWebhookGET(c *gin.Context) {
	verifyToken := os.Getenv("WHATSAPP_VERIFY_TOKEN")
	mode := c.Query("hub.mode")
	token := c.Query("hub.verify_token")
	challenge := c.Query("hub.challenge")

	if mode == "subscribe" && token == verifyToken {
		c.String(http.StatusOK, challenge)
		return
	}
	c.Status(http.StatusForbidden)
}

// WhatsAppWebhookPOST handles incoming WhatsApp messages
func WhatsAppWebhookPOST(c *gin.Context) {
	var body struct {
		Object string `json:"object"`
		Entry  []struct {
			Changes []struct {
				Value struct {
					Messages []struct {
						From      string `json:"from"`
						ID        string `json:"id"`
						Timestamp string `json:"timestamp"`
						Type      string `json:"type"`
						Text      struct {
							Body string `json:"body"`
						} `json:"text,omitempty"`
						Image struct {
							ID      string `json:"id"`
							Caption string `json:"caption,omitempty"`
						} `json:"image,omitempty"`
						Document struct {
							ID       string `json:"id"`
							Caption  string `json:"caption,omitempty"`
							Filename string `json:"filename,omitempty"`
						} `json:"document,omitempty"`
					} `json:"messages"`
					Statuses []struct {
						ID     string `json:"id"`
						Status string `json:"status"`
					} `json:"statuses"`
				} `json:"value"`
			} `json:"changes"`
		} `json:"entry"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		log.Printf("Webhook decode error: %v", err)
		c.Status(http.StatusBadRequest)
		return
	}

	client := utils.NewWhatsAppClient()

	for _, entry := range body.Entry {
		for _, change := range entry.Changes {
			// Handle status updates (delivered, read)
			for _, s := range change.Value.Statuses {
				repository.UpdateWhatsAppMessageStatus(s.ID, s.Status)
			}

			// Handle incoming messages
			for _, m := range change.Value.Messages {
				log.Printf("Incoming WhatsApp message from %s (type: %s)", m.From, m.Type)
				
				// 1. Identify Lead by Phone
				normalizedFrom := utils.NormalizePhone(m.From)
				leadID, err := repository.FindLeadByPhone(normalizedFrom)
				if err != nil {
					log.Printf("Ignoring message from %s: no matching lead found.", m.From)
					continue
				}

				// 2. Prepare Message Record
				msg := models.WhatsAppMessage{
					LeadID:      leadID,
					WAMessageID: m.ID,
					Direction:   "incoming",
					MessageType: m.Type,
					Status:      "received",
					Timestamp:   time.Now(), // Meta provides timestamp in seconds but we use time.Now for simplicity here
				}

				// 3. Handle different message types
				switch m.Type {
				case "text":
					msg.Content = m.Text.Body
				case "image":
					mediaURL, _ := client.GetMediaURL(m.Image.ID)
					if mediaURL != "" {
						reader, contentType, _ := client.DownloadMedia(mediaURL)
						if reader != nil {
							filename := m.Image.ID + ".jpg"
							finalURL, _ := utils.UploadToS3(context.Background(), reader, filename, contentType)
							msg.Content = finalURL
							msg.MediaCaption = m.Image.Caption
							reader.Close()
						}
					}
				case "document":
					mediaURL, _ := client.GetMediaURL(m.Document.ID)
					if mediaURL != "" {
						reader, contentType, _ := client.DownloadMedia(mediaURL)
						if reader != nil {
							filename := m.Document.Filename
							if filename == "" { filename = m.Document.ID }
							finalURL, _ := utils.UploadToS3(context.Background(), reader, filename, contentType)
							msg.Content = finalURL
							msg.MediaCaption = m.Document.Caption
							reader.Close()
						}
					}
				}

				// 4. Save to DB
				if msg.Content != "" {
					repository.SaveWhatsAppMessage(msg)
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetWhatsAppChats returns the message history for a lead
func GetWhatsAppChats(c *gin.Context) {
	leadID := c.Param("lead_id") // Use Param if URL is .../chats/:lead_id
	if leadID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lead_id is required"})
		return
	}

	var lid int
	fmt.Sscanf(leadID, "%d", &lid)

	messages, err := repository.GetWhatsAppMessagesByLeadID(lid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chat history"})
		return
	}
	c.JSON(http.StatusOK, messages)
}

// SendWhatsAppMessage sends an outgoing message
func SendWhatsAppMessage(c *gin.Context) {
	var req models.SendWhatsAppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Get Lead Phone Number
	var phone string
	err := repository.DB.QueryRow(context.Background(), "SELECT phone FROM leads WHERE id = $1", req.LeadID).Scan(&phone)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lead not found"})
		return
	}

	client := utils.NewWhatsAppClient()
	var waID string

	// 2. Send via Meta API
	normalizedPhone := utils.NormalizePhone(phone)
	switch req.MessageType {
	case "text":
		waID, err = client.SendText(normalizedPhone, req.Content)
	case "image", "document":
		waID, err = client.SendMedia(normalizedPhone, req.MessageType, req.Content, req.MediaCaption)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported message type"})
		return
	}

	if err != nil {
		log.Printf("Failed to send WhatsApp message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message: " + err.Error()})
		return
	}

	// 3. Save to DB
	msg := models.WhatsAppMessage{
		LeadID:      req.LeadID,
		WAMessageID: waID,
		Direction:   "outgoing",
		MessageType: req.MessageType,
		Content:     req.Content,
		MediaCaption: req.MediaCaption,
		Status:      "sent",
		Timestamp:   time.Now(),
	}
	repository.SaveWhatsAppMessage(msg)

	c.JSON(http.StatusOK, msg)
}
