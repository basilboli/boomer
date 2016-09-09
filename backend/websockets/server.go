package websockets

import (
	. "bitbucket.org/basilboli/boomer/backend/app"
	"errors"
	"github.com/dgrijalva/jwt-go"
	"golang.org/x/net/websocket"
	"log"
	"net/http"
)

// Chat server.
type Server struct {
	pattern   string
	clients   map[int]*Client
	addCh     chan *Client
	delCh     chan *Client
	sendAllCh chan *Event
	doneCh    chan bool
	errCh     chan error
}

// Create new  server.
func NewServer(pattern string) *Server {
	clients := make(map[int]*Client)
	addCh := make(chan *Client)
	delCh := make(chan *Client)
	sendAllCh := make(chan *Event)
	doneCh := make(chan bool)
	errCh := make(chan error)

	return &Server{
		pattern,
		clients,
		addCh,
		delCh,
		sendAllCh,
		doneCh,
		errCh,
	}
}

func (s *Server) Add(c *Client) {
	s.addCh <- c
}

func (s *Server) Del(c *Client) {
	s.delCh <- c
}

func (s *Server) SendAll(msg *Event) {
	s.sendAllCh <- msg
}

func (s *Server) Done() {
	s.doneCh <- true
}

func (s *Server) Err(err error) {
	s.errCh <- err
}

func (s *Server) sendAll(msg *Event) {
	for _, c := range s.clients {
		c.Write(msg)
	}
}

// Listen and serve.
// It serves client connection and broadcast request.
func (s *Server) Listen() {

	log.Println("Listening websockets ...")

	// websocket handler
	onConnected := func(ws *websocket.Conn) {
		defer func() {
			err := ws.Close()
			if err != nil {
				s.errCh <- err
			}
		}()
		log.Println(ws.Request())
		access_token := ws.Request().URL.Query().Get("access_token")
		log.Printf("Found token : %s\n", access_token)

		token, err := jwt.Parse(access_token, func(token *jwt.Token) (interface{}, error) {
			return []byte("driblet-venge-requiem-repose"), nil
		})
		if err != nil || !token.Valid {
			log.Printf("Error: %s\n", err)
			s.errCh <- errors.New("Token is not valid")
			// http.Error(w, "authorization failed", http.StatusUnauthorized)
			return
		}

		client := NewClient(ws, s, token.Claims["sub"].(string))
		s.Add(client)
		client.Listen()

	}
	http.Handle(s.pattern, websocket.Handler(onConnected))
	log.Println("Created handler")

	for {
		select {

		// Add new a client
		case c := <-s.addCh:
			log.Println("Added new client")
			s.clients[c.id] = c
			log.Println("Now", len(s.clients), "clients connected.")

		// del a client
		case c := <-s.delCh:
			log.Println("Delete client")
			delete(s.clients, c.id)

		// broadcast Event for all clients
		case msg := <-s.sendAllCh:
			log.Println("Send all:", msg)
			s.sendAll(msg)
			// broadcast Event for all clients

		case err := <-s.errCh:
			log.Println("Error:", err.Error())

		case <-s.doneCh:
			return
		}
	}
}

func (s *Server) GetConnectedUsers() []string {
	var ids []string
	for _, c := range s.clients {
		ids = append(ids, c.UserId)
	}

	return ids
}
