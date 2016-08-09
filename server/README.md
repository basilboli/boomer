
# Dictionary

- Game

- Player

User of the game.

- Spot

- Active game

Currently active game. During alpha we have one active game at a time.


# API

Note : every endpoint is labeled as server sent events (SSE) or classic REST API (POST|GET).

- TODO (POST) v1/game/new - generates new active game with n spots around the given coordinate

- (GET) v1/game/active  - get active game with n spots and area

```
{
    "id" : "57a9ca4cc6de518244114c5a",
    "active" : true,
    "neighborhood" : {
        "type" : "FeatureCollection",
        "features" : [
            {
                "type" : "Feature",
                "properties" : {},
                "geometry" : {
                    "type" : "Polygon",
                    "coordinates" : [
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
        ]
    },
    "spots": [
      {
        "id": "57a9caf0c6de518244114c5b",
        "type": "Feature",
        "gameid": "57a9ca4cc6de518244114c5a",
        "properties": {},
        "geometry": {
          "type": "Point",
          "coordinates": [
            2.32926249504089,
            48.878038206549
          ]
        }
      },
      {
        "id": "57a9caf0c6de518244114c5b",
        "type": "Feature",
        "gameid": "57a9ca4cc6de518244114c5a",
        "checked": "false",
        "properties": {},
        "geometry": {
          "type": "Point",
          "coordinates": [
            2.32926249504089,
            48.878038206549
          ]
        }
      }
    ]
}
```

- (POST) v1/player/new - generates new player

Request
```

{"name" : "bob"}

```

Response
```

{"id" : "123", "name" : "bob"}

```


- (POST) v1/game/:id/join - player joins the game :id

Example : user 123 joins game :id

Request
```

{"id" : "123"}

```

Response
```

200 Ok

```


- (SSE)  v1/game/active/players - connected players and their coordinates
```
{
  "players": [
    {
      "id": "57a9ca4cc6de51824411fdfd",
      "coordinates": [
        2.32926249504089,
        48.878038206549
      ]
    },
    {
      "id": "57a9ca4cc6de518sdfdsfs",
      "coordinates": [
        2.32926249505089,
        48.878038206549
      ]
    }
  ]
}
```
- (SSE)  v1/game/active/spots  - all, checked and nearby spots

```
{
  "spots": [
    {
      "id": "57a9caf0c6de518244114c5b",
      "type": "Feature",
      "gameid": "57a9ca4cc6de518244114c5a",
      "properties": {},
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.32926249504089,
          48.878038206549
        ]
      }
    },
    {
      "id": "57a9caf0c6de518244114c5b",
      "type": "Feature",
      "gameid": "57a9ca4cc6de518244114c5a",
      "checked": "false",
      "properties": {},
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.32926249504089,
          48.878038206549
        ]
      }
    }
  ],
  "checked_spots": [
    {
      "id": "57a9caf0c6de518244114c5b",
      "type": "Feature",
      "gameid": "57a9ca4cc6de518244114c5a",
      "properties": {},
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.32926249504089,
          48.878038206549
        ]
      }
    }
  ],
  "nearby_spots": [{
      "id": "57a9caf0c6de518244114c5b",
      "type": "Feature",
      "gameid": "57a9ca4cc6de518244114c5a",
      "properties": {},
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.32926249504089,
          48.878038206549
        ]
      }
    }
  ]
}
```
- (POST) v1/game/active/spots/checkin/:id      - checkin spot

Example : user 123 checks in spot :id

Request
```

{"id" : "123"}

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
