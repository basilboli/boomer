# Release notes 

## Version 1.1.4-rc (backed)

0. Player becomes user. All player entries are renamed to user

1. Signup and Authentication using jwt token (/signup, /login)

1. All endpoints + websockets are secured with jwt token

2. Pregenerated games for the paris using velib and paris quartier datasets (~ 80 games covering all paris)

3. Showing nearest games around you (/game/around) (1000 meters around)

3. Introduction of game activity. When user starts a game server starts new activity (game/start)

4. User can stop a game himself (/game/stop) or the game will be automatically stopped when the user check all the spots for the game

2. Spots are auto-checked on every user location update

4. History of activities for a game (game/activities). Every activity contains start time, end time and score which is actually (end time - start time)

4. Websockets endpoint now accept events (user_loc_update) and send events (game_update, game_over)
