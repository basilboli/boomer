package main

import (
	"flag"
	. "github.com/basilboli/boomer/backend/app"
	. "github.com/basilboli/boomer/backend/db"
	"gopkg.in/mgo.v2/bson"
	"log"
	"time"
)

const version = "1.0.0"

// GetGames returns all games
func GetGames() ([]Game, error) {

	var games []Game
	err := CGames.Find(bson.M{}).All(&games)
	if err != nil {
		log.Printf("Problem finding games :%s", err)
		return nil, err
	}
	return games, nil
}

// GetSpots returns first 10 spots
func GetSpots() ([]Spot, error) {

	// taking first N POIs
	var spots []Spot
	err := CPois.Find(bson.M{}).All(&spots)
	if err != nil {
		log.Printf("Problem finding spots :%s", err)
		return nil, err
	}

	for _, s := range spots[1:10] {
		log.Printf("%+v\n", s)
	}

	return spots, nil
}

// GetGames returns all games
func GenerateGame(n int) {

	// take first zone
	var games []Game
	err := CZois.Find(bson.M{}).All(&games)
	if err != nil {
		log.Printf("Problem finding game :%s", err)
		return
	}

	log.Printf("Found %d games \n", len(games))

	total := 0

	for _, game := range games[0:n] {

		// nearby spots for this game
		var withinSpots []Spot // to hold all the spots

		err := CPois.Find(bson.M{"geometry": bson.M{"$geoWithin": bson.M{"$geometry": bson.M{
			"type":        "Polygon",
			"coordinates": game.Geometry.Coordinates,
		}}}}).All(&withinSpots)

		if err != nil {
			log.Printf("Problem withinSpots :%s", err)
			return
		}

		log.Printf("Found %d withinSpots \n", len(withinSpots))
		total = total + len(withinSpots)

		// creating new game
		newGameId := bson.NewObjectId()
		newGame := Game{ID: newGameId, Geometry: game.Geometry}
		err = CGames.Insert(newGame)

		if err != nil {
			log.Printf("Problem inserting new game %+v : %s", newGame, err)
			return
		}

		// creating new spots

		var spots []Spot
		for _, s := range withinSpots {
			// 	log.Printf("%+v\n", s)
			newSpot := Spot{ID: bson.NewObjectId(), Geometry: s.Geometry, GameId: newGameId, Created: time.Now().Unix()}
			err := CSpots.Insert(newSpot)
			if err != nil {
				log.Printf("Problem inserting new game %+v : %s", newSpot, err)
				return
			}
			spots = append(spots, newSpot)
		}

		// updating game with spots
		newGameUpdate := Game{Geometry: game.Geometry, Spots: spots, Created: time.Now().Unix()}
		q := bson.M{"_id": newGameId}
		err = CGames.Update(q, newGameUpdate)
	}

	log.Printf("Total %d \n", total)
}

func main() {
	var (
		action = flag.String("action", "list", "Action")
		size   = flag.Int("size", 1, "Size")
	)
	flag.Parse()

	log.Printf("Action %s", *action)

	if *action == "games" {
		log.Println("Listing games")
		GetGames()
	}

	if *action == "spots" {
		log.Println("Listing spots")
		GetSpots()
	}

	if *action == "generate" {
		log.Println("Generating new game")
		GenerateGame(*size)
	}

	if *action == "flush" {
		var err error

		_, err = CGames.RemoveAll(bson.M{})

		if err != nil {
			log.Printf("Problem deleting games: %s", err)
			return
		}
		_, err = CSpots.RemoveAll(bson.M{})
		if err != nil {
			log.Printf("Problem deleting spots: %s", err)
			return
		}
		_, err = CCheckins.RemoveAll(bson.M{})
		if err != nil {
			log.Printf("Problem deleting checkins: %s", err)
			return
		}
		_, err = CUsers.RemoveAll(bson.M{})
		if err != nil {
			log.Printf("Problem deleting users: %s", err)
			return
		}
		_, err = CActivities.RemoveAll(bson.M{})
		if err != nil {
			log.Printf("Problem deleting activities: %s", err)
			return
		}
	}

}
