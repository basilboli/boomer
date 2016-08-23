package main

import (
	"flag"
	"fmt"
	"log"
	"math/rand"
	"time"

	"golang.org/x/net/websocket"
)

var origin = "http://localhost/"

func main() {
	var (
		httpAddr = flag.String("httpAddr", "ws://localhost:3000/events", "websocket service address.")
		payload  = flag.String("payload", "?access_token=", "Health service address.")
		id       = flag.String("id", "id", "player id")
		lng      = flag.String("lng", "2.327009439468384", "lng")
		lat      = flag.String("lat", "48.879287097593966", "lat")
	)
	flag.Parse()
	url := *httpAddr + *payload + *id
	fmt.Println("Connecting to : " + url)
	ws, err := websocket.Dial(url, "Yoyo", origin)

	if err != nil {
		log.Fatal(err)
	}
	names := []string{
		"John",
		"William",
		"James",
		"Charles",
		"George",
		"Frank",
	}

	rand.Seed(time.Now().Unix())
	n := rand.Intn(len(names))

	for {
		fmt.Println("%v", n)
		str := fmt.Sprintf("{\"coordinates\": [%s,%s]}", *lng, *lat)
		message := []byte(str)
		_, err = ws.Write(message)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Send: %s\n", message)

		var msg = make([]byte, 512)
		_, err = ws.Read(msg)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Receive: %s\n", msg)
		time.Sleep(1 * time.Second)
	}
}
