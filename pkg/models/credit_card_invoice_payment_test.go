package models

import (
	"testing"

	_ "github.com/mattn/go-sqlite3"
	"xorm.io/xorm"
)

func TestCreditCardInvoiceMetadataDoesNotAffectNormalTransactionSchema(t *testing.T) {
	engine, err := xorm.NewEngine("sqlite3", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer engine.Close()

	if err = engine.Sync2(new(Transaction)); err != nil {
		t.Fatal(err)
	}
	hasColumn := hasDatabaseColumn(t, engine, "transaction", "credit_card_invoice_cycle")
	if hasColumn {
		t.Fatal("normal transaction mapping must ignore optional invoice metadata")
	}

	if err = engine.Sync2(new(CreditCardInvoicePaymentMetadata)); err != nil {
		t.Fatal(err)
	}
	hasColumn = hasDatabaseColumn(t, engine, "transaction", "credit_card_invoice_cycle")
	if !hasColumn {
		t.Fatal("metadata sync should add the optional invoice cycle column")
	}
}

func hasDatabaseColumn(t *testing.T, engine *xorm.Engine, tableName string, columnName string) bool {
	t.Helper()
	tables, err := engine.DBMetas()
	if err != nil {
		t.Fatal(err)
	}
	for _, table := range tables {
		if table.Name != tableName {
			continue
		}
		for _, column := range table.Columns() {
			if column.Name == columnName {
				return true
			}
		}
	}
	return false
}
