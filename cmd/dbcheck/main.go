package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

func main() {
	dir, _ := os.UserConfigDir()
	dbPath := filepath.Join(dir, "Lumina", "lumina.db")
	fmt.Println("DB path:", dbPath)

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		fmt.Println("Open error:", err)
		return
	}
	defer db.Close()

	row := db.QueryRow(`SELECT data FROM collections WHERE id = 'root'`)
	var data string
	if err := row.Scan(&data); err == sql.ErrNoRows {
		fmt.Println("NO DATA in collections table")
	} else if err != nil {
		fmt.Println("Scan error:", err)
	} else {
		fmt.Println("Collections data:", data[:min(len(data), 500)])
	}
}

func min(a, b int) int {
	if a < b { return a }
	return b
}
