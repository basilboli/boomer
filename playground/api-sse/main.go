package main

import (
	"./sse"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// hello world, the web server
func HelloServer(rw http.ResponseWriter, req *http.Request) {
	io.WriteString(rw, "hello, world!\n")
}

func main() {

	// server sent events broker
	broker := sse.NewServer()
	http.Handle("/events", broker)
	http.HandleFunc("/hello", HelloServer)
	go func() {
		for {
			time.Sleep(time.Second * 2)
			eventString := fmt.Sprintf("the time is %v", time.Now())
			log.Println("Receiving event")
			broker.Notifier <- []byte(eventString)
		}
	}()

	log.Print("Open URL http://localhost:3000/ in your browser.")
	go log.Fatal("HTTP server error: ", http.ListenAndServe(":3000", nil))

}
