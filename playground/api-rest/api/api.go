package api

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"io/ioutil"
	"net/http"
)

type Player struct {
	Id   int32   `json:"id,omitempty" bson:"id,omitempty"`
	Name string  `json:"name,omitempty" bson:"name,omitempty"`
	Lat  float32 `json:"lat,omitempty" bson:"lat,omitempty"`
	Lng  float32 `json:"lng,omitempty" bson:"lng,omitempty"`
}

var playersStore map[int32]Player

func init() {
	playersStore = make(map[int32]Player)
}

func Handlers() *mux.Router {
	r := mux.NewRouter()

	r.HandleFunc("/players", createPlayerHandler).Methods("POST")
	r.HandleFunc("/players", listPlayersHandler).Methods("GET")
	return r
}

func createPlayerHandler(w http.ResponseWriter, r *http.Request) {
	p := Player{}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		fmt.Printf("Error: %s\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = json.Unmarshal(body, &p)
	if err != nil {
		fmt.Printf("Error: %s\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	playersStore[p.Id] = p
	fmt.Printf("Players count is %s\n", len(playersStore))
	w.WriteHeader(http.StatusCreated)
}

func listPlayersHandler(w http.ResponseWriter, r *http.Request) {
	players := make([]Player, 0, len(playersStore))

	for _, v := range playersStore {
		players = append(players, v)
	}

	content, err := json.Marshal(players)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Add("BOOMER-X", "RUN RUN!")
	w.Write(content)
}
