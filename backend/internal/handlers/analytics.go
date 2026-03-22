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
	var summary AnalyticsSummary
	summary.LeadStatusCounts = make(map[string]int)
	summary.DealStatusCounts = make(map[string]int)

	// Total Leads
	_ = repository.DB.QueryRow(ctx, "SELECT COUNT(*) FROM leads").Scan(&summary.TotalLeads)

	// Active Properties
	_ = repository.DB.QueryRow(ctx, "SELECT COUNT(*) FROM properties WHERE status = 'Available'").Scan(&summary.ActiveProperties)

	// Total Revenue (Closed Deals)
	_ = repository.DB.QueryRow(ctx, "SELECT COALESCE(SUM(price), 0) FROM deals WHERE status = 'Closed'").Scan(&summary.TotalRevenue)

	// Lead Status Breakdown
	rows, _ := repository.DB.Query(ctx, "SELECT status, COUNT(*) FROM leads GROUP BY status")
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
	drows, _ := repository.DB.Query(ctx, "SELECT status, COUNT(*) FROM deals GROUP BY status")
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
