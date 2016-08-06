package main

import (
	"bitbucket.org/basilboli/boomer/server/api-rest/api"
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("Server starting")
	http.ListenAndServe(":3000", api.Handlers())
}
