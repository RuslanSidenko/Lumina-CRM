package utils

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"real_estate_crm/internal/repository"
)

func StartLeadAutomation() {
	go func() {
		for {
			log.Println("Checking for unassigned leads...")
			processUnassignedLeads()
			time.Sleep(5 * time.Minute)
		}
	}()
}

func processUnassignedLeads() {
	// 1. Get Automation Setting
	var algorithm string
	err := repository.DB.QueryRow(context.Background(),
		"SELECT value FROM automation_settings WHERE key = 'lead_assignment_algorithm'").Scan(&algorithm)

	if err != nil || algorithm == "off" || algorithm == "" {
		return
	}

	// 2. Find unassigned leads
	rows, err := repository.DB.Query(context.Background(), "SELECT id FROM leads WHERE assigned_to IS NULL")
	if err != nil {
		return
	}
	defer rows.Close()

	var leadIDs []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err == nil {
			leadIDs = append(leadIDs, id)
		}
	}

	if len(leadIDs) == 0 {
		return
	}

	log.Printf("Found %d unassigned leads. Assigning using %s...", len(leadIDs), algorithm)

	for _, leadID := range leadIDs {
		userID := findTargetUser(algorithm)
		if userID != 0 {
			_, _ = repository.DB.Exec(context.Background(), "UPDATE leads SET assigned_to = $1 WHERE id = $2", userID, leadID)
			log.Printf("Assigned lead %d to user %d", leadID, userID)
		}
	}
}

func findTargetUser(algorithm string) int {
	var userID int

	// 1. Check if we should prioritize active users
	var prioritizeActive string
	_ = repository.DB.QueryRow(context.Background(),
		"SELECT value FROM automation_settings WHERE key = 'prioritize_active_users'").Scan(&prioritizeActive)

	activeWindow := time.Now().Add(-24 * time.Hour)
	userFilter := "WHERE 1=1"
	if prioritizeActive == "true" {
		// Only consider users active in the last 24h
		userFilter = fmt.Sprintf("WHERE last_login_at >= '%s'", activeWindow.Format("2006-01-02 15:04:05"))
	}

	switch algorithm {
	case "round_robin":
		// Get eligible users based on filter
		rows, _ := repository.DB.Query(context.Background(), fmt.Sprintf("SELECT id FROM users %s ORDER BY id ASC", userFilter))
		var users []int
		for rows.Next() {
			var id int
			rows.Scan(&id)
			users = append(users, id)
		}
		rows.Close()

		// Fallback if no active users found but priority was on
		if len(users) == 0 && prioritizeActive == "true" {
			rows, _ = repository.DB.Query(context.Background(), "SELECT id FROM users ORDER BY id ASC")
			for rows.Next() {
				var id int
				rows.Scan(&id)
				users = append(users, id)
			}
			rows.Close()
		}

		if len(users) == 0 {
			return 0
		}

		// Get last assigned
		var lastIDStr string
		_ = repository.DB.QueryRow(context.Background(), "SELECT value FROM automation_settings WHERE key = 'last_assigned_user_id'").Scan(&lastIDStr)
		lastID, _ := strconv.Atoi(lastIDStr)

		// Find next
		targetIndex := 0
		for i, id := range users {
			if id > lastID {
				targetIndex = i
				break
			}
		}
		userID = users[targetIndex]
		_, _ = repository.DB.Exec(context.Background(),
			"INSERT INTO automation_settings (key, value) VALUES ('last_assigned_user_id', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
			strconv.Itoa(userID))

	case "least_loaded":
		// User with fewest leads among eligible users
		query := fmt.Sprintf(`
			SELECT u.id FROM users u 
			LEFT JOIN leads l ON u.id = l.assigned_to 
			%s
			GROUP BY u.id 
			ORDER BY COUNT(l.id) ASC LIMIT 1`, userFilter)

		err := repository.DB.QueryRow(context.Background(), query).Scan(&userID)

		// Fallback if no active users
		if err != nil && prioritizeActive == "true" {
			_ = repository.DB.QueryRow(context.Background(),
				`SELECT u.id FROM users u 
				 LEFT JOIN leads l ON u.id = l.assigned_to 
				 GROUP BY u.id 
				 ORDER BY COUNT(l.id) ASC LIMIT 1`).Scan(&userID)
		}
	}

	return userID
}
