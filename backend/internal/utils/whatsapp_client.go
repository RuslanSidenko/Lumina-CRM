package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type WhatsAppClient struct {
	AccessToken string
	PhoneID     string
	BaseURL     string
}

func NewWhatsAppClient() *WhatsAppClient {
	return &WhatsAppClient{
		AccessToken: os.Getenv("WHATSAPP_ACCESS_TOKEN"),
		PhoneID:     os.Getenv("WHATSAPP_PHONE_NUMBER_ID"),
		BaseURL:     "https://graph.facebook.com/v21.0",
	}
}

func (c *WhatsAppClient) SendText(to, text string) (string, error) {
	payload := map[string]interface{}{
		"messaging_product": "whatsapp",
		"to":                to,
		"type":              "text",
		"text": map[string]string{
			"body": text,
		},
	}
	return c.post(payload)
}

func (c *WhatsAppClient) SendMedia(to, mediaType, url, caption string) (string, error) {
	payload := map[string]interface{}{
		"messaging_product": "whatsapp",
		"to":                to,
		"type":              mediaType,
		mediaType: map[string]string{
			"link":    url,
			"caption": caption,
		},
	}
	return c.post(payload)
}

func (c *WhatsAppClient) GetMediaURL(mediaID string) (string, error) {
	reqUrl := fmt.Sprintf("%s/%s", c.BaseURL, mediaID)
	req, _ := http.NewRequest("GET", reqUrl, nil)
	req.Header.Set("Authorization", "Bearer "+c.AccessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get media URL: %s", resp.Status)
	}

	var result struct {
		URL string `json:"url"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	return result.URL, nil
}

func (c *WhatsAppClient) DownloadMedia(url string) (io.ReadCloser, string, error) {
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+c.AccessToken) 

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, "", fmt.Errorf("failed to download media: %s", resp.Status)
	}
	return resp.Body, resp.Header.Get("Content-Type"), nil
}

func (c *WhatsAppClient) post(payload interface{}) (string, error) {
	url := fmt.Sprintf("%s/%s/messages", c.BaseURL, c.PhoneID)
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.AccessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("WhatsApp API error: %s - %s", resp.Status, string(respBody))
	}

	var result struct {
		Messages []struct {
			ID string `json:"id"`
		} `json:"messages"`
	}
	json.Unmarshal(respBody, &result)
	if len(result.Messages) > 0 {
		return result.Messages[0].ID, nil
	}
	return "", fmt.Errorf("no message ID in response")
}
