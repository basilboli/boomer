package main

import (
	"fmt"
	"github.com/basilboli/boomer/server/api-rest/api"
	"net/http"
)

func main() {
	fmt.Println("Server starting")
	http.ListenAndServe(":3000", api.Handlers())
}
