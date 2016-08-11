package app

import (
	"fmt"
	"gopkg.in/mgo.v2/bson"
	"log"
	"net/http"
)

type Broker struct {

	// Events are pushed to this channel by the main events-gathering routine
	Notifier chan []byte

	// New client connections
	newClients chan Client

	// Closed client connections
	closingClients chan Client

	// Client connections registry
	clients map[Client]bool
}

type Client struct {

	// player id
	Id string

	// message channel
	MessageCh chan []byte
}

// notifications
const (
	LocUpdateNotification = "LocUpdate"
)

func NewServer() (broker *Broker) {
	// Instantiate a broker
	broker = &Broker{
		Notifier:       make(chan []byte, 1),
		newClients:     make(chan Client),
		closingClients: make(chan Client),
		clients:        make(map[Client]bool),
	}

	// Set it running - listening and broadcasting events
	go broker.listen()

	return
}

func (broker *Broker) ServeHTTP(rw http.ResponseWriter, req *http.Request) {

	// Make sure that the writer supports flushing.
	//
	flusher, ok := rw.(http.Flusher)

	if !ok {
		http.Error(rw, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	// --- parsing id
	if err := req.ParseForm(); err != nil {
		log.Print(err)
		return
	}

	if req.Form["playerid"] == nil {
		http.Error(rw, "Missing playerid parameter in url", http.StatusBadRequest)
		return
	}
	playerid := req.Form["playerid"][0]

	// check player exists
	if !bson.IsObjectIdHex(playerid) {
		http.Error(rw, "Player is not found!", 404)
		return
	}

	query := bson.M{"_id": bson.ObjectIdHex(playerid)}
	count, err := DB.C("players").Find(query).Count()

	if err != nil || count == 0 {
		http.Error(rw, "Player is not found!", 404)
		return
	}

	log.Println("Creating connection for player with playerid: " + playerid)
	// ---end of parsing id

	rw.Header().Set("Content-Type", "text/event-stream")
	rw.Header().Set("Cache-Control", "no-cache")
	rw.Header().Set("Connection", "keep-alive")
	rw.Header().Set("Access-Control-Allow-Origin", "*")

	// Each connection registers its own message channel with the Broker's connections registry
	messageChan := make(chan []byte)

	// Create new client
	newClient := Client{Id: playerid, MessageCh: messageChan}

	// Signal the broker that we have a new connection
	broker.newClients <- newClient

	// Remove this client from the map of connected clients
	// when this handler exits.
	defer func() {
		broker.closingClients <- newClient
	}()

	// Listen to connection close and un-register messageChan
	notify := rw.(http.CloseNotifier).CloseNotify()

	go func() {
		<-notify
		broker.closingClients <- newClient
	}()

	for {

		// Write to the ResponseWriter
		// Server Sent Events compatible
		fmt.Fprintf(rw, "event: events\ndata: %s\n\n", <-newClient.MessageCh)

		// Flush the data immediatly instead of buffering it for later.
		flusher.Flush()
	}

}

func (broker *Broker) listen() {
	for {
		select {
		case s := <-broker.newClients:

			// A new client has connected.
			// Register their message channel
			broker.clients[s] = true
			log.Printf("Client added. %d registered clients", len(broker.clients))
			log.Printf("Client's playerid %d", s.Id)
		case s := <-broker.closingClients:

			// A client has dettached and we want to
			// stop sending them messages.
			delete(broker.clients, s)
			log.Printf("Removed client. %d registered clients", len(broker.clients))
		case event := <-broker.Notifier:

			// We got a new event from the outside!
			// Send event to all connected clients
			for client, _ := range broker.clients {
				fmt.Println("Received event: " + string(event))
				eventString := GetLocUpdateResponse(client.Id, broker.GetConnectedPlayers())
				client.MessageCh <- []byte(eventString)
				// client.MessageCh <- event
			}
		}
	}

}

func (broker *Broker) GetConnectedPlayers() []string {
	var ids []string
	for c, _ := range broker.clients {
		ids = append(ids, c.Id)
	}

	return ids
}
