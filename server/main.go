package main

import (
	"bitbucket.org/basilboli/boomer/server/app"
	"log"
	"net/http"
	"time"
)

type HandlerFunc func(http.ResponseWriter, *http.Request)

func main() {

	// server sent events broker
	broker := app.NewServer()

	http.Handle("/hello", corsHandler(app.HelloServer))
	http.Handle("/game", corsHandler(app.GetActiveGame))
	http.Handle("/player/locupdate", corsHandler(app.LocUpdate))
	http.Handle("/spot/checkin", corsHandler(app.CheckinSpot))
	http.Handle("/events", broker)

	go func() {
		for {
			time.Sleep(time.Second * 2)
			// eventString := fmt.Sprintf("the time is %v", time.Now())
			// eventString := app.GetLocUpdateResponse(broker.GetConnectedPlayers())
			log.Println("Sending notification!")
			broker.Notifier <- []byte("notify")

		}
	}()

	log.Print("Open URL http://localhost:3000/ in your browser.")
	go log.Fatal("HTTP server error: ", http.ListenAndServe(":3000", nil))

}

func corsHandler(f http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "origin, content-type, accept")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")

		http.HandlerFunc(f).ServeHTTP(w, r)

	}
}
