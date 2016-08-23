package app

import (
	"fmt"
	"gopkg.in/mgo.v2/bson"
	"io"
	"log"
	"net/http"
)

var BuildStamp = "No BuildStamp Provided"

func init() {
	log.Printf("App BuildStamp: %s\n", BuildStamp)
}

type BoomerMessageType int

const (
	MAX_DISTANCE                       = 50 // in meters
	LocUpdateMessage BoomerMessageType = iota
	ChatMessage
)

type CoordType float64

type Coordinate [2]CoordType

type Coordinates []Coordinate

// Representation of set of lines
type MultiLine []Coordinates

type Point struct {
	Type        string     `json:"type" bson:"type"`
	Coordinates Coordinate `json:"coordinates" bson:"coordinates"`
}

type Polygon struct {
	Type        string    `json:"-"`
	Coordinates MultiLine `json:"coordinates"`
}

type Spot struct {
	ID       bson.ObjectId `bson:"_id,omitempty" json:"spotid,omitempty"`
	GameId   bson.ObjectId `bson:"gameid,omitempty" json:"-"`
	Name     string        `bson:"name" json:"name,omitempty"`
	Checked  bool          `bson:"checked" json:"checked"`
	Location Point         `bson:"location" json:"location"`
	NearBy   bool          `bson:"nearby" json:"nearby"`
}

type Game struct {
	ID       bson.ObjectId `bson:"_id,omitempty" json:"-"`
	Name     string        `bson:"name" json:"-"`
	Active   bool          `bson:"active" json:"-"`
	Geometry Polygon       `bson:"geometry" json:"geometry"`
	Spots    []Spot        `bson:"spots" json:"spots,omitempty"`
}

type Player struct {
	ID          bson.ObjectId `bson:"_id" json:"playerid,omitempty"`
	Name        string        `bson:"name" json:"name"`
	Coordinates Coordinate    `json:"coordinates" bson:"coordinates"`
}

type Checkin struct {
	ID       bson.ObjectId `bson:"_id,omitempty" json:"checkinid"`
	SpotId   bson.ObjectId `bson:"spotid,omitempty" json:"spotid"`
	PlayerId bson.ObjectId `bson:"playerid,omitempty" json:"playerid"`
}

type LocUpdateRequest struct {
	Coordinates Coordinate `json:"coordinates" bson:"coordinates"`
}

type LocUpdateResponse struct {
	You     Player   `json:"you"`
	Players []Player `json:"players"`
	Spots   []Spot   `json:"spots"`
}

// Player returns a player for a given id.
func GetPlayer(id string) (*Player, error) {

	var p Player
	err := c_players.Find(bson.M{"_id": bson.ObjectIdHex(id)}).One(&p)
	if err != nil {
		log.Printf("Problem finding player by id %s: %s", id, err)
		return nil, err
	}
	return &p, nil
}

// CreatePlayer creates new one or updates existing
func UpsertPlayer(p *Player) (*Player, error) {

	var err error
	if p.ID == "" {
		fmt.Printf("Insert : %v\n", p)
		p.ID = bson.NewObjectId()
		err = c_players.Insert(p)
	} else {
		fmt.Printf("Update : %v\n", p)
		q := bson.M{"_id": p.ID}
		err = c_players.Update(q, p)
	}

	if err != nil {
		return nil, err
	}

	return p, nil
}

// UpdateLocation updates player location
func UpdateLocation(id string, c Coordinate) error {

	change := bson.M{"$set": bson.M{"coordinates": c}}
	err := c_players.Update(bson.M{"_id": bson.ObjectIdHex(id)}, change)

	if err != nil {
		return err
	}
	fmt.Printf("Success! Loc update for %s \n", id)
	return nil
}

func New() {

	// websocket server
	server := NewWebsocketServer("/ws")
	go server.Listen()

	http.Handle("/hello", corsHandler(HelloServer))
	http.HandleFunc("/version", func(rw http.ResponseWriter, req *http.Request) {
		io.WriteString(rw, BuildStamp)
	})
	http.Handle("/game", corsHandler(GetActiveGame))
	http.Handle("/player/locupdate", corsHandler(LocUpdate))
	http.Handle("/spot/checkin", corsHandler(CheckinSpot))
	// http.Handle("/events", broker)

	// go func() {
	// 	for {
	// 		time.Sleep(time.Second * 2)
	// 		// eventString := fmt.Sprintf("the time is %v", time.Now())
	// 		// eventString := GetLocUpdateResponse(broker.GetConnectedPlayers())
	// 		log.Println("Sending notification!")
	// 		broker.Notifier <- []byte("notify")

	// 	}
	// }()

	log.Print("Open URL http://localhost:3000/ in your browser.")
	go log.Fatal("HTTP server error: ", http.ListenAndServe(":3000", nil))
}
