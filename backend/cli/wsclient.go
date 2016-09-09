package main

import (
	"flag"
	"fmt"
	"golang.org/x/net/websocket"
	"log"
	"math/rand"
	"time"
)

var origin = "http://localhost/"

func main() {
	var (
		httpAddr = flag.String("httpAddr", "ws://localhost:3000/events", "websocket service address.")
		payload  = flag.String("payload", "?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJhc2lsYm9saUBnbWFpbC5jb20iLCJleHAiOjE0NzM2Nzc5MTYsImlhdCI6MTQ3MzQxODcxNiwiaXNzIjoiYXV0aC5zZXJ2aWNlIiwic3ViIjoiNTdkMjk1ZGM3M2UyYTE5OWE1YzBkNTlkIn0.tTgIeFzbw0yUNdxVhSWxHySHtJvSBWME4pROjU5pFXk", "Health service address.")
		// 2.34925,48.86789
		// 2.35166987369, 48.8652406217

		lng = flag.String("lng", "2.34899551805", "lng")
		lat = flag.String("lat", "48.8700006172", "lat")
	)
	flag.Parse()
	url := *httpAddr + *payload
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
			log.Printf("Error: %s", err)
		}
		fmt.Printf("Send: %s\n", message)

		var msg = make([]byte, 10000)
		_, err = ws.Read(msg)
		if err != nil {
			log.Printf("Error: %s", err)
		}
		if err != nil {
			log.Printf("Error: %s", err)
		}
		fmt.Printf("Receive:\n%s\n", string(msg))

		time.Sleep(1 * time.Second)
	}
}
