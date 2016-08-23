package app

import (
	"encoding/json"
	"fmt"
	"gopkg.in/mgo.v2/bson"
	"io"
	"io/ioutil"
	"log"
	"net/http"
)

// hello world, the web server
func HelloServer(rw http.ResponseWriter, req *http.Request) {
	io.WriteString(rw, "hello, world!\n")
}

func GetLocUpdateResponse(id string, otherPlayers []string) (LocUpdateResponse, error) {
	var locUpdateResponse LocUpdateResponse
	// info about other players
	oids := make([]bson.ObjectId, len(otherPlayers))
	for i := range otherPlayers {
		oids[i] = bson.ObjectIdHex(otherPlayers[i])
	}

	// DB REQUEST : this player info
	var thisPlayer Player
	err := c_players.Find(bson.M{"_id": bson.ObjectIdHex(id)}).One(&thisPlayer)

	if err != nil {
		log.Printf("JSON marshaling failed: %s", err)
		return locUpdateResponse, err
	}

	// DB REQUEST : other players info
	var players []Player
	err = c_players.Pipe([]bson.M{{"$match": bson.M{"_id": bson.M{"$ne": bson.ObjectIdHex(id), "$in": oids}}},
		{"$project": bson.M{"name": 1, "coordinates": 1, "_id": 0}}}).All(&players)

	// DB REQUEST : all spots for the given active game
	var game Game // to hold the active game

	// spots for the active game
	err = c_games.Pipe([]bson.M{{"$match": bson.M{"active": true}},
		{"$lookup": bson.M{"from": "spots", "localField": "_id", "foreignField": "gameid", "as": "spots"}}}).One(&game)
	if err != nil {
		log.Printf("spots JSON marshaling failed: %s", err)
		return locUpdateResponse, err
	}
	// -- end

	// nearby spots for the user
	var nearbySpots []Spot // to hold all the spots

	err = c_spots.Find(bson.M{"location": bson.M{"$nearSphere": bson.M{"$geometry": bson.M{

		"type": "Point",

		"coordinates": thisPlayer.Coordinates,
	},
		"$maxDistance": MAX_DISTANCE,
	},
	}}).All(&nearbySpots)

	if err != nil {
		log.Printf("spots JSON marshaling failed: %s", err)
		return locUpdateResponse, err
	}
	// -- end

	// info about checked spots for given player
	var checkins []Checkin // to hold the checked spots
	err = c_checkins.Find(bson.M{"playerid": bson.ObjectIdHex(id)}).All(&checkins)
	if err != nil {
		log.Printf("checkins JSON marshaling failed: %s", err)
		return locUpdateResponse, err
	}
	// -- end

	checkedSpotsDict := fromCheckinsToDict(checkins)
	nearbySpotsDict := fromSpotsToDict(nearbySpots)

	var spots []Spot // to hold all the spots
	for _, s := range game.Spots {

		_, checked := checkedSpotsDict[s.ID.Hex()]
		_, nearby := nearbySpotsDict[s.ID.Hex()]
		var spot Spot
		if nearby {
			spot = Spot{ID: s.ID, Location: s.Location, Checked: checked, NearBy: nearby}
		} else {
			spot = Spot{Location: s.Location, Checked: checked, NearBy: nearby}
		}

		spots = append(spots, spot)
	}

	locUpdateResponse = LocUpdateResponse{You: thisPlayer, Players: players, Spots: spots}

	// data, err := json.Marshal(locUpdateResponse)
	// if err != nil {
	// 	log.Printf("JSON marshaling failed: %s", err)
	// 	return ""
	// }

	// return string(data)
	return locUpdateResponse, nil
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

func fromCheckinsToDict(s []Checkin) map[string]bool {
	res := make(map[string]bool, len(s))
	for _, a := range s {
		res[a.SpotId.Hex()] = true
	}
	return res
}

func fromSpotsToDict(s []Spot) map[string]bool {
	res := make(map[string]bool, len(s))
	for _, a := range s {
		res[a.ID.Hex()] = true
	}
	return res
}

type HandlerFunc func(http.ResponseWriter, *http.Request)

func corsHandler(f http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "origin, content-type, accept")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")

		http.HandlerFunc(f).ServeHTTP(w, r)

	}
}
