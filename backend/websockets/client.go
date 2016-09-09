package websockets

import (
	. "bitbucket.org/basilboli/boomer/backend/app"
	"bitbucket.org/basilboli/boomer/backend/handlers"
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
	ch     chan *Event
	doneCh chan bool
	UserId string
}

// Create new chat client.
func NewClient(ws *websocket.Conn, server *Server, userid string) *Client {

	if ws == nil {
		panic("ws cannot be nil")
	}

	if server == nil {
		panic("server cannot be nil")
	}

	maxId++
	ch := make(chan *Event, channelBufSize)
	doneCh := make(chan bool)

	return &Client{maxId, ws, server, ch, doneCh, userid}
}

func (c *Client) Conn() *websocket.Conn {
	return c.ws
}

func (c *Client) Write(msg *Event) {
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

		// send Event to the client
		case msg := <-c.ch:
			log.Printf("Sending: %+v\n", (*msg))
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
			var incoming UserLocUpdateEvent
			err := websocket.JSON.Receive(c.ws, &incoming)
			log.Printf("Receive: %s\n", incoming)
			if err == io.EOF {
				c.doneCh <- true
			} else if err != nil {
				c.server.Err(err)
			} else {
				// handle event
				err = handlers.UserLocUpdate(c.UserId, incoming.Coordinates)
				if err != nil {
					log.Printf("ERROR: Problem doing loc update for user %s:%s\n", c.UserId, err)
					continue
				}

				// check if user has active game
				activity, err := handlers.GetOngoingActivity(c.UserId)

				if err != nil {
					log.Println("User has no ongoing activity. Sending nothing.")
					continue
				}

				// outcoming Event
				var outcoming Event
				outcoming, err = handlers.BuildGameUpdateEvent(activity, c.server.GetConnectedUsers())

				if err != nil {
					log.Println("ERROR: Problem when building game update")
					continue
				}
				c.Write(&outcoming)
				log.Printf("Sending: \n%+v\n", (outcoming.(GameUpdateEvent)))

				// check if this is the end of the game
				if (outcoming.(GameUpdateEvent)).TotalNumberOfCheckins == (outcoming.(GameUpdateEvent)).TotalNumberOfSpots {
					activity, err := handlers.DoEndGame(activity.ID)
					if err != nil {
						log.Println("ERROR: Problem when building game over event")
						continue
					}
					var gameOverEvent Event
					score := activity.Ended - activity.Started
					gameOverEvent = GameOverEvent{EventType: GameOverEventType, Started: activity.Started, Ended: activity.Ended, Score: score}
					c.Write(&gameOverEvent)
				}

			}
		}
	}
}
