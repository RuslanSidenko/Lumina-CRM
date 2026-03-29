package repository

import (
	"context"
	"real_estate_crm/internal/models"
)

func SaveWhatsAppMessage(msg models.WhatsAppMessage) error {
	_, err := DB.Exec(context.Background(),
		`INSERT INTO whatsapp_messages (lead_id, wa_message_id, direction, message_type, content, media_caption, status, timestamp)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 ON CONFLICT (wa_message_id) DO UPDATE SET status = EXCLUDED.status`,
		msg.LeadID, msg.WAMessageID, msg.Direction, msg.MessageType, msg.Content, msg.MediaCaption, msg.Status, msg.Timestamp)
	return err
}

func GetWhatsAppMessagesByLeadID(leadID int) ([]models.WhatsAppMessage, error) {
	rows, err := DB.Query(context.Background(),
		"SELECT id, lead_id, wa_message_id, direction, message_type, content, media_caption, status, timestamp, created_at FROM whatsapp_messages WHERE lead_id = $1 ORDER BY timestamp ASC",
		leadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.WhatsAppMessage
	for rows.Next() {
		var m models.WhatsAppMessage
		err := rows.Scan(&m.ID, &m.LeadID, &m.WAMessageID, &m.Direction, &m.MessageType, &m.Content, &m.MediaCaption, &m.Status, &m.Timestamp, &m.CreatedAt)
		if err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, nil
}

func FindLeadByPhone(phone string) (int, error) {
	var id int
	// Normalize the incoming phone: remove any symbols like '+', '(', ')', '-', ' '
	// We'll also normalize the 'phone' column in the DB to compare digits only.
	err := DB.QueryRow(context.Background(),
		`SELECT id FROM leads 
		 WHERE regexp_replace(phone, '\D', '', 'g') = $1 
		    OR regexp_replace(phone, '\D', '', 'g') LIKE '%' || $1 
		 LIMIT 1`,
		phone).Scan(&id)
	return id, err
}

func UpdateWhatsAppMessageStatus(waMessageID, status string) error {
	_, err := DB.Exec(context.Background(),
		"UPDATE whatsapp_messages SET status = $1 WHERE wa_message_id = $2",
		status, waMessageID)
	return err
}
