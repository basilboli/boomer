package main

import (
	"bitbucket.org/basilboli/boomer/server/sse"
	"bitbucket.org/basilboli/boomer/server/storage"
	"encoding/json"
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"io"
	"log"
	"net/http"
	"time"
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
	ID       bson.ObjectId `bson:"_id,omitempty" json:"spotid"`
	GameId   bson.ObjectId `bson:"gameid,omitempty" json:"gameid"`
	Name     string        `bson:"name" json:"name"`
	Location Point         `bson:"location" json:"location"`
}

type Game struct {
	ID       bson.ObjectId `bson:"_id,omitempty" json:"gameid"`
	Name     string        `bson:"name" json:"-"`
	Active   bool          `bson:"active" json:"-"`
	Geometry Polygon       `bson:"geometry" json:"geometry"`
}

type Player struct {
	ID          bson.ObjectId `bson:"_id,omitempty" json:"playerid"`
	Name        string        `bson:"name" json:"-"`
	Coordinates Coordinate    `json:"coordinates" bson:"coordinates"`
}

type Checkin struct {
	ID     bson.ObjectId `bson:"_id,omitempty" json:"checkinid"`
	SpotId bson.ObjectId `bson:"gameid,omitempty" json:"spotid"`
}

var c_games *mgo.Collection
var c_spots *mgo.Collection
var c_players *mgo.Collection
var c_checkins *mgo.Collection

func init() {
	storage.InitDB()
	c_games = storage.DB.C("games")
	c_spots = storage.DB.C("spots")
	c_players = storage.DB.C("players")
	c_checkins = storage.DB.C("checkins")
}

// hello world, the web server
func HelloServer(rw http.ResponseWriter, req *http.Request) {
	io.WriteString(rw, "hello, world!\n")
}

func GetSpots() string {

	var results []Spot // to hold the results
	err := c_spots.Find(bson.M{}).All(&results)
	if err != nil {
		panic(err)
	}

	// convert it to JSON so it can be displayed
	formatter := json.MarshalIndent
	response, err := formatter(results, " ", "   ")

	fmt.Println(string(response))

	return string(response)
}

// GetActiveGame gets active game
func GetActiveGame(rw http.ResponseWriter, req *http.Request) {

	var result Game // to hold the results
	err := c_games.Find(bson.M{"active": true}).One(&result)
	if err != nil {
		log.Fatal(err)
	}

	// convert it to JSON so it can be displayed
	formatter := json.MarshalIndent
	response, err := formatter(result, " ", "   ")

	fmt.Println(string(response))

	io.WriteString(rw, string(response))
}

// NewPlayer creates new player
func NewPlayer(rw http.ResponseWriter, req *http.Request) {

	if req.Method != "POST" {
		http.Error(w, http.StatusText(405), 405)
		return
	}

	if err := req.ParseForm(); err != nil {
		log.Print(err)
		return
	}

	if req.Form["name"] == nil {
		http.Error(w, "Missing id parameter in post body", http.StatusBadRequest)
		return
	}
	name := req.Form["name"][0]

	err = c_players.Insert(bson.M{"name": name})
	if err != nil {
		log.Fatal(err)
	}

	// convert it to JSON so it can be displayed
	formatter := json.MarshalIndent
	response, err := formatter(result, " ", "   ")

	fmt.Println(string(response))

	io.WriteString(rw, string(response))
}

func main() {

	// server sent events broker
	broker := sse.NewServer()

	http.HandleFunc("/hello", HelloServer)
	// http.HandleFunc("/game/new", NewGame)
	http.HandleFunc("/game", GetActiveGame)
	http.HandleFunc("/player/new", NewPlayer)
	// http.HandleFunc("/game/join", JoinGame)
	// http.HandleFunc("/spot/checkin", CheckInSpot)
	http.Handle("/player/locupdate", broker)
	// http.HandleFunc("/game/active/spots", GetSpots)
	go func() {
		for {
			time.Sleep(time.Second * 2)
			// eventString := fmt.Sprintf("the time is %v", time.Now())
			eventString := GetSpots()
			// log.Println("Receiving event")
			broker.Notifier <- []byte(eventString)
		}
	}()

	log.Print("Open URL http://localhost:3000/ in your browser.")
	go log.Fatal("HTTP server error: ", http.ListenAndServe(":3000", nil))

}
