package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	. "github.com/basilboli/boomer/backend/app"
	. "github.com/basilboli/boomer/backend/db"
	"gopkg.in/mgo.v2/bson"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"time"
)

const (
	MAX_DISTANCE = 50 // in meters
)

// User returns a User for a given id
func GetUser(id string) (*User, error) {

	var p User
	err := CUsers.Find(bson.M{"_id": bson.ObjectIdHex(id)}).One(&p)
	if err != nil {
		log.Printf("Problem finding User by id %s: %s", id, err)
		return nil, err
	}
	return &p, nil
}

// UpsertUser creates new one or updates existing
func UpsertUser(p *User) (*User, error) {

	var err error
	if p.ID == "" {
		fmt.Printf("Insert : %v\n", p)
		p.ID = bson.NewObjectId()
		err = CUsers.Insert(p)
	} else {
		fmt.Printf("Update : %v\n", p)
		q := bson.M{"_id": p.ID}
		err = CUsers.Update(q, p)
	}

	if err != nil {
		return nil, err
	}

	return p, nil
}

// UpdateLocation updates User location
func UserLocUpdate(id string, c Coordinate) error {

	change := bson.M{"$set": bson.M{"coordinates": c}}
	err := CUsers.Update(bson.M{"_id": bson.ObjectIdHex(id)}, change)

	if err != nil {
		return err
	}
	fmt.Printf("Success! Loc update for %s \n", id)
	return nil
}

func BuildGameUpdateEvent(activity Activity, otherUsers []string) (GameUpdateEvent, error) {
	var gameUpdateEvent GameUpdateEvent
	// info about other Users
	oids := make([]bson.ObjectId, len(otherUsers))
	for i := range otherUsers {
		oids[i] = bson.ObjectIdHex(otherUsers[i])
	}

	// DB REQUEST : this User info
	var thisUser User
	err := CUsers.Find(bson.M{"_id": activity.UserId}).One(&thisUser)

	if err != nil {
		log.Printf("JSON marshaling failed: %s", err)
		return gameUpdateEvent, err
	}

	// DB REQUEST : other Users info
	var users []User
	err = CUsers.Pipe([]bson.M{{"$match": bson.M{"_id": bson.M{"$ne": activity.UserId, "$in": oids}}},
		{"$project": bson.M{"name": 1, "coordinates": 1, "_id": 0}}}).All(&users)

	if err != nil {
		log.Printf("Problem finding other users: %s", err)
		return gameUpdateEvent, err
	}

	// DB REQUEST : all spots for the given active game
	var game Game // to hold the active game

	// spots for the active game
	err = CGames.Pipe([]bson.M{{"$match": bson.M{"_id": activity.GameId}},
		{"$lookup": bson.M{"from": "spots", "localField": "_id", "foreignField": "gameid", "as": "spots"}}}).One(&game)

	if err != nil {
		log.Printf("Problem finding game: %s", err)
		return gameUpdateEvent, err
	}

	log.Printf("Found active game : %v", game.ID)
	log.Printf("Game spots %v", game.Spots)

	// -- end

	// find nearby spots for the user
	var nearbySpots []Spot // to hold all the spots

	err = CSpots.Find(bson.M{
		"geometry": bson.M{
			"$nearSphere": bson.M{
				"$geometry": bson.M{
					"type":        "Point",
					"coordinates": thisUser.Coordinates,
				},
				"$maxDistance": MAX_DISTANCE,
			},
		},
		"gameid": activity.GameId,
	}).All(&nearbySpots)

	// here we checkin nearby spots
	for _, spot := range nearbySpots {
		err := DoCheckin(spot.ID, activity)
		if err != nil {
			log.Printf("Problem doing checkin: %s\n", err)
			return gameUpdateEvent, err
		}
	}
	// -- end checkin nearby spots

	// getting info about checked spots for given User
	var checkins []Checkin // to hold the checked spots
	err = CCheckins.Find(bson.M{"userid": activity.UserId, "gameid": activity.GameId, "activityid": activity.ID}).All(&checkins)
	if err != nil {
		log.Printf("Problem getting info about checked spots for given User: %s\n", err)
		return gameUpdateEvent, err
	}
	// -- end

	checkedSpotsDict := fromCheckinsToDict(checkins)
	nearbySpotsDict := fromSpotsToDict(nearbySpots)

	var spots []UserSpot // to hold all the spots
	for _, s := range game.Spots {

		_, checked := checkedSpotsDict[s.ID.Hex()]
		_, nearby := nearbySpotsDict[s.ID.Hex()]
		var spot UserSpot
		if nearby {
			spot = UserSpot{Spot: Spot{ID: s.ID, Geometry: s.Geometry}, Checked: checked, NearBy: nearby}
		} else {
			spot = UserSpot{Spot: Spot{Geometry: s.Geometry}, Checked: checked, NearBy: nearby}
		}

		spots = append(spots, spot)
	}
	currentTime := time.Now().Unix() - activity.Started
	gameUpdateEvent = GameUpdateEvent{EventType: GameUpdateEventType, You: thisUser, Users: users, Spots: spots, TotalNumberOfCheckins: len(checkins), TotalNumberOfSpots: len(game.Spots), Time: currentTime}

	return gameUpdateEvent, nil
}

