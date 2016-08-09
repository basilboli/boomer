package main

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"golang.org/x/net/websocket"
)

var origin = "http://localhost/"

var url = "ws://boomer.paris:3000/entry"

// var url = "ws://104.155.123.156:3000/entry"
// var url = "ws://localhost:3000/entry"

func main() {
	fmt.Println("Connecting to : " + url)
	ws, err := websocket.Dial(url, "", origin)

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
		"Joseph",
		"Thomas",
		"Henry",
		"Robert",
		"Edward",
		"Harry",
		"Walter",
		"Arthur",
		"Fred",
		"Albert",
		"Samuel",
		"David",
		"Louis",
		"Joe",
		"Charlie",
		"Clarence",
		"Richard",
		"Andrew",
		"Daniel",
		"Ernest",
		"Will",
		"Jesse",
		"Oscar",
		"Lewis",
		"Peter",
		"Benjamin",
		"Frederick",
		"Willie",
		"Alfred",
		"Sam",
		"Roy",
		"Herbert",
		"Jacob",
		"Tom",
		"Elmer",
		"Carl",
		"Lee",
		"Howard",
		"Martin",
		"Michael",
		"Bert",
		"Herman",
		"Jim",
		"Francis",
	}

	rand.Seed(time.Now().Unix())
	n := rand.Intn(len(names))

	for {
		lat := 48.870357399999996 + rand.Float64()
		lng := 2.3332756999999997
		str := fmt.Sprintf("{\"type\": 0,\"name\": \"%s\", \"lat\":\"%g\", \"lng\":\"%g\"}", names[n], rand.Float64(), rand.Float64())
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
		time.Sleep(5 * time.Second)
	}
}
