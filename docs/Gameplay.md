#Gameplays

## BoomerMan

###mode
- single player game

###what you can see:

- region of the game 
- colored spots (could be the same color)

###players main task:
- run fast and visit all the spots
- make the longest chain with the spots of the same color to multiply your score
- beat the friends on the leaderboard

###game mechanics
- the spot is checked if the user is close (boomerman.spot.check.proximity=50m) 

## BoomerTeam

- multiplayer version of BoomerMan

### what you can see:
- region of the game 
- spots 
- enemies 
- active bombs 
- bombs explosion 
- (experimental) bombs recharge spot 
- (experimental) immunity spot 

### players main task:
- color maximum spots with the team's color 
- kill enemies using bombs 
- the game is ended when all the spots are colored or all the team's players are dead

### game mechanics
- to play the game user should be part of the team or create new one and invite the friends
- any team player can start new game and select game zone
- any team player can see the countdown boomerteam.game.countdown.time (1m) before the game starts (like flashcode)
- user should join the game to play 
- when joining the game user selects a side (white side of angels or dark side of demons)
- any user visiting a spot color the spot with the team's color
- every user possesses a boomerteam.bombs.initial.count bombs
- user can put a bomb at any place 
- bombs exploses after boomerteam.bomb.explosition.time (10s)
- if any user is in the boomerteam.bomb.explosition.distance radius (100 m) he is dead
- (experimental) boomerteam.bombs.recharge.count times during a game new recharge spot appears on the game
- (experimental) boomerteam.bombs.immunity.count times during a game new immunity spot appears on the game


## BoomerCity

###what you can see:
- map of visible clues and a final hidden spot

###players main task:
- pickup as many spots clues as possible to be the first team to find the final hidden spot

###game mechanics
- every clue leads to the final hidden
- when you are nearby a clue spot you can check it and read the clue text and guess the final hidden spot
- when you have checked the spot all the clues and the spot becomes green
- when you are nearby the final hidden spot it becomes visible to you and you can check it
- The winner team is the first team to find and check the final hidden spot
- global leaderboard of users

### game point of interests (curated list by boomer team)
- https://docs.google.com/spreadsheets/d/134LjB_tT33Fs_w4J-cZyAnU6-Vsgt4GDlZwfI14i4VQ/edit#gid=0