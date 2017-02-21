package main

import (
	"log"
	"net/http"

	"github.com/basilboli/boomer/playground/websockets/ws"
)

func main() {
	log.SetFlags(log.Lshortfile)

	// websocket server
	server := ws.NewWebsocketServer("/ws")
	go server.Listen()

	// static files
	http.Handle("/", http.FileServer(http.Dir("webroot")))
	log.Fatal(http.ListenAndServe(":3000", nil))
}
