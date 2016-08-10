
# Dictionary

- Game

- Player

User of the game.

- Spot

- Active game

Currently active game. During alpha we have one active game at a time.


# API

Note : every endpoint is labeled as server sent events (SSE) or classic REST API (POST|GET).

- (GET) v1/game  - get active game showing game polygon

```

{
    "geometry": {
       "coordinates": [
          [
             [
                2.32705235481262,
                48.8757237949488
             ],
             [
                2.32705235481262,
                48.8796822204707
             ],
             [
                2.33098983764648,
                48.8796822204707
             ],
             [
                2.33098983764648,
                48.8757237949488
             ],
             [
                2.32705235481262,
                48.8757237949488
             ]
          ]
       ]
    }
 }
```

- (POST) v1/player/locupdate - update player's location. If player doesn't exist it creates new one and returns his id.

Request
```

{"name":"mike","coordinates":[2.3277175426483154,48.8787826058128]

```

Response
```

{"playerid":"57ab1dafbab09c24b9eefe12","name":"mike","coordinates":[2.3277175426483154,48.8787826058128]

```

- (Server Sent Events)  v1/events?playerid=57ab1dafbab09c24b9eefe12  - streaming  other players, all spots, checked spots by player and nearby spots within 50 meters

# PS1 : you can't see other player ids, this is a minimal foolproof, at least at the beginning
# PS2 : to checkin the spot you need a spotid, the trick is that you see only the ids for nearby spots so you can checkin them. 

Request
```

v1/events?playerid=XXXXXXXX

```

Response (SSE)
```
{
  "players": [
    {
      "playerid": "57ab00ddbab09c194aaa9b74",
      "name": "mike",
      "coordinates": [
        2.32926249504089,
        48.878038206549
      ]
    }
  ],
  "spots": [
    {
      "checked": false,
      "location": {
        "type": "Point",
        "coordinates": [
          2.329262495040893,
          48.87803820654905
        ]
      }
    },
    {
      "checked": true,
      "location": {
        "type": "Point",
        "coordinates": [
          2.3304426670074463,
          48.87672577896875
        ]
      }
    },
    {
      "checked": false,
      "location": {
        "type": "Point",
        "coordinates": [
          2.327781915664673,
          48.87876496614797
        ]
      }
    }
  ],
  "nearby_spots": [
    {
      "spotid": "57a9caf0c6de518244114c5b",
      "name": "",
      "location": {
        "type": "Point",
        "coordinates": [
          2.329262495040893,
          48.87803820654905
        ]
      }
    }
  ]
}
```

- (POST) v1/spots/checkin - checkin spot

# Info : you can only checkin the spot uoi see nearby, otherwise spot ids are not visible.

Request
```
{"playerid":"57ab1dafbab09c24b9eefe12", "spotid":"57ab448dc6de518244114c61"}

```
Response
```

200 Ok


# How to create google new cluster

gcloud container clusters create boomer-cluster \
     --num-nodes 3 \
     --machine-type f1-micro\
     --scopes cloud-platform

# Port forwarding

## To test any container locally you can forward the ports with the following commands :

kubectl port-forward --pod=mongo-master 27017:27017
kubectl port-forward --pod=redis-master 6379:6379
