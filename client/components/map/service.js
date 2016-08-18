app.factory( 'MapService', function( $http, AppModel, PlayersLayer, SpotsLayer ) {

    return {

        started: false,

        start: function( cb ) {
            $http.post( 'http://boomer.im:3000/player/locupdate', {
                name: "Damien",
                coordinates: [ AppModel.user.position.longitude, AppModel.user.position.latitude ]
            } ).then( function( resp ) {
                AppModel.user.playerid = resp.data.playerid;
                this.eventSource = new EventSource( "http://boomer.im:3000/events?playerid=" + resp.data.playerid );
                this.eventSource.addEventListener( "events", this.onMessage.bind( this ) );
                this.started = true;
            }.bind( this ), function( err ) {
                console.log( err );
            } );

            // this.socket = new WebSocket( "ws://104.155.123.156:3000/entry" );
            // this.socket.onopen = event => cb();
            // this.socket.onmessage = this.onMessage.bind( this );
        },

        getGame: function() {
            return $http.get( 'http://boomer.im:3000/game' ).then(
                function( resp ) {
                    AppModel.game.polygon.coordinates = resp.data.geometry.coordinates[ 0 ]
                },
                function( err ) {
                    console.log( err );
                }
            );
        },

        sendPosition: function() {
            if ( this.started ) {
                $http.post( 'http://boomer.im:3000/player/locupdate', {
                    name: "Damien",
                    coordinates: [ AppModel.user.position.longitude, AppModel.user.position.latitude ],
                    playerid: AppModel.user.playerid
                } )
            } else {
                this.start()
            }
            // this.socket.send( JSON.stringify( {
            //     "type": 0,
            //     "name": AppModel.user.id,
            //     "lat": AppModel.user.position.latitude + "",
            //     "lng": AppModel.user.position.longitude + ""
            // } ) );
        },

        onMessage: function( event ) {
            var data = JSON.parse( event.data );

            if ( data.players ) {
                AppModel.players = data.players;
                PlayersLayer.update( AppModel.players );
            }

            if ( data.spots ) {
                AppModel.spots = data.spots;
                SpotsLayer.update( AppModel.spots );
            }
        },

        checkSpot: function( spot ) {
            $http.post( 'http://boomer.im:3000/spot/checkin', {
                "playerid": AppModel.user.playerid,
                "spotid": spot.spotid
            } ).then(
                function( resp ) {
                    alert( 'Spot checked' )
                },
                function( err ) {
                    console.log( err )
                }
            );
        }

    };

} );
