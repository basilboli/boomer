package main

import (
	"log"
	"net/http"

	"bitbucket.org/basilboli/boomer/server/websockets/ws"
)

func main() {
	log.SetFlags(log.Lshortfile)

	// websocket server
	server := ws.NewServer("/entry")
	go server.Listen()

	log.Fatal(http.ListenAndServe(":3000", nil))
}
