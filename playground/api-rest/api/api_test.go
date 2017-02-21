package api_test

import (
	"fmt"
	"github.com/basilboli/boomer/server/api-rest/api"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

var (
	server     *httptest.Server
	reader     io.Reader
	playersUrl string
)

func init() {
	server = httptest.NewServer(api.Handlers())

	playersUrl = fmt.Sprintf("%s/players", server.URL)
}

func TestCreateUser(t *testing.T) {
	userJson := `{"id": 100, "lat":114.204017, "lng":4.525874}`

	reader = strings.NewReader(userJson)

	request, err := http.NewRequest("POST", playersUrl, reader)

	res, err := http.DefaultClient.Do(request)

	if err != nil {
		t.Error(err)
	}

	if res.StatusCode != 201 {
		t.Errorf("Success expected: %d", res.StatusCode)
	}
}

func TestListUsers(t *testing.T) {
	reader = strings.NewReader("")

	request, err := http.NewRequest("GET", playersUrl, reader)

	res, err := http.DefaultClient.Do(request)

	if err != nil {
		t.Error(err)
	}

	if res.StatusCode != 200 {
		t.Errorf("Success expected: %d", res.StatusCode)
	}
}
