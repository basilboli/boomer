app.factory( 'GameService', function( $http, $q, $timeout, $rootScope, AppModel, UserMarker, UsersLayer, SpotsLayer ) {

    return {

        start: function() {
            AppModel.loader.show = true;

            return this.initSocket().then(
                function() {
                    this.watchLocation();
                    AppModel.loader.show = false;
                }.bind( this ),
                function( err ) {
                    AppModel.loader.show = false;
                }
            );
        },

        stop: function() {
            this.closeSocket();
            this.stopWatchGeolocation();
        },

        closeSocket: function() {
            console.log( "try closing" );
            console.log( this.socket.readyState );
            this.socket.close();
            setTimeout( () => console.log( this.socket.readyState ), 3000 );
        },

        initSocket: function() {
            var deferred = $q.defer();

            this.socket = new WebSocket( "wss://api.boomer.im/events?access_token=" + AppModel.user.token );

            this.socket.onopen = function( event ) {
                console.log( 'WebSocket opened' );
                deferred.resolve();
            }.bind( this );

            this.socket.onmessage = this.onMessage.bind( this );

            this.socket.onerreor = function( err ) {
                console.log( err );
            }.bind( this )

            this.socket.onclose = function( closeEvent ) {
                console.log( closeEvent );
                if ( closeEvent.code === 1000 ) {
                    console.log( 'WebSocket well closed.' );
                } else {
                    console.log( 'WebSocket problem. Restarting ...' );
                    this.initSocket();
                }
            }.bind( this );

            return deferred.promise;
        },

        stopWatchGeolocation: function() {
            navigator.geolocation.clearWatch( this.geolocationWatcher );
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
            // AppModel.user.position.latitude = 48.8987353;
            // AppModel.user.position.longitude = 2.3787964;

            UserMarker.update( AppModel.user );

            // AppModel.map.setView( [ AppModel.user.position.latitude, AppModel.user.position.longitude ] );

            this.sendPosition();

            // $timeout( this.watchLocation.bind( this ), 3000 );
        },

        sendPosition: function() {
            this.socket.send( JSON.stringify( {
                event_type: "user_loc_update",
                coordinates: [ AppModel.user.position.longitude, AppModel.user.position.latitude ]
            } ) );
        },

        onMessage: function( event ) {
            var data = JSON.parse( event.data );

            console.log( data );

            if ( data.event_type === "game_update" ) {

                $rootScope.$apply( function() {
                    AppModel.game.checkins_total = data.checkins_total;
                    AppModel.game.spots = data.spots;
                    AppModel.game.spots_total = data.spots_total;
                    AppModel.game.time = data.time;
                } );

                if ( data.users ) {
                    AppModel.users = data.users;
                    UsersLayer.update( AppModel.users );
                }

                if ( data.spots ) {
                    AppModel.game.spots = data.spots;
                    SpotsLayer.update( AppModel.game.spots );
                }
            } else if ( data.event_type === "game_over" ) {
                alert( 'End of the game. Score: ' + data.score )
            }
        },

        checkSpot: function( spot ) {
            AppModel.loader.show = true;

            return $http.post( 'https://api.boomer.im/spot/checkin', {
                "playerid": AppModel.user.playerid,
                "spotid": spot.spotid
            } ).then(
                function( resp ) {
                    AppModel.loader.show = false;
                    spot.checked = true;
                },
                function( err ) {
                    console.log( err );
                    AppModel.loader.show = false;
                }
            );
        }

    };

} );
