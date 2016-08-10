package storage

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

func Config() {

	host = os.Getenv("MONGODB_PORT_27017_TCP_ADDR")

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
	log.Println("Connection established!")
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
	log.Println("Connecting to " + conn)
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
	fmt.Printf("New mongo session : %v \n", DB != nil)
	defer func() {
		if e := recover(); e != nil {
			log.Println(e)
		}
	}()
}
