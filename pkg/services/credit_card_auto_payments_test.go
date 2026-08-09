package services

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestInvoiceCycleForDueWhenDueIsAfterClosing(t *testing.T) {
	loc := time.FixedZone("test", -3*60*60)
	start, end, cycle := invoiceCycleForDue(time.Date(2026, 8, 20, 12, 0, 0, 0, loc), 14, 20)
	assert.Equal(t, "2026-07-15/2026-08-14", cycle)
	assert.Equal(t, 15, start.Day())
	assert.Equal(t, 14, end.Day())
}

func TestInvoiceCycleForDueWhenDueIsInFollowingMonth(t *testing.T) {
	loc := time.UTC
	_, _, cycle := invoiceCycleForDue(time.Date(2026, 8, 10, 12, 0, 0, 0, loc), 20, 10)
	assert.Equal(t, "2026-06-21/2026-07-20", cycle)
}
