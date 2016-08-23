package ws

type BoomerMessageType int

const (
	LocUpdate BoomerMessageType = iota
	ChatMessage
)

type Message struct {
	Type    BoomerMessageType `json:"type"`
	Name    string            `json:"name"`
	Lat     string            `json:"lat"`
	Lng     string            `json:"lng"`
	Players []*Player         `json:"players"`
}

type Player struct {
	Name string `json:"name"`
	Lat  string `json:"lat"`
	Lng  string `json:"lng"`
}

func (self *Message) String() string {
	return self.Name + "@" + self.Lat + ":" + self.Lng
}
