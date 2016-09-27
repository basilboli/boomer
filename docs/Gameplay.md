#Gameplays

## BoomerMan

## Running is not enough

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

## Boom with your friends 

- multiplayer game

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

## Boomer KillerHood

## When Neighbours become Killers

TODO 

## Boomer Treasure 

## Solve enigmas and find the hidden Treasure

TODO 