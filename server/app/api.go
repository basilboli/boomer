package app

import (
	"encoding/json"
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"io"
	"io/ioutil"
	"log"
	"net/http"
)

const (
	MAX_DISTANCE = 50 // in meters
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
	GameId   bson.ObjectId `bson:"gameid,omitempty" json:"-"`
	Name     string        `bson:"name" json:"name"`
	Location Point         `bson:"location" json:"location"`
}

type Game struct {
	ID       bson.ObjectId `bson:"_id,omitempty" json:"-"`
	Name     string        `bson:"name" json:"-"`
	Active   bool          `bson:"active" json:"-"`
	Geometry Polygon       `bson:"geometry" json:"geometry"`
}

type Player struct {
	ID          bson.ObjectId `bson:"_id,omitempty" json:"playerid"`
	Name        string        `bson:"name" json:"name"`
	Coordinates Coordinate    `json:"coordinates" bson:"coordinates"`
}

type PlayerMin struct {
	Name        string     `bson:"name" json:"name"`
	Coordinates Coordinate `json:"coordinates" bson:"coordinates"`
}

type Checkin struct {
	ID       bson.ObjectId `bson:"_id,omitempty" json:"checkinid"`
	SpotId   bson.ObjectId `bson:"spotid,omitempty" json:"spotid"`
	PlayerId bson.ObjectId `bson:"playerid,omitempty" json:"playerid"`
}

type LocUpdateResponse struct {
	Players     []PlayerMin `json:"players"`
	Spots       []SpotMin   `json:"spots"`
	NearBySpots []Spot      `json:"nearby_spots"`
}

// minimal view of the spot show to the user
type SpotMin struct {
	Checked  bool  `bson:"checked" json:"checked"`
	Location Point `bson:"location" json:"location"`
}

var c_games *mgo.Collection
var c_spots *mgo.Collection
var c_players *mgo.Collection
var c_checkins *mgo.Collection

func init() {
	InitDB()
	c_games = DB.C("games")
	c_spots = DB.C("spots")
	c_players = DB.C("players")
	c_checkins = DB.C("checkins")
}

// hello world, the web server
func HelloServer(rw http.ResponseWriter, req *http.Request) {
	io.WriteString(rw, "hello, world!\n")
}

func GetLocUpdateResponse(id string, otherPlayers []string) string {

	// info about other players
	oids := make([]bson.ObjectId, len(otherPlayers))
	for i := range otherPlayers {
		oids[i] = bson.ObjectIdHex(otherPlayers[i])
	}

	query := bson.M{"_id": bson.M{"$in": oids}}

	var players []Player // to hold the players
	err := c_players.Find(query).All(&players)
	if err != nil {
		log.Printf("JSON marshaling failed: %s", err)
		return ""
	}

	var thisPlayer Player
	var playersMin []PlayerMin // to hold the players
	for _, p := range players {
		if p.ID.Hex() == id {
			fmt.Println("This player found!")
			thisPlayer = p
		}
		playerMin := PlayerMin{Name: p.Name, Coordinates: p.Coordinates}
		playersMin = append(playersMin, playerMin)
	}

	var spots []Spot // to hold all the spots

	err = c_spots.Find(bson.M{}).All(&spots)
	if err != nil {
		log.Printf("spots JSON marshaling failed: %s", err)
		return ""
	}

	// info about checked spots for given player
	var checkins []Checkin // to hold the checked spots
	err = c_checkins.Find(bson.M{"playerid": bson.ObjectIdHex(id)}).All(&checkins)
	if err != nil {
		log.Printf("checkins JSON marshaling failed: %s", err)
		return ""
	}

	var checkedSpots []SpotMin // to hold all the spots
	for _, s := range spots {

		spot := SpotMin{Checked: contains(checkins, s), Location: s.Location}
		checkedSpots = append(checkedSpots, spot)
	}

	// nearby spots

	var nearbySpots []Spot // to hold all the spots

	err = c_spots.Find(bson.M{"location": bson.M{"$nearSphere": bson.M{"$geometry": bson.M{
		"type":        "Point",
		"coordinates": thisPlayer.Coordinates,
	},
		"$maxDistance": MAX_DISTANCE,
	},
	}}).All(&nearbySpots)

	if err != nil {
		log.Printf("spots JSON marshaling failed: %s", err)
		return ""
	}

	locUpdateReponse := LocUpdateResponse{Spots: checkedSpots, Players: playersMin, NearBySpots: nearbySpots}

	data, err := json.Marshal(locUpdateReponse)
	if err != nil {
		log.Printf("JSON marshaling failed: %s", err)
		return ""
	}

	return string(data)
}

// GetActiveGame gets active game
func GetActiveGame(rw http.ResponseWriter, req *http.Request) {

	var result Game // to hold the results
	err := c_games.Find(bson.M{"active": true}).One(&result)
	if err != nil {
		http.Error(rw, "No active game found", 404)
		return
	}

	// convert it to JSON so it can be displayed
	formatter := json.MarshalIndent
	response, err := formatter(result, " ", "   ")

	fmt.Println(string(response))

	io.WriteString(rw, string(response))
}

// LocUpdate creates new player / or updates existing
func LocUpdate(rw http.ResponseWriter, req *http.Request) {

	if req.Method != "POST" {
		http.Error(rw, http.StatusText(405), 405)
		return
	}

	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}
	log.Println(string(body))

	var player Player
	err = json.Unmarshal(body, &player)
	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	if player.ID == "" {
		fmt.Printf("Insert : %v\n", player)
		player.ID = bson.NewObjectId()
		err = c_players.Insert(player)
	} else {
		fmt.Printf("Update : %v\n", player)
		q := bson.M{"_id": player.ID}
		err = c_players.Update(q, player)
	}

	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	// convert it to JSON so it can be displayed
	data, err := json.Marshal(player)
	if err != nil {
		log.Printf("JSON marshaling failed: %s", err)
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	fmt.Fprintf(rw, "%s\n", data)
}

// CheckinSpot make checkin of the spot
func CheckinSpot(rw http.ResponseWriter, req *http.Request) {

	if req.Method != "POST" {
		http.Error(rw, http.StatusText(405), 405)
		return
	}

	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}
	log.Println("Request Body:" + string(body))

	var checkin Checkin
	err = json.Unmarshal(body, &checkin)
	if err != nil {
		http.Error(rw, "Error unmarshaling json", 500)
		return
	}

	query := bson.M{"spotid": checkin.SpotId, "playerid": checkin.PlayerId}
	count, err := c_checkins.Find(query).Count()
	fmt.Printf("Found %d existing checkins\n", count)

	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	if count != 0 {
		http.Error(rw, "You have alredy checked this place!", 400)
		return
	}

	err = c_checkins.Insert(checkin)

	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}
	fmt.Fprintf(rw, "%s\n", "Ok")
}

func contains(s []Checkin, e Spot) bool {
	for _, a := range s {
		if a.SpotId.Hex() == e.ID.Hex() {
			fmt.Println("Woohoo")
			return true
		}
	}
	return false
}
