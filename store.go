package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

// ── Types (mirroring frontend) ────────────────────────────────────────────────

type RequestItem struct {
	ID            string          `json:"id"`
	Method        string          `json:"method"`
	Name          string          `json:"name"`
	URL           string          `json:"url"`
	Timestamp     string          `json:"timestamp"`
	Params        json.RawMessage `json:"params,omitempty"`
	PathVariables json.RawMessage `json:"pathVariables,omitempty"`
	Headers       json.RawMessage `json:"headers,omitempty"`
	Auth          json.RawMessage `json:"auth,omitempty"`
	BodyType      string          `json:"bodyType,omitempty"`
	Body          string          `json:"body,omitempty"`
	BodyFormData  json.RawMessage `json:"bodyFormData,omitempty"`
	BodyURLEncoded json.RawMessage `json:"bodyUrlEncoded,omitempty"`
}

type CollectionNode struct {
	ID        string           `json:"id"`
	Name      string           `json:"name"`
	Collapsed bool             `json:"collapsed"`
	Items     []RequestItem    `json:"items"`
	Children  []CollectionNode `json:"children,omitempty"`
}

type KeyValuePair struct {
	ID      string `json:"id"`
	Key     string `json:"key"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

type Environment struct {
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Variables []KeyValuePair `json:"variables"`
}

type HistoryEntry struct {
	ID        string `json:"id"`
	Method    string `json:"method"`
	URL       string `json:"url"`
	Name      string `json:"name"`
	Status    int    `json:"status"`
	Duration  string `json:"duration"`
	Timestamp string `json:"timestamp"`
}

// ── Store ─────────────────────────────────────────────────────────────────────

type Store struct {
	db *sql.DB
}

func NewStore() (*Store, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		exe, _ := os.Executable()
		dir = filepath.Dir(exe)
	}
	appDir := filepath.Join(dir, "Lumina")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return nil, fmt.Errorf("create app dir: %w", err)
	}

	dbPath := filepath.Join(appDir, "lumina.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	// WAL mode for better concurrent read performance
	db.Exec("PRAGMA journal_mode=WAL;")
	db.Exec("PRAGMA foreign_keys=ON;")

	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}
	return s, nil
}

func (s *Store) migrate() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS collections (
			id        TEXT PRIMARY KEY,
			data      TEXT NOT NULL  -- full tree as JSON
		);

		CREATE TABLE IF NOT EXISTS environments (
			id   TEXT PRIMARY KEY,
			data TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS history (
			id        TEXT PRIMARY KEY,
			method    TEXT NOT NULL,
			url       TEXT NOT NULL,
			name      TEXT NOT NULL DEFAULT '',
			status    INTEGER NOT NULL DEFAULT 0,
			duration  TEXT NOT NULL DEFAULT '',
			timestamp TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS kv (
			key   TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`)
	return err
}

// ── Collections ───────────────────────────────────────────────────────────────

func (s *Store) LoadCollections() ([]CollectionNode, error) {
	row := s.db.QueryRow(`SELECT data FROM collections WHERE id = 'root'`)
	var raw string
	if err := row.Scan(&raw); err == sql.ErrNoRows {
		return []CollectionNode{}, nil
	} else if err != nil {
		return nil, err
	}
	var cols []CollectionNode
	return cols, json.Unmarshal([]byte(raw), &cols)
}

func (s *Store) SaveCollections(collections []CollectionNode) error {
	data, err := json.Marshal(collections)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(
		`INSERT INTO collections(id, data) VALUES('root', ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data`,
		string(data),
	)
	return err
}

// ── Environments ──────────────────────────────────────────────────────────────

func (s *Store) LoadEnvironments() ([]Environment, error) {
	row := s.db.QueryRow(`SELECT data FROM environments WHERE id = 'root'`)
	var raw string
	if err := row.Scan(&raw); err == sql.ErrNoRows {
		return []Environment{}, nil
	} else if err != nil {
		return nil, err
	}
	var envs []Environment
	return envs, json.Unmarshal([]byte(raw), &envs)
}

func (s *Store) SaveEnvironments(environments []Environment) error {
	data, err := json.Marshal(environments)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(
		`INSERT INTO environments(id, data) VALUES('root', ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data`,
		string(data),
	)
	return err
}

// ── History ───────────────────────────────────────────────────────────────────

func (s *Store) AddHistory(entry HistoryEntry) error {
	_, err := s.db.Exec(
		`INSERT OR REPLACE INTO history(id, method, url, name, status, duration, timestamp) VALUES(?,?,?,?,?,?,?)`,
		entry.ID, entry.Method, entry.URL, entry.Name, entry.Status, entry.Duration, entry.Timestamp,
	)
	return err
}

func (s *Store) LoadHistory(limit int) ([]HistoryEntry, error) {
	if limit <= 0 {
		limit = 100
	}
	rows, err := s.db.Query(
		`SELECT id, method, url, name, status, duration, timestamp FROM history ORDER BY timestamp DESC LIMIT ?`,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []HistoryEntry
	for rows.Next() {
		var e HistoryEntry
		if err := rows.Scan(&e.ID, &e.Method, &e.URL, &e.Name, &e.Status, &e.Duration, &e.Timestamp); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func (s *Store) ClearHistory() error {
	_, err := s.db.Exec(`DELETE FROM history`)
	return err
}

// ── Key-Value (sessions, login state, etc.) ───────────────────────────────────

func (s *Store) SetKV(key, value string) error {
	_, err := s.db.Exec(
		`INSERT INTO kv(key, value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
		key, value,
	)
	return err
}

func (s *Store) GetKV(key string) (string, error) {
	row := s.db.QueryRow(`SELECT value FROM kv WHERE key = ?`, key)
	var value string
	if err := row.Scan(&value); err == sql.ErrNoRows {
		return "", nil
	} else if err != nil {
		return "", err
	}
	return value, nil
}

func (s *Store) DeleteKV(key string) error {
	_, err := s.db.Exec(`DELETE FROM kv WHERE key = ?`, key)
	return err
}
