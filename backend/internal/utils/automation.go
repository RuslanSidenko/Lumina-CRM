package utils

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"real_estate_crm/internal/repository"
)

func StartAutomation() {
	go func() {
		for {
			processUnassignedLeads()
			processUnassignedDeals()
			time.Sleep(2 * time.Minute)
		}
	}()
}

// StartLeadAutomation is kept for backward compatibility if needed elsewhere, but calls StartAutomation
func StartLeadAutomation() {
	StartAutomation()
}

func processUnassignedLeads() {
	var algorithm string
	err := repository.DB.QueryRow(context.Background(),
		"SELECT value FROM automation_settings WHERE key = 'lead_assignment_algorithm'").Scan(&algorithm)

	if err != nil || algorithm == "off" || algorithm == "" {
		return
	}

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
		userID := findTargetUser(algorithm, "leads")
		if userID != 0 {
			_, _ = repository.DB.Exec(context.Background(), "UPDATE leads SET assigned_to = $1 WHERE id = $2", userID, leadID)
			log.Printf("Assigned lead %d to user %d", leadID, userID)
		}
	}
}

func processUnassignedDeals() {
	var algorithm string
	err := repository.DB.QueryRow(context.Background(),
		"SELECT value FROM automation_settings WHERE key = 'deal_assignment_algorithm'").Scan(&algorithm)

	if err != nil || algorithm == "off" || algorithm == "" {
		return
	}

	rows, err := repository.DB.Query(context.Background(), "SELECT id FROM deals WHERE agent_id IS NULL")
	if err != nil {
		return
	}
	defer rows.Close()

	var dealIDs []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err == nil {
			dealIDs = append(dealIDs, id)
		}
	}

	if len(dealIDs) == 0 {
		return
	}

	log.Printf("Found %d unassigned deals. Assigning using %s...", len(dealIDs), algorithm)

	for _, dealID := range dealIDs {
		userID := findTargetUser(algorithm, "deals")
		if userID != 0 {
			_, _ = repository.DB.Exec(context.Background(), "UPDATE deals SET agent_id = $1 WHERE id = $2", userID, dealID)
			log.Printf("Assigned deal %d to user %d", dealID, userID)
		}
	}
}

func findTargetUser(algorithm string, resource string) int {
	var userID int

	// 1. Get Settings
	var prioritizeActive string
	_ = repository.DB.QueryRow(context.Background(),
		"SELECT value FROM automation_settings WHERE key = 'prioritize_active_users'").Scan(&prioritizeActive)

	var rolesStr string
	roleKey := "lead_assignment_roles"
	if resource == "deals" {
		roleKey = "deal_assignment_roles"
	}
	_ = repository.DB.QueryRow(context.Background(),
		"SELECT value FROM automation_settings WHERE key = $1", roleKey).Scan(&rolesStr)

	// 2. Build Filter
	activeWindow := time.Now().Add(-24 * time.Hour)
	filters := []string{"1=1"}
	
	if prioritizeActive == "true" {
		filters = append(filters, fmt.Sprintf("last_login_at >= '%s'", activeWindow.Format("2006-01-02 15:04:05")))
	}

	if rolesStr != "" && rolesStr != "all" {
		roles := strings.Split(rolesStr, ",")
		var quotedRoles []string
		for _, r := range roles {
			quotedRoles = append(quotedRoles, fmt.Sprintf("'%s'", strings.TrimSpace(r)))
		}
		filters = append(filters, fmt.Sprintf("role IN (%s)", strings.Join(quotedRoles, ",")))
	}

	userFilter := "WHERE " + strings.Join(filters, " AND ")

	switch algorithm {
	case "round_robin":
		// Get eligible users
		rows, _ := repository.DB.Query(context.Background(), fmt.Sprintf("SELECT id FROM users %s ORDER BY id ASC", userFilter))
		var users []int
		for rows.Next() {
			var id int
			rows.Scan(&id)
			users = append(users, id)
		}
		rows.Close()

		if len(users) == 0 {
			return 0
		}

		// Get last assigned for this resource
		lastAssignedKey := "last_assigned_lead_user_id"
		if resource == "deals" {
			lastAssignedKey = "last_assigned_deal_user_id"
		}
		
		var lastIDStr string
		_ = repository.DB.QueryRow(context.Background(), "SELECT value FROM automation_settings WHERE key = $1", lastAssignedKey).Scan(&lastIDStr)
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
			"INSERT INTO automation_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
			lastAssignedKey, strconv.Itoa(userID))

	case "least_loaded":
		// User with fewest records among eligible users
		table := "leads"
		col := "assigned_to"
		if resource == "deals" {
			table = "deals"
			col = "agent_id"
		}

		query := fmt.Sprintf(`
			SELECT u.id FROM users u 
			LEFT JOIN %s r ON u.id = r.%s 
			%s
			GROUP BY u.id 
			ORDER BY COUNT(r.id) ASC LIMIT 1`, table, col, userFilter)

		_ = repository.DB.QueryRow(context.Background(), query).Scan(&userID)
	}

	return userID
}
