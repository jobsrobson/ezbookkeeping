package api

import (
	"testing"
	"time"

	"github.com/mayswind/ezbookkeeping/pkg/models"
	"github.com/mayswind/ezbookkeeping/pkg/utils"
	"github.com/stretchr/testify/assert"
)

func TestCreateInstallmentTransactionModels(t *testing.T) {
	location := time.FixedZone("test", -3*60*60)
	transactionTime := time.Date(2026, time.January, 31, 10, 30, 0, 0, location).Unix()
	req := &models.TransactionCreateRequest{
		Type:             models.TRANSACTION_TYPE_EXPENSE,
		Time:             transactionTime,
		UtcOffset:        -180,
		SourceAccountId:  10,
		SourceAmount:     50003,
		InstallmentCount: 5,
	}

	installments := (&TransactionsApi{}).createInstallmentTransactionModels(1, req, "127.0.0.1")
	assert.Len(t, installments, 5)

	total := int64(0)
	expectedDays := []int{31, 28, 31, 30, 31}
	for i, installment := range installments {
		total += installment.Amount
		assert.Equal(t, int16(i+1), installment.InstallmentNumber)
		assert.Equal(t, int16(5), installment.InstallmentCount)
		installmentDate := time.Unix(utils.GetUnixTimeFromTransactionTime(installment.TransactionTime), 0).In(location)
		assert.Equal(t, expectedDays[i], installmentDate.Day())
	}
	assert.Equal(t, int64(50003), total)
	assert.Equal(t, int64(10001), installments[0].Amount)
	assert.Equal(t, int64(10000), installments[4].Amount)
}

func TestGetCreditCardInstallmentDueTime(t *testing.T) {
	location := time.FixedZone("test", -3*60*60)
	purchaseTime := time.Date(2026, time.August, 8, 10, 0, 0, 0, location).Unix()
	dueTime := getCreditCardInstallmentDueTime(purchaseTime, -180, 5, 12)
	dueDate := time.Unix(dueTime, 0).In(location)
	assert.Equal(t, 2026, dueDate.Year())
	assert.Equal(t, time.September, dueDate.Month())
	assert.Equal(t, 12, dueDate.Day())
}

func TestCreateSubscriptionTemplate(t *testing.T) {
	location := time.FixedZone("test", -3*60*60)
	purchaseTime := time.Date(2026, time.January, 31, 10, 0, 0, 0, location).Unix()
	template := createSubscriptionTemplate(1, &models.TransactionCreateRequest{
		Type:            models.TRANSACTION_TYPE_EXPENSE,
		CategoryId:      2,
		SourceAccountId: 3,
		SourceAmount:    4990,
		Time:            purchaseTime,
		UtcOffset:       -180,
		Comment:         "Netflix",
	})

	assert.True(t, template.Subscription)
	assert.Equal(t, "Netflix", template.Name)
	assert.Equal(t, models.TRANSACTION_SCHEDULE_FREQUENCY_TYPE_MONTHLY, template.ScheduledFrequencyType)
	assert.Equal(t, "-1", template.ScheduledFrequency)
	assert.NotNil(t, template.ScheduledStartTime)
	startDate := time.Unix(*template.ScheduledStartTime, 0).In(location)
	assert.Equal(t, time.February, startDate.Month())
	assert.Equal(t, 1, startDate.Day())
}
