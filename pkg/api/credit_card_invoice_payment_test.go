package api

import "testing"

func TestIsValidCreditCardInvoiceCycle(t *testing.T) {
	tests := map[string]bool{
		"2026-07-29/2026-08-28": true,
		"2026-08-28/2026-07-29": false,
		"2026-02-30/2026-03-28": false,
		"08/2026":               false,
		"":                      false,
	}
	for value, expected := range tests {
		if actual := isValidCreditCardInvoiceCycle(value); actual != expected {
			t.Errorf("isValidCreditCardInvoiceCycle(%q) = %v, want %v", value, actual, expected)
		}
	}
}
