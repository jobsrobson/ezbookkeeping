package core

import "context"

// Context is the base context of Bookkeeping
type Context interface {
	context.Context
	ClientIP() string
	GetContextId() string
	GetClientLocale() string
}
