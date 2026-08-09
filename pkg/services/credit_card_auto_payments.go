package services

import (
	"fmt"
	"sync"
	"time"

	"github.com/mayswind/ezbookkeeping/pkg/core"
	"github.com/mayswind/ezbookkeeping/pkg/datastore"
	"github.com/mayswind/ezbookkeeping/pkg/errs"
	"github.com/mayswind/ezbookkeeping/pkg/models"
	"github.com/mayswind/ezbookkeeping/pkg/utils"
)

type CreditCardAutoPaymentService struct {
	ServiceUsingDB
	schemaMutex sync.Mutex
	schemaReady bool
}

var CreditCardAutoPayments = &CreditCardAutoPaymentService{ServiceUsingDB: ServiceUsingDB{container: datastore.Container}}

func (s *CreditCardAutoPaymentService) EnsureSchema() error {
	s.schemaMutex.Lock()
	defer s.schemaMutex.Unlock()
	if s.schemaReady {
		return nil
	}
	if err := s.container.UserDataStore.SyncStructs(new(models.CreditCardAutoPayment)); err != nil {
		return err
	}
	s.schemaReady = true
	return nil
}

func (s *CreditCardAutoPaymentService) Get(c core.Context, uid, cardId int64) (*models.CreditCardAutoPayment, error) {
	if err := s.EnsureSchema(); err != nil {
		return nil, err
	}
	item := &models.CreditCardAutoPayment{}
	has, err := s.UserDataDB(uid).NewSession(c).ID(cardId).Where("uid=?", uid).Get(item)
	if err != nil || !has {
		return nil, err
	}
	return item, nil
}

func (s *CreditCardAutoPaymentService) Update(c core.Context, item *models.CreditCardAutoPayment) error {
	now := time.Now().Unix()
	existing, err := s.Get(c, item.Uid, item.CreditCardAccountId)
	if err != nil {
		return err
	}
	if existing == nil {
		item.CreatedUnixTime, item.UpdatedUnixTime = now, now
		_, err = s.UserDataDB(item.Uid).NewSession(c).Insert(item)
		return err
	}
	item.UpdatedUnixTime = now
	_, err = s.UserDataDB(item.Uid).NewSession(c).ID(item.CreditCardAccountId).Where("uid=?", item.Uid).
		Cols("source_account_id", "transfer_category_id", "timezone", "timezone_utc_offset", "enabled", "updated_unix_time").Update(item)
	return err
}

func clampDay(year int, month time.Month, day int, loc *time.Location) time.Time {
	last := time.Date(year, month+1, 0, 0, 0, 0, 0, loc).Day()
	if day > last {
		day = last
	}
	return time.Date(year, month, day, 0, 0, 0, 0, loc)
}

func invoiceCycleForDue(now time.Time, closingDay, dueDay int) (time.Time, time.Time, string) {
	statementMonth := now.Month()
	statementYear := now.Year()
	if dueDay <= closingDay {
		previous := time.Date(statementYear, statementMonth-1, 1, 0, 0, 0, 0, now.Location())
		statementMonth, statementYear = previous.Month(), previous.Year()
	}
	end := clampDay(statementYear, statementMonth, closingDay, now.Location())
	previousEnd := clampDay(statementYear, statementMonth-1, closingDay, now.Location())
	start := previousEnd.AddDate(0, 0, 1)
	cycle := fmt.Sprintf("%04d-%02d-%02d/%04d-%02d-%02d", start.Year(), start.Month(), start.Day(), end.Year(), end.Month(), end.Day())
	return start, end.Add(24*time.Hour - time.Second), cycle
}

