package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"real_estate_crm/internal/repository"
)

type AnalyticsSummary struct {
	TotalLeads       int            `json:"total_leads"`
	ActiveProperties int            `json:"active_properties"`
	TotalRevenue     int            `json:"total_revenue"`
	LeadStatusCounts map[string]int `json:"lead_status_counts"`
	DealStatusCounts map[string]int `json:"deal_status_counts"`
}

func GetAnalytics(c *gin.Context) {
	ctx := context.Background()
	role, _ := c.Get("userRole")
	userID, _ := c.Get("userID")

	var summary AnalyticsSummary
	summary.LeadStatusCounts = make(map[string]int)
	summary.DealStatusCounts = make(map[string]int)

	// Total Leads
	lQuery := "SELECT COUNT(*) FROM leads"
	pQuery := "SELECT COUNT(*) FROM properties WHERE status = 'Available'"
	dQuery := "SELECT COALESCE(SUM(price), 0) FROM deals WHERE status = 'Closed'"
	lBreakdown := "SELECT status, COUNT(*) FROM leads GROUP BY status"
	dBreakdown := "SELECT status, COUNT(*) FROM deals GROUP BY status"

	if role.(string) == "agent" {
		lQuery += " WHERE assigned_to = $1"
		pQuery += " AND agent_id = $1"
		dQuery += " AND agent_id = $1"
		lBreakdown = "SELECT status, COUNT(*) FROM leads WHERE assigned_to = $1 GROUP BY status"
		dBreakdown = "SELECT status, COUNT(*) FROM deals WHERE agent_id = $1 GROUP BY status"
	}

	_ = repository.DB.QueryRow(ctx, lQuery, condID(role, userID)...).Scan(&summary.TotalLeads)
	_ = repository.DB.QueryRow(ctx, pQuery, condID(role, userID)...).Scan(&summary.ActiveProperties)
	_ = repository.DB.QueryRow(ctx, dQuery, condID(role, userID)...).Scan(&summary.TotalRevenue)

	// Lead Status Breakdown
	rows, _ := repository.DB.Query(ctx, lBreakdown, condID(role, userID)...)
	if rows != nil {
		for rows.Next() {
			var status string
			var count int
			_ = rows.Scan(&status, &count)
			summary.LeadStatusCounts[status] = count
		}
		rows.Close()
	}

	// Deal Status Breakdown
	drows, _ := repository.DB.Query(ctx, dBreakdown, condID(role, userID)...)
	if drows != nil {
		for drows.Next() {
			var status string
			var count int
			_ = drows.Scan(&status, &count)
			summary.DealStatusCounts[status] = count
		}
		drows.Close()
	}

	c.JSON(http.StatusOK, summary)
}

func condID(role any, id any) []interface{} {
	if role.(string) == "agent" {
		uid := int(id.(float64))
		return []interface{}{uid}
	}
	return []interface{}{}
}