func DoEndGame(activityid bson.ObjectId) (Activity, error) {

	var activity Activity
	change := bson.M{"$set": bson.M{"status": Done, "ended": time.Now().Unix()}}
	err := CActivities.Update(bson.M{"_id": activityid}, change)

	if err != nil {
		log.Printf("Problem updating game activity: %s\n", err)
		return activity, err
	}
	fmt.Printf("Game activity %s has ended for ", activityid)

	err = CActivities.FindId(activityid).One(&activity)
	if err != nil {
		log.Printf("Mongo problem: %s\n", err)
		return activity, err
	}
	return activity, nil
}

func DoCheckin(spotid bson.ObjectId, activity Activity) error {
	count, err := CCheckins.Find(bson.M{"spotid": spotid, "gameid": activity.GameId, "userid": activity.UserId, "activityid": activity.ID}).Count()
	if err != nil {
		return err
	}
	if count != 0 {
		log.Printf("Boom! Spot has been checked already.\n")
	} else {
		checkin := Checkin{SpotId: spotid, GameId: activity.GameId, UserId: activity.UserId, ActivityId: activity.ID, Created: time.Now().Unix()}
		err = CCheckins.Insert(checkin)

		if err != nil {
			return err
		}
		log.Printf("Boom! New spot checkin : %+v\n", checkin)
	}
	return nil
}

// GetGameHandler gets active game
func GetOngoingGameHandler(rw http.ResponseWriter, req *http.Request) {

	userid, ok := UserIdFromContext(req.Context())
	if !ok {
		http.Error(rw, "Problem getting userid from context", 500)
		return
	}

	log.Printf("Request User %s", userid)

	game, err := GetOngoingGame(userid)

	if err != nil {
		http.Error(rw, "No game found", 404)
		return
	}

	log.Printf("Found game %+v", game)
	json.NewEncoder(rw).Encode(game)
	return
}

// GetGameHandler gets active game
func GetUserInfoHandler(rw http.ResponseWriter, req *http.Request) {

	userid, ok := UserIdFromContext(req.Context())
	if !ok {
		http.Error(rw, "Problem getting userid from context", 500)
		return
	}

	log.Printf("Request userid %s", userid)

	user, err := GetUser(userid)

	if err != nil {
		http.Error(rw, "No user found", 404)
		return
	}

	log.Printf("Found user %+v", user)

	ongoingGame, err := GetOngoingGame(userid)

	if err != nil {
		userInfo := UserInfo{ID: user.ID, Name: user.Name, Email: user.Email, Coordinates: user.Coordinates, Created: user.Created, HasOngoingGame: false}
		json.NewEncoder(rw).Encode(userInfo)
		return
	}
	log.Printf("Found ongoing game %+v", ongoingGame)
	userInfo := UserInfo{ID: user.ID, Name: user.Name, Email: user.Email, Coordinates: user.Coordinates, Created: user.Created, HasOngoingGame: true, OngoingGame: ongoingGame}

	json.NewEncoder(rw).Encode(userInfo)
	return
}

// GetOngoingGame returns ongoing game
func GetOngoingGame(userid string) (Game, error) {

	var activ Activity // looking for active activity
	var game Game      // to hold the game results
	err := CActivities.Find(bson.M{"status": Ongoing, "userid": bson.ObjectIdHex(userid)}).One(&activ)
	if err != nil {
		return game, err
	}
	log.Printf("Found activity %+v", activ)

	err = CGames.FindId(activ.GameId).One(&game)
	if err != nil {
		return game, err
	}
	return game, nil
}

// GetCurrentActivity returns current activity
func GetOngoingActivity(userid string) (Activity, error) {

	var activ Activity // looking for  activity

	err := CActivities.Find(bson.M{"status": Ongoing, "userid": bson.ObjectIdHex(userid)}).One(&activ)
	if err != nil {
		return activ, err
	}
	log.Printf("Found activity %+v", activ)

	return activ, nil
}

// GetGameActivities starts new game for the User
func GetGameActivities(rw http.ResponseWriter, req *http.Request) {

	userid, ok := UserIdFromContext(req.Context())
	if !ok {
		http.Error(rw, "Problem getting userid from context", 500)
		return
	}

	gameIdStr := req.URL.Query().Get("id")

	if gameIdStr == "" || !bson.IsObjectIdHex(gameIdStr) {
		http.Error(rw, "game id is not provided or not valid", 405)
		return
	}

	gameId := bson.ObjectIdHex(gameIdStr)

	var activities []Activity

	err := CActivities.Find(bson.M{"gameid": gameId, "userid": bson.ObjectIdHex(userid)}).All(&activities)

	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	json.NewEncoder(rw).Encode(activities)
	return

}

