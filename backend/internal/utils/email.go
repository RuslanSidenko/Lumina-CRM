package utils

import (
	"fmt"
	"net/smtp"
	"os"
)

func SendEmail(to, subject, body string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")

	if host == "" || user == "" || pass == "" {
		return fmt.Errorf("SMTP configuration is not set")
	}

	auth := smtp.PlainAuth("", user, pass, host)
	
	msg := fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n"+
		"\r\n"+
		"%s\r\n", from, to, subject, body)

	addr := fmt.Sprintf("%s:%s", host, port)
	return smtp.SendMail(addr, auth, from, []string{to}, []byte(msg))
}
