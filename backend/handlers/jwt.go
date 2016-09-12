package handlers

import (
	"context"
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"net/http"
)

func AuthHandler(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token, err := jwt.ParseFromRequest(r, func(token *jwt.Token) (interface{}, error) {
			return []byte("driblet-venge-requiem-repose"), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "authorization failed", http.StatusUnauthorized)
			return
		}
		userid := token.Claims["sub"].(string)
		fmt.Printf("Token maps to userid: %s\n", userid)
		ctx := NewContextWithUserID(r.Context(), userid)

		// cross-origin headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "origin, content-type, accept")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")

		h(w, r.WithContext(ctx))
	}
}

func NewContextWithUserID(ctx context.Context, userid string) context.Context {
	return context.WithValue(ctx, "userid", userid)
}