func (s *CreditCardAutoPaymentService) ProcessDue(c core.Context, currentUnixTime int64) error {
	if err := s.EnsureSchema(); err != nil {
		return err
	}
	for dbIndex := 0; dbIndex < s.container.UserDataStore.Count(); dbIndex++ {
		var configs []*models.CreditCardAutoPayment
		if err := s.container.UserDataStore.Get(dbIndex).NewSession(c).Where("enabled=?", true).Find(&configs); err != nil {
			return err
		}
		for _, config := range configs {
			_ = s.processOne(c, config, currentUnixTime)
		}
	}
	return nil
}

func (s *CreditCardAutoPaymentService) processOne(c core.Context, config *models.CreditCardAutoPayment, currentUnixTime int64) error {
	loc, err := time.LoadLocation(config.Timezone)
	if err != nil {
		loc = time.FixedZone("Automatic Payment Timezone", int(config.TimezoneUtcOffset)*60)
	}
	now := time.Unix(currentUnixTime, 0).In(loc)
	card, err := Accounts.GetAccountByAccountId(c, config.Uid, config.CreditCardAccountId)
	if err != nil || card == nil || card.Extend == nil || card.Extend.CreditCardDueDate == nil || card.Extend.CreditCardStatementDate == nil {
		return err
	}
	if now.Day() != *card.Extend.CreditCardDueDate || now.Hour() < 12 {
		return nil
	}
	start, end, cycle := invoiceCycleForDue(now, *card.Extend.CreditCardStatementDate, *card.Extend.CreditCardDueDate)
	if config.LastInvoiceCycle == cycle {
		return nil
	}
	var gross struct {
		Total int64 `xorm:"total"`
	}
	_, err = s.UserDataDB(config.Uid).NewSession(c).Table(new(models.Transaction)).Select("COALESCE(SUM(amount),0) AS total").
		Where("uid=? AND deleted=? AND type=? AND account_id=? AND transaction_time>=? AND transaction_time<=?", config.Uid, false, models.TRANSACTION_DB_TYPE_EXPENSE, config.CreditCardAccountId, utils.GetMinTransactionTimeFromUnixTime(start.Unix()), utils.GetMaxTransactionTimeFromUnixTime(end.Unix())).Get(&gross)
	if err != nil {
		return err
	}
	if err = Transactions.EnsureCreditCardInvoicePaymentSchema(); err != nil {
		return err
	}
	paid, err := Transactions.GetCreditCardInvoicePaidAmount(c, config.Uid, config.CreditCardAccountId, cycle)
	if err != nil {
		return err
	}
	remaining := gross.Total - paid
	claim := &models.CreditCardAutoPayment{LastInvoiceCycle: cycle, UpdatedUnixTime: time.Now().Unix()}
	rows, err := s.UserDataDB(config.Uid).NewSession(c).ID(config.CreditCardAccountId).Where("uid=? AND last_invoice_cycle<>?", config.Uid, cycle).Cols("last_invoice_cycle", "updated_unix_time").Update(claim)
	if err != nil || rows < 1 {
		return err
	}
	if remaining <= 0 {
		return nil
	}
	_, offset := now.Zone()
	t := &models.Transaction{Uid: config.Uid, Type: models.TRANSACTION_DB_TYPE_TRANSFER_OUT, CategoryId: config.TransferCategoryId, TransactionTime: utils.GetMinTransactionTimeFromUnixTime(currentUnixTime), TimezoneUtcOffset: int16(offset / 60), AccountId: config.SourceAccountId, Amount: remaining, RelatedAccountId: config.CreditCardAccountId, RelatedAccountAmount: remaining, Comment: "Automatic credit card invoice payment", CreditCardInvoiceCycle: cycle, ScheduledCreated: true}
	if err = Transactions.CreateTransaction(c, t, nil, nil); err != nil {
		_, _ = s.UserDataDB(config.Uid).NewSession(c).ID(config.CreditCardAccountId).Cols("last_invoice_cycle").Update(&models.CreditCardAutoPayment{LastInvoiceCycle: ""})
		return errs.Or(err, errs.ErrOperationFailed)
	}
	return nil
}
