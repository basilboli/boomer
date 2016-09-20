package main

import (
	"bitbucket.org/basilboli/boomer/backend/handlers"
	"bitbucket.org/basilboli/boomer/backend/health"
	"bitbucket.org/basilboli/boomer/backend/websockets"
	"flag"
	"fmt"
	// "github.com/braintree/manners"
	"github.com/rs/cors"
	"golang.org/x/net/websocket"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
)

const version = "1.0.0"

func main() {
	var (
		httpAddr = flag.String("http", "0.0.0.0:3000", "HTTP service address.")
		// healthAddr = flag.String("health", "0.0.0.0:3001", "Health service address.")
		secret = flag.String("secret", "driblet-venge-requiem-repose", "JWT signing secret.")
	)
	flag.Parse()

	log.Println("Starting server...")
	log.Printf("HTTP service listening on %s", *httpAddr)
	// log.Printf("Health service listening on %s", *healthAddr)
	log.Printf("Websockets service listening on %s/events", *httpAddr)

	errChan := make(chan error, 10)

	// websocket server
	// wsmux := http.NewServeMux()
	// websocketServer := websockets.NewServer(wsmux, "/events")
	// go websocketServer.Listen()

	// go func() {
	// 	errChan <- http.ListenAndServe("0.0.0.0:3002", wsmux)
	// }()

	// hmux := http.NewServeMux()
	// hmux.HandleFunc("/healthz", health.HealthzHandler)
	// hmux.HandleFunc("/readiness", health.ReadinessHandler)
	// hmux.HandleFunc("/healthz/status", health.HealthzStatusHandler)
	// hmux.HandleFunc("/readiness/status", health.ReadinessStatusHandler)

	// healthServer := manners.NewServer()
	// healthServer.Addr = *healthAddr
	// healthServer.Handler = handlers.LoggingHandler(hmux)

	// go func() {
	// 	errChan <- healthServer.ListenAndServe()
	// }()

	mux := http.NewServeMux()
	mux.HandleFunc("/", handlers.HelloHandler)
	mux.Handle("/signup", handlers.SignUpHandler(*secret))
	mux.Handle("/login", handlers.LoginHandler(*secret))

	mux.Handle("/secure", handlers.AuthHandler(handlers.HelloHandler))
	mux.Handle("/version", handlers.VersionHandler(version))

	mux.HandleFunc("/user/info", handlers.AuthHandler(handlers.GetUserInfoHandler))

	// /game/around?lat=xxx&&&lng=yyy
	mux.HandleFunc("/game/around", handlers.AuthHandler(handlers.GetGamesAroundHandler))
	mux.HandleFunc("/game/current", handlers.AuthHandler(handlers.GetOngoingGameHandler))

	// /game/start?id=xxxxxx
	mux.HandleFunc("/game/start", handlers.AuthHandler(handlers.StartGameHandler))
	mux.HandleFunc("/game/stop", handlers.AuthHandler(handlers.StopGameHandler))
	mux.HandleFunc("/game/activities", handlers.AuthHandler(handlers.GetGameActivities))
	mux.Handle("/echo", websocket.Handler(websockets.EchoServer))
	websocketServer := websockets.NewServer(mux, "/events")
	go websocketServer.Listen()

	// handler := cors.Default().Handler(mux)

	handler := cors.New(cors.Options{
		AllowCredentials: true,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowedHeaders:   []string{"origin", "content-type", "accept", "authorization"},
		Debug:            true,
	}).Handler(mux)

	go func() {
		errChan <- http.ListenAndServe(*httpAddr, handler)
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
