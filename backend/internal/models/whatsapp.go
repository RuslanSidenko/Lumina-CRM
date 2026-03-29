package models

import "time"

type WhatsAppMessage struct {
	ID          int       `json:"id"`
	LeadID      int       `json:"lead_id"`
	WAMessageID string    `json:"wa_message_id"` // Meta's identifier
	Direction   string    `json:"direction"`    // incoming, outgoing
	MessageType string    `json:"message_type"` // text, image, document, audio
	Content     string    `json:"content"`      // Text OR URL to S3
	MediaCaption string   `json:"media_caption,omitempty"`
	Status      string    `json:"status"`       // sent, delivered, read, failed
	Timestamp   time.Time `json:"timestamp"`
	CreatedAt   time.Time `json:"created_at"`
}

type SendWhatsAppRequest struct {
	LeadID      int    `json:"lead_id" binding:"required"`
	MessageType string `json:"message_type" binding:"required"` // text, image, document
	Content     string `json:"content" binding:"required"`      // Text OR URL
	MediaCaption string `json:"media_caption"`
}
