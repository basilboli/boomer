package db

import (
	"fmt"
	"log"
	"os"

	"gopkg.in/mgo.v2"
)

const (
	MONGODB_NAME = "boomer"
)

var (
	DB       *mgo.Database
	host     string
	port     string
	instance string
	username string
	password string
)

var CGames *mgo.Collection
var CSpots *mgo.Collection
var CUsers *mgo.Collection
var CCheckins *mgo.Collection
var CPois *mgo.Collection
var CZois *mgo.Collection
var CActivities *mgo.Collection

func init() {
	InitDB()
	CGames = DB.C("games")
	CSpots = DB.C("spots")
	CUsers = DB.C("users")
	CCheckins = DB.C("checkins")
	CPois = DB.C("pois")
	CZois = DB.C("zois")
	CActivities = DB.C("activities")
}

func Config() {

	host = os.Getenv("MONGO_MASTER_SERVICE_HOST")

	if len(host) == 0 {
		host = "localhost"
	}

	port = os.Getenv("MONGODB_PORT_27017_TCP_PORT")
	if len(port) == 0 {
		port = "27017"
	}

}

func MustConnectMongo() {
	if err := ConnectMongo(); err != nil {
		log.Panic("Failed to connect to mongo!")
	}
	log.Println("Mongo connection is established!")
}

func ConnectMongo() error {
	conn := ""
	if len(username) > 0 {
		conn += username

		if len(password) > 0 {
			conn += ":" + password
		}

		conn += "@"
	}

	conn += fmt.Sprintf("%s:%s/%s", host, port, MONGODB_NAME)
	log.Println("Connecting to mongodb:" + conn)
	session, err := mgo.Dial(conn)
	if err != nil {
		return err
	}

	DB = session.DB(MONGODB_NAME)
	return nil
}

func InitDB() {
	Config()
	MustConnectMongo()
	log.Printf("New mongo session : %v \n", DB != nil)
	defer func() {
		if e := recover(); e != nil {
			log.Println(e)
		}
	}()
}
