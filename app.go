package main

import (
	"context"
	"fmt"
)

type App struct {
	ctx   context.Context
	store *Store
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	store, err := NewStore()
	if err != nil {
		fmt.Println("Failed to init store:", err)
		return
	}
	a.store = store
}

// ── Collections ───────────────────────────────────────────────────────────────

func (a *App) LoadCollections() ([]CollectionNode, error) {
	if a.store == nil {
		return []CollectionNode{}, nil
	}
	return a.store.LoadCollections()
}

func (a *App) SaveCollections(collections []CollectionNode) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}
	return a.store.SaveCollections(collections)
}

// ── Environments ──────────────────────────────────────────────────────────────

func (a *App) LoadEnvironments() ([]Environment, error) {
	if a.store == nil {
		return []Environment{}, nil
	}
	return a.store.LoadEnvironments()
}

func (a *App) SaveEnvironments(environments []Environment) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}
	return a.store.SaveEnvironments(environments)
}

// ── History ───────────────────────────────────────────────────────────────────

func (a *App) AddHistory(entry HistoryEntry) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}
	return a.store.AddHistory(entry)
}

func (a *App) LoadHistory(limit int) ([]HistoryEntry, error) {
	if a.store == nil {
		return []HistoryEntry{}, nil
	}
	return a.store.LoadHistory(limit)
}

func (a *App) ClearHistory() error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}
	return a.store.ClearHistory()
}

// ── KV (sessions, login, settings) ───────────────────────────────────────────

func (a *App) SetKV(key, value string) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}
	return a.store.SetKV(key, value)
}

func (a *App) GetKV(key string) (string, error) {
	if a.store == nil {
		return "", nil
	}
	return a.store.GetKV(key)
}

func (a *App) DeleteKV(key string) error {
	if a.store == nil {
		return fmt.Errorf("store not initialized")
	}
	return a.store.DeleteKV(key)
}
