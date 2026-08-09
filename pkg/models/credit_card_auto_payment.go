package models

// CreditCardAutoPayment stores the recurring automatic-payment configuration for a credit card.
type CreditCardAutoPayment struct {
	CreditCardAccountId int64  `xorm:"PK"`
	Uid                 int64  `xorm:"INDEX NOT NULL"`
	SourceAccountId     int64  `xorm:"NOT NULL"`
	TransferCategoryId  int64  `xorm:"NOT NULL"`
	Timezone            string `xorm:"VARCHAR(64) NOT NULL"`
	TimezoneUtcOffset   int16  `xorm:"NOT NULL"`
	Enabled             bool   `xorm:"INDEX NOT NULL"`
	LastInvoiceCycle    string `xorm:"VARCHAR(21)"`
	CreatedUnixTime     int64
	UpdatedUnixTime     int64
}

type CreditCardAutoPaymentGetRequest struct {
	AccountId int64 `form:"account_id,string" binding:"required,min=1"`
}

type CreditCardAutoPaymentUpdateRequest struct {
	Enabled             bool  `json:"enabled"`
	CreditCardAccountId int64 `json:"creditCardAccountId,string" binding:"required,min=1"`
	SourceAccountId     int64 `json:"sourceAccountId,string" binding:"min=0"`
	TransferCategoryId  int64 `json:"transferCategoryId,string" binding:"min=0"`
}

type CreditCardAutoPaymentResponse struct {
	Enabled             bool   `json:"enabled"`
	CreditCardAccountId string `json:"creditCardAccountId"`
	SourceAccountId     string `json:"sourceAccountId"`
	DueDay              int    `json:"dueDay"`
}
