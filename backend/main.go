package main

import (
	"bitbucket.org/basilboli/boomer/backend/Godeps/_workspace/src/github.com/braintree/manners"
	"bitbucket.org/basilboli/boomer/backend/handlers"
	"bitbucket.org/basilboli/boomer/backend/health"
	"bitbucket.org/basilboli/boomer/backend/websockets"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
)

const version = "1.0.0"

func main() {
	var (
		httpAddr   = flag.String("http", "0.0.0.0:3000", "HTTP service address.")
		healthAddr = flag.String("health", "0.0.0.0:3001", "Health service address.")
		secret     = flag.String("secret", "driblet-venge-requiem-repose", "JWT signing secret.")
	)
	flag.Parse()

	log.Println("Starting server...")
	log.Printf("HTTP service listening on %s", *httpAddr)
	log.Printf("Health service listening on %s", *healthAddr)
	log.Printf("Websockets service listening on %s/events", *httpAddr)

	errChan := make(chan error, 10)

	hmux := http.NewServeMux()
	hmux.HandleFunc("/healthz", health.HealthzHandler)
	hmux.HandleFunc("/readiness", health.ReadinessHandler)
	hmux.HandleFunc("/healthz/status", health.HealthzStatusHandler)
	hmux.HandleFunc("/readiness/status", health.ReadinessStatusHandler)
	healthServer := manners.NewServer()
	healthServer.Addr = *healthAddr
	healthServer.Handler = handlers.LoggingHandler(hmux)

	// websocket server
	websocketServer := websockets.NewServer("/events")
	go websocketServer.Listen()

	go func() {
		errChan <- healthServer.ListenAndServe()
	}()

	http.HandleFunc("/", handlers.HelloHandler)
	http.Handle("/signup", handlers.SignUpHandler(*secret))
	http.Handle("/login", handlers.LoginHandler(*secret))
	http.Handle("/secure", handlers.AuthHandler(handlers.HelloHandler))
	http.Handle("/version", handlers.VersionHandler(version))

	http.HandleFunc("/user/info", handlers.AuthHandler(handlers.GetUserInfoHandler))
	http.HandleFunc("/game/current", handlers.AuthHandler(handlers.GetOngoingGameHandler))
	http.HandleFunc("/game/start", handlers.AuthHandler(handlers.StartGameHandler))
	http.HandleFunc("/game/stop", handlers.AuthHandler(handlers.StopGameHandler))
	http.HandleFunc("/game/activities", handlers.AuthHandler(handlers.GetGameActivities))
	http.HandleFunc("/game/around", handlers.AuthHandler(handlers.GetGamesAroundHandler))

	// OBSOLETE http.HandleFunc("/user/locupdate", handlers.LocUpdateHandler)
	// OBSOLETE http.HandleFunc("/spot/checkin", handlers.CheckinSpotHandler)

	go func() {
		errChan <- http.ListenAndServe(*httpAddr, nil)
	}()

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)

	for {
		select {
		case err := <-errChan:
			if err != nil {
				log.Fatal(err)
			}
		case s := <-signalChan:
			log.Println(fmt.Sprintf("Captured %v. Exiting...", s))
			health.SetReadinessStatus(http.StatusServiceUnavailable)
			os.Exit(0)
		}
	}
}
