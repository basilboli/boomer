app.factory( 'Game', function( $http, $q, $timeout, AppModel, UserMarker, PlayersLayer, SpotsLayer ) {

    return {

        start: function() {
            return $q.all( [
                this.locupdate(),
                this.getGame()
            ] );
        },

        locupdate: function() {
            return $http.post( 'http://api.boomer.im/player/locupdate', {
                name: "Damien",
                coordinates: [ AppModel.user.position.longitude, AppModel.user.position.latitude ]
            } ).then( function( resp ) {
                AppModel.user.playerid = resp.data.playerid;
                this.initSocket();
            }.bind( this ), function( err ) {
                console.log( err );
            } );
        },

        initSocket: function() {
            this.socket = new WebSocket( "ws://api.boomer.im/events?access_token=" + AppModel.user.playerid );

            this.socket.onopen = function( event ) {
                this.watchLocation();
            }.bind( this )

            this.socket.onmessage = this.onMessage.bind( this );

            this.socket.onerreor = function( err ) {
                console.log( err );
            }.bind( this )
        },

        watchLocation: function() {

            this.geolocationWatcher = navigator.geolocation.watchPosition(
                this.onGetUserLocation.bind( this ),
                this.onGeolocationError.bind( this ), {
                    enableHighAccuracy: true,
                    timeout: 5000
                }
            );

            // navigator.geolocation.getCurrentPosition(
            //     this.onGetUserLocation.bind( this ),
            //     this.onGeolocationError.bind( this ), {
            //         enableHighAccuracy: true,
            //         timeout: 5000
            //     }
            // );
        },

        onGeolocationError: function( err ) {
            console.log( err );
            // $timeout( this.watchLocation.bind( this ), 3000 );
        },

        onGetUserLocation: function( result ) {
            AppModel.user.position.latitude = result.coords.latitude;
            AppModel.user.position.longitude = result.coords.longitude;
            // AppModel.user.position.latitude = 48.8781;
            // AppModel.user.position.longitude = 2.3291;

            UserMarker.update( AppModel.user );

            //$scope.map.setView( [ AppModel.user.position.latitude, AppModel.user.position.longitude ] );

            this.sendPosition();

            // $timeout( this.watchLocation.bind( this ), 3000 );
        },

        getGame: function() {
            return $http.get( 'http://api.boomer.im/game' ).then(
                function( resp ) {
                    AppModel.game.polygon.coordinates = resp.data.geometry.coordinates[ 0 ]
                },
                function( err ) {
                    console.log( err );
                }
            );
        },

        sendPosition: function() {
            this.socket.send( JSON.stringify( {
                name: "Damien",
                coordinates: [ AppModel.user.position.longitude, AppModel.user.position.latitude ],
                playerid: AppModel.user.playerid
            } ) );
        },

        onMessage: function( event ) {
            var data = JSON.parse( event.data );

            console.log( data );

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
            AppModel.loader.show = true;
            $http.post( 'http://boomer.im:3000/spot/checkin', {
                "playerid": AppModel.user.playerid,
                "spotid": spot.spotid
            } ).then(
                function( resp ) {
                    AppModel.loader.show = false;
                },
                function( err ) {
                    console.log( err );
                    AppModel.loader.show = false;
                }
            );
        }

    };

} );
