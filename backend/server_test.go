package main

import (
	// "github.com/basilboli/boomer/server/app"
	"fmt"
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	fmt.Println("Start test ...")
	// app.NewApiServer()
	os.Exit(m.Run())
}

func TestBot(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping test in short mode.")
	}

	secret := os.Getenv("SECRET")
	if secret == "" {
		fmt.Println("ERROR: " +
			"In order to test boomer functionality, you need to set up " +
			"SECRET environmental variable, which represents an API " +
			"key to a Telegram bot.\n")
		t.Fatal("Could't find SECRET, aborting.")
	}

}
