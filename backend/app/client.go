package app

import (
	"fmt"
	"golang.org/x/net/websocket"
	"io"
	"log"
)

const channelBufSize = 100

var maxId int = 0

// Chat client.
type Client struct {
	id     int
	ws     *websocket.Conn
	server *Server
	ch     chan *LocUpdateResponse
	doneCh chan bool
	Token  string
}

// Create new chat client.
func NewClient(ws *websocket.Conn, server *Server, token string) *Client {

	if ws == nil {
		panic("ws cannot be nil")
	}

	if server == nil {
		panic("server cannot be nil")
	}

	maxId++
	ch := make(chan *LocUpdateResponse, channelBufSize)
	doneCh := make(chan bool)

	return &Client{maxId, ws, server, ch, doneCh, token}
}

func (c *Client) Conn() *websocket.Conn {
	return c.ws
}

func (c *Client) Write(msg *LocUpdateResponse) {
	select {
	case c.ch <- msg:
	default:
		c.server.Del(c)
		err := fmt.Errorf("client %d is disconnected.", c.id)
		c.server.Err(err)
	}
}

func (c *Client) Done() {
	c.doneCh <- true
}

// Listen Write and Read request via chanel
func (c *Client) Listen() {
	go c.listenWrite()
	c.listenRead()
}

// Listen write request via chanel
func (c *Client) listenWrite() {
	log.Println("Listening write to client")
	for {
		select {

		// send message to the client
		case msg := <-c.ch:
			log.Println("Send:", msg)
			websocket.JSON.Send(c.ws, msg)

		// receive done request
		case <-c.doneCh:
			c.server.Del(c)
			c.doneCh <- true // for listenRead method
			return
		}
	}
}

// Listen read request via chanel
func (c *Client) listenRead() {
	log.Println("Listening read from client")
	for {
		select {

		// receive done request
		case <-c.doneCh:
			c.server.Del(c)
			c.doneCh <- true // for listenWrite method
			return

		// read data from websocket connection
		default:
			var request LocUpdateRequest
			err := websocket.JSON.Receive(c.ws, &request)
			log.Printf("Incoming messageis %s\n", request)
			if err == io.EOF {
				c.doneCh <- true
			} else if err != nil {
				c.server.Err(err)
			} else {
				// persist player coordinates
				err = UpdateLocation(c.Token, request.Coordinates)
				if err != nil {
					log.Printf("ERROR: Problem doing loc update for user %s\n", c.Token)
					continue
				}
				// send LocUpdateResponse
				locUpdateResponse, err := GetLocUpdateResponse(c.Token, c.server.GetConnectedPlayers())
				if err != nil {
					log.Println("ERROR: Problem getting loc updates")
					continue
				}
				c.Write(&locUpdateResponse)
				// c.server.SendLocUpdates(&request)
			}
		}
	}
}
