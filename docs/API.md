# API

# api.boomer.im

Note : every endpoint (excluding /signup and /login) is secured with json webtoken provided in the Authorization header using the Bearer schema. The content of the header should look like the following:

Authorization: Bearer <token>

Note : websockets are secured adding query param access_token to the websocket url
/events?access_token=<token>

## /signup 

###new user signup (POST)

Request

```
{"name": "vasyl","email":"basilboli@gmail.com", "password":"nopass",  "coordinates": [2.34899551805, 48.8700006172}

```

Response

```
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJhc2lsYm9saUBnbWFpbC5jb20iLCJleHAiOjE0NzM2Nzc5MTYsImlhdCI6MTQ3MzQxODcxNiwiaXNzIjoiYXV0aC5zZXJ2aWNlIiwic3ViIjoiNTdkMjk1ZGM3M2UyYTE5OWE1YzBkNTlkIn0.tTgIeFzbw0yUNdxVhSWxHySHtJvSBWME4pROjU5pFXk"}

```


##/login  

###authentication (POST)

Using Basic access authentication 
(https://en.wikipedia.org/wiki/Basic_access_authentication). Generates JWT tokens for authenticated users.

Request 
```
http http://127.0.0.1:3000/login --auth basilboli@gmail.com:nopass
```

Response

```
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJhc2lsYm9saUBnbWFpbC5jb20iLCJleHAiOjE0NzM2Nzc5MTYsImlhdCI6MTQ3MzQxODcxNiwiaXNzIjoiYXV0aC5zZXJ2aWNlIiwic3ViIjoiNTdkMjk1ZGM3M2UyYTE5OWE1YzBkNTlkIn0.tTgIeFzbw0yUNdxVhSWxHySHtJvSBWME4pROjU5pFXk"}
```

##/user/info

### get info about the user

Note : has_ongoing_game 

Response
```
{"userid":"57d295dc73e2a199a5c0d59d","name":"vasyl","email":"basilboli@gmail.com","coordinates":[2.34899551805,48.8700006172],"created":0,"has_ongoing_game":false}
```

##/game/start

### start the game (POST)


Request

```
{"gameid":"57ab1dafbab09c24b9eefe12"}

```

Response

```
200 Ok

```

##/game/stop

### stop the game (POST)


Request

```
{"gameid":"57ab1dafbab09c24b9eefe12"}

```

Response

```
200 Ok

```

##/game/activities

### show all user activities for the game  (GET)


Response

```
[{"activityid":"57d29749c6de518244115c8d","gameid":"57d294f373e2a19224753c52","userid":"57d295dc73e2a199a5c0d59d","started":1473419081,"ended":1473419230,"status":1}]

```

##/game/around

### show games around user (GET)


Response

```
[{"activityid":"57d29749c6de518244115c8d","gameid":"57d294f373e2a19224753c52","userid":"57d295dc73e2a199a5c0d59d","started":1473419081,"ended":1473419230,"status":1}]

```


##/events?access_token=<token>  
###streaming  events (Web Sockets)

access_token is jwt token.


Request (ws) : user pushes his coordinates 

```
{"event_type":"user_loc_update", "coordinates": [lng,lat]}

```

Response: in response we get different events like :


### game_update


```
{
"event_type":"game_update",
  "users": [
    {
      "userid": "57ab00ddbab09c194aaa9b74",
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


### game_over


```
{
"event_type":"game_over",
"created": 1473419139,
"ended": 1473419155,
"score": 16
}
```
