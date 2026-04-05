package utils

import (
	"regexp"
	"strings"
)

// NormalizePhone removes all non-digit characters from a phone number string.
// This is used to match WhatsApp numbers (digits only) with stored lead numbers.
func NormalizePhone(phone string) string {
	// Remove all non-digit characters
	re := regexp.MustCompile(`\D`)
	digits := re.ReplaceAllString(phone, "")
	
	// If the number starts with '00', replace with '+' for international matching logic
	// but WhatsApp Webhook usually sends digits only or with a '+' prefix.
	// We'll stick to digits for the final comparison.
	return strings.TrimPrefix(digits, "00")
}

// IsPhoneMatch checks if two phone numbers are effectively the same
func IsPhoneMatch(p1, p2 string) bool {
	n1 := NormalizePhone(p1)
	n2 := NormalizePhone(p2)
	
	if n1 == "" || n2 == "" {
		return false
	}

	// Simple match for now: if one is a suffix of the other (to handle area codes/country codes)
	// or if they are identical. 
	// Most WhatsApp numbers are [country_code][number].
	if len(n1) > len(n2) {
		return strings.HasSuffix(n1, n2)
	}
	return strings.HasSuffix(n2, n1)
}