// StartGameHandler starts new game for the User
func StartGameHandler(rw http.ResponseWriter, req *http.Request) {

	if req.Method != "POST" {
		http.Error(rw, http.StatusText(405), 405)
		return
	}

	userid, ok := UserIdFromContext(req.Context())
	if !ok {
		http.Error(rw, "Problem getting userid from context", 500)
		return
	}

	gameIdStr := req.URL.Query().Get("id")

	if gameIdStr == "" || !bson.IsObjectIdHex(gameIdStr) {
		http.Error(rw, "game id is not provided or not valid", 405)
		return
	}

	gameId := bson.ObjectIdHex(gameIdStr)

	count, err := CActivities.Find(bson.M{"gameid": gameId, "status": Ongoing, "userid": bson.ObjectIdHex(userid)}).Count()

	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	if count != 0 {
		http.Error(rw, "You have already have active game!", http.StatusBadRequest)
		return
	}

	// create new actity for the game
	newActivity := Activity{GameId: gameId, Started: time.Now().Unix(), Status: Ongoing, UserId: bson.ObjectIdHex(userid)}
	err = CActivities.Insert(newActivity)

	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}
	log.Println("Game started")
	fmt.Fprintf(rw, "%s\n", "Ok")

}

// GameStopHandler starts new game for the User
func StopGameHandler(rw http.ResponseWriter, req *http.Request) {

	if req.Method != "POST" {
		http.Error(rw, http.StatusText(405), 405)
		return
	}

	userid, ok := UserIdFromContext(req.Context())
	if !ok {
		http.Error(rw, "Problem getting userid from context", 500)
		return
	}

	gameIdStr := req.URL.Query().Get("id")

	if gameIdStr == "" || !bson.IsObjectIdHex(gameIdStr) {
		http.Error(rw, "game id is not provided or not valid", 405)
		return
	}

	gameId := bson.ObjectIdHex(gameIdStr)

	var activ Activity
	err := CActivities.Find(bson.M{"gameid": gameId, "status": Ongoing, "userid": bson.ObjectIdHex(userid)}).One(&activ)

	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	fmt.Printf("Found %+v active activity\n", activ)

	if err != nil {
		http.Error(rw, "There is no active activity for this game!", http.StatusBadRequest)
		return
	}

	// setting activity to done
	activ.Status = Done
	activ.Ended = time.Now().Unix()
	q := bson.M{"_id": activ.ID}
	err = CActivities.Update(q, activ)

	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	fmt.Fprintf(rw, "%s\n", "Ok")

}

// GamesAround returns games around the User
func GetGamesAroundHandler(rw http.ResponseWriter, req *http.Request) {

	userid, ok := UserIdFromContext(req.Context())

	if !ok {
		http.Error(rw, "Problem getting userid from context", 500)
		return
	}

	var User User

	err := CUsers.FindId(bson.ObjectIdHex(userid)).One(&User)

	if err != nil {
		http.Error(rw, "Problem getting userid from context", 500)
		return
	}
	latStr := req.URL.Query().Get("lat")
	lngStr := req.URL.Query().Get("lng")

	if latStr == "" || lngStr == "" {
		http.Error(rw, "lat,lng not provided", 405)
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)

	if err != nil {
		http.Error(rw, "Problem parsing lat,lng. Check if they are float numbers", 405)
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)

	if err != nil {
		http.Error(rw, "Problem parsing lat,lng. Check if they are float numbers", 405)
		return
	}

	var nearByGames []Game // to hold all games around the User

	coord := []float64{lng, lat}

	err = CGames.Find(
		bson.M{"geometry": bson.M{"$nearSphere": bson.M{"$geometry": bson.M{"type": "Point", "coordinates": coord},
			"$maxDistance": 1000}}}).All(&nearByGames)

	if err != nil {
		http.Error(rw, "Problem getting games around", 500)
		return
	}

	json.NewEncoder(rw).Encode(nearByGames)
	return
}

// LocUpdate creates new User / or updates existing
func LocUpdateHandler(rw http.ResponseWriter, req *http.Request) {

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

	var User User
	err = json.Unmarshal(body, &User)
	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	if User.ID == "" {
		fmt.Printf("Insert : %v\n", User)
		User.ID = bson.NewObjectId()
		err = CUsers.Insert(User)
	} else {
		fmt.Printf("Update : %v\n", User)
		q := bson.M{"_id": User.ID}
		err = CUsers.Update(q, User)
	}

	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	// convert it to JSON so it can be displayed
	data, err := json.Marshal(User)
	if err != nil {
		log.Printf("JSON marshaling failed: %s", err)
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	fmt.Fprintf(rw, "%s\n", data)
}

// CheckinSpot make checkin of the spot
func CheckinSpotHandler(rw http.ResponseWriter, req *http.Request) {

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

	query := bson.M{"spotid": checkin.SpotId, "userid": checkin.UserId}
	count, err := CCheckins.Find(query).Count()
	fmt.Printf("Found %d existing checkins\n", count)

	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	if count != 0 {
		http.Error(rw, "You have alredy checked this place!", 400)
		return
	}

	err = CCheckins.Insert(checkin)

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

func UserIdFromContext(ctx context.Context) (string, bool) {
	// ctx.Value returns nil if ctx has no value for the key;
	// the net.IP type assertion returns ok=false for nil.
	userid, ok := ctx.Value("userid").(string)
	return userid, ok
}
