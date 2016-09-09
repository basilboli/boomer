package app

import "gopkg.in/mgo.v2/bson"

const (
	UserLocUpdateEventType = "user_loc_update"
	GameUpdateEventType    = "game_update"
	GameOverEventType      = "game_over"
)

type ActivityStatus int

const (
	Ongoing ActivityStatus = iota
	Done
)

type Event interface {
	Type() string
}

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
	ID           bson.ObjectId `bson:"_id,omitempty" json:"spotid,omitempty"`
	GameId       bson.ObjectId `bson:"gameid,omitempty" json:"-"`
	Name         string        `bson:"name" json:"name,omitempty"`
	Geometry     Point         `bson:"geometry" json:"geometry"`
	Created      int64         `bson:"created,omitempty" json:"created"`
	LastModified int64         `bson:"lastmodified,omitempty" json:"lastmodified"`
}

type UserSpot struct {
	Spot
	Checked bool `bson:"checked" json:"checked"`
	NearBy  bool `bson:"nearby" json:"nearby"`
}

type Game struct {
	ID           bson.ObjectId `bson:"_id,omitempty" json:"-"`
	Name         string        `bson:"name" json:"-"`
	Geometry     Polygon       `bson:"geometry" json:"geometry"`
	Spots        []Spot        `bson:"spots" json:"spots,omitempty"`
	Created      int64         `bson:"created,omitempty" json:"created"`
	LastModified int64         `bson:"lastmodified,omitempty" json:"lastmodified"`
}

type UserGame struct {
	Game
	Active bool `bson:"active" json:"-"`
}

type Activity struct {
	ID      bson.ObjectId  `bson:"_id,omitempty" json:"activityid"`
	GameId  bson.ObjectId  `bson:"gameid,omitempty" json:"gameid"`
	UserId  bson.ObjectId  `bson:"userid,omitempty" json:"userid"`
	Started int64          `bson:"started,omitempty" json:"started"`
	Ended   int64          `bson:"ended,omitempty" json:"ended"`
	Status  ActivityStatus `bson:"status" json:"status"`
}

type User struct {
	ID           bson.ObjectId `bson:"_id" json:"userid,omitempty"`
	Name         string        `bson:"name" json:"name"`
	Email        string        `bson:"email" json:"-"`
	PasswordHash string        `bson:"password_hash" json:"-"`
	Coordinates  Coordinate    `json:"coordinates" bson:"coordinates"`
	Created      int64         `bson:"created,omitempty" json:"created"`
	LastModified int64         `bson:"lastmodified,omitempty" json:"lastmodified"`
}

type UserInfo struct {
	ID             bson.ObjectId `json:"userid,omitempty"`
	Name           string        `json:"name"`
	Email          string        `json:"email"`
	Coordinates    Coordinate    `json:"coordinates" `
	Created        int64         `json:"created"`
	HasOngoingGame bool          `json:"has_ongoing_game"`
	OngoingGame    Game          `json:"ongoing_game,omitempty"`
}

type UserLoginInfo struct {
	Name        string     `bson:"name" json:"name"`
	Email       string     `bson:"email" json:"email"`
	Password    string     `bson:"password" json:"password"`
	Coordinates Coordinate `json:"coordinates" bson:"coordinates"`
}

type Checkin struct {
	ID         bson.ObjectId `bson:"_id,omitempty" json:"checkinid"`
	SpotId     bson.ObjectId `bson:"spotid,omitempty" json:"spotid"`
	ActivityId bson.ObjectId `bson:"activityid,omitempty" json:"activityid"`
	GameId     bson.ObjectId `bson:"gameid,omitempty" json:"gameid"`
	UserId     bson.ObjectId `bson:"userid,omitempty" json:"userid"`
	Created    int64         `bson:"created,omitempty" json:"created"`
}

// ----- EVENTS ------

type UserLocUpdateEvent struct {
	EventType   string     `json:"event_type"`
	Coordinates Coordinate `json:"coordinates"`
}

type GameUpdateEvent struct {
	EventType             string     `json:"event_type"`
	You                   User       `json:"you"`
	Users                 []User     `json:"users"`
	Spots                 []UserSpot `json:"spots"`
	Created               int64      `json:"created"`
	Time                  int64      `json:"time"`
	TotalNumberOfSpots    int        `json:"spots_total"`
	TotalNumberOfCheckins int        `json:"checkins_total"`
}

type GameOverEvent struct {
	EventType string `json:"event_type"`
	Started   int64  `json:"started"`
	Ended     int64  `json:"ended"`
	Score     int64  `json:"score"`
}

func (e UserLocUpdateEvent) Type() string {
	return UserLocUpdateEventType
}

func (e GameUpdateEvent) Type() string {
	return GameUpdateEventType
}

func (e GameOverEvent) Type() string {
	return GameOverEventType
}
