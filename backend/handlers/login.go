package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	. "bitbucket.org/basilboli/boomer/backend/app"
	. "bitbucket.org/basilboli/boomer/backend/db"
	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/mgo.v2/bson"
	"io/ioutil"
)

type LoginResponse struct {
	Token string `json:"token"`
}

type loginHandler struct {
	secret string
}
type signupHandler struct {
	secret string
}

func (h *loginHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	log.Println("Login")
	email, password, ok := r.BasicAuth()

	if !ok {
		http.Error(w, "authorization failed", http.StatusUnauthorized)
		return
	}

	log.Printf("Found %s:%s\n", email, password)

	var u User
	err := CUsers.Find(bson.M{"email": email}).One(&u)
	if err != nil {
		log.Printf("Problem finding User by email %s: %s\n", email, err)
		http.Error(w, "authorization failed", http.StatusUnauthorized)
		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	if err != nil {
		log.Printf("Problem CompareHashAndPassword %s=%s: %s\n", u.PasswordHash, password, err)
		http.Error(w, "authorization failed", http.StatusUnauthorized)
		return
	}

	tokenString, err := NewToken(u, h.secret)

	if err != nil {
		http.Error(w, "authorization failed", http.StatusUnauthorized)
		return
	}

	response := LoginResponse{
		Token: tokenString,
	}
	json.NewEncoder(w).Encode(response)
	return
}

func LoginHandler(secret string) http.Handler {
	return &loginHandler{
		secret: secret,
	}
}

func SignUpHandler(secret string) http.Handler {
	return &signupHandler{
		secret: secret,
	}
}

func (h *signupHandler) ServeHTTP(rw http.ResponseWriter, req *http.Request) {

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

	var userInfo UserLoginInfo
	err = json.Unmarshal(body, &userInfo)
	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	log.Printf("Signup request: %v\n", userInfo)

	count, err := CUsers.Find(bson.M{"email": userInfo.Email}).Count()
	if err != nil {
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	if count != 0 {
		http.Error(rw, "Account with this email already exists!", http.StatusUnauthorized)
		return
	}
	// hash the password
	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(userInfo.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("ERROR : Problem calculating the hash: %s\n", err)
		http.Error(rw, http.StatusText(500), 500)
		return
	}
	passwordHash := string(passwordHashBytes)

	log.Println("Password hash :" + passwordHash)
	id := bson.NewObjectId()
	user := User{ID: id, Name: userInfo.Name, Email: userInfo.Email, PasswordHash: passwordHash, Coordinates: userInfo.Coordinates}
	err = CUsers.Insert(user)

	if err != nil {
		log.Printf("ERROR : Problem creating user: %s\n", user)
		http.Error(rw, http.StatusText(500), 500)
		return
	}

	tokenString, err := NewToken(user, h.secret)

	if err != nil {
		http.Error(rw, "authorization failed", http.StatusUnauthorized)
		return
	}

	response := LoginResponse{
		Token: tokenString,
	}
	json.NewEncoder(rw).Encode(response)
	return
}

func NewToken(u User, secret string) (string, error) {

	token := jwt.New(jwt.SigningMethodHS256)
	token.Claims["exp"] = time.Now().Add(time.Hour * 72).Unix()
	token.Claims["iss"] = "auth.service"
	token.Claims["iat"] = time.Now().Unix()
	token.Claims["email"] = u.Email
	token.Claims["sub"] = u.ID
	tokenString, err := token.SignedString([]byte(secret))
	return tokenString, err

}
