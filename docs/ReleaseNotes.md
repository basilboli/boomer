# Release notes 

## Version 1.1.8-rc (backend)

- Cors middlewared fixed

- Using id of the game as query param instead of body json {"gameid": "XXXX"}

- /game/start?id=XXXX : start a game with id

- /game/stop?id=XXXX : stop a game with id

- /game/activities?id=XXXX : show the activities for game with id

- /game/around?lat=XXX&lng=YYY : show the games around the coordinates


## Version 1.1.4-rc (backend)

- Player becomes user. All player entries are renamed to user

- Signup and Authentication using jwt token (/signup, /login)

- All endpoints + websockets are secured with jwt token

- Pregenerated games for the paris using velib and paris quartier datasets (~ 80 games covering all paris)

- Showing nearest games around you (/game/around) (1000 meters around)

- Introduction of game activity. When user starts a game server starts new activity (game/start)

- User can stop a game himself (/game/stop) or the game will be automatically stopped when the user check all the spots for the game

- Spots are auto-checked on every user location update

- History of activities for a game (game/activities). Every activity contains start time, end time and score which is actually (end time - start time)

- Websockets endpoint now accept events (user_loc_update) and send events (game_update, game_over)

