document.body.innerHTML = "window.location.href";

var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {

    // $httpProvider.defaults.headers.common = {};
    // $httpProvider.defaults.headers.post = {};

    $routeProvider.when( '/', {
        redirectTo: '/login'
    } ).when( '/login', {
        template: '<login></login>'
    } ).when( '/map', {
        template: '<map></map>'
    } ).otherwise( {
        redirectTo: '/'
    } );

    // $locationProvider.html5Mode( {
    //     enabled: true,
    //     requireBase: false
    // } );

} );

app.config( [ '$httpProvider', function( $httpProvider ) {
    //Reset headers to avoid OPTIONS request (aka preflight)
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
} ] );

app.factory( 'AppModel', function() {

    return {

        user: {
            position: {}
        },

        players: [],

        game: {
            polygon: []
        }

    };

} );

app.controller( 'loginCtrl', function( $scope, AppModel, $location, LoginService ) {

    $scope.onConnect = function() {
        $location.path( '/map' );
    }

} );

app.directive( 'login', function() {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/login/template.html'
    }

} );

app.factory( 'LoginService', function( $http, AppModel ) {

    return {

    };

} );

app.controller( 'mapCtrl', function( $scope, $interval, AppModel, MapService, UserMarker ) {

    $scope.model = AppModel;

    $scope.updateUserGeolocation = function() {
        navigator.geolocation.getCurrentPosition(
            $scope.onGetUserLocation.bind( this ),
            $scope.onGeolocationError.bind( this ), {
                enableHighAccuracy: true,
                timeout: 4000
            }
        );
    };

    $scope.onGetUserLocation = function( result ) {
        $scope.model.user.position.latitude = result.coords.latitude;
        $scope.model.user.position.longitude = result.coords.longitude;
        // $scope.model.user.position.latitude = 48.8781;
        // $scope.model.user.position.longitude = 2.3291;

        UserMarker.update( $scope.model.user );

        $scope.map.setView( [ $scope.model.user.position.latitude, $scope.model.user.position.longitude ] );

        MapService.sendPosition();
    };

    $scope.onGeolocationError = function( err ) {
        console.log( err );
    };

    $scope.updateUserGeolocation();
    $interval( $scope.updateUserGeolocation, 5000 );

} );

app.directive( 'map', function( $compile, PlayersLayer, UserMarker, MapService, GamePolygon, SpotsLayer ) {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/map/template.html',
        link: function( $scope, elements ) {

            L.mapbox.accessToken = 'pk.eyJ1IjoiZGFtbW1pZW4iLCJhIjoiY2lqeDRsc3NzMDAxd3Zua3AxNGg3N2g3MyJ9.VB6ZqQCOi9LMnR2ojeOHxw';

            $scope.map = L.mapbox.map( elements[ 0 ], 'mapbox.light' ).setView( [ 50, 30 ], 13 );

            SpotsLayer.init( $scope.map );

            PlayersLayer.init( $scope.map );

            UserMarker.init( $scope.map );

            MapService.getGame().then( function() {
                GamePolygon.init( $scope.map )
            } );
        }
    };

} );

app.factory( 'GamePolygon', function( $http, AppModel ) {

    return {
        map: null,
        polygon: null,
        options: {
            stroke: false,
            fillOpacity: 0.25,
            fillColor: "#00AEEF"
        },

        init: function( map ) {
            this.map = map;
            this.createPolygon( AppModel.game.polygon.coordinates );
        },

        createPolygon: function( coordinates ) {
            coordinates.pop();
            coordinates = coordinates.map( function( point ) {
                point.push( point.shift() );
                return point;
            } );
            this.polygon = L.polygon( coordinates, this.options ).addTo( this.map );
        }
    }

} );

app.factory( 'PlayersLayer', function( $http ) {

    return {
        map: null,
        layer: null,
        options: {
            stroke: false,
            fillOpacity: 1,
            fillColor: "#CC0000"
        },

        init: function( map ) {
            this.map = map;
            this.layer = L.layerGroup().addTo( this.map );
        },

        createMarker: function( player ) {
            return L.circle( [ player.coordinates[ 1 ], player.coordinates[ 0 ] ], 25, this.options );
        },

        addPlayer: function( player ) {
            var marker = this.createMarker( player );
            marker.addTo( this.layer );
        },

        update: function( players ) {
            if ( this.map ) {
                this.layer.clearLayers();
                players.forEach( function( player ) {
                    this.addPlayer( player )
                }, this );
            }
        }
    }

} );

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

app.directive( 'spotMarker', function( MapService ) {

    return {
        restrict: 'E',
        link: function( $scope ) {
            $scope.marker = L.circle( [
                $scope.spot.location.coordinates[ 1 ],
                $scope.spot.location.coordinates[ 0 ]
            ], 25, {
                stroke: false,
                fillOpacity: 1,
                fillColor: $scope.spot.checked ? "green" : $scope.spot.nearby ? "blue" : "grey"
            } );

            $scope.marker.on( 'click', function( e ) {
                if( $scope.spot.nearby && !$scope.spot.checked ) MapService.checkSpot( $scope.spot );
            } );

            $scope.marker.addTo( $scope.layer );
        }
    };

} );

app.factory( 'SpotsLayer', function( $http, $compile ) {

    return {
        map: null,
        layer: null,
        options: {
            stroke: false,
            fillOpacity: 1,
            fillColor: "#000000"
        },

        init: function( map ) {
            this.map = map;
            this.layer = L.layerGroup().addTo( this.map );
        },

        createMarker: function( spot ) {
            return L.circle( [ spot.location.coordinates[ 1 ], spot.location.coordinates[ 0 ] ], 25, this.options );
        },

        addPlayer: function( player ) {},

        addSpot: function( spot ) {
            $compile( '<spot-marker></spot-marker>' )( {
                layer: this.layer,
                spot: spot
            } );
        },

        update: function( spots ) {
            if ( this.map ) {
                this.layer.clearLayers();
                spots.forEach( function( spot ) {
                    this.addSpot( spot );
                }, this );
            }
        }
    }

} );

app.factory( 'UserMarker', function( $http, AppModel ) {

    return {
        map: null,
        marker: null,
        options: {
            stroke: true,
            fillOpacity: 0.4,
            weight: 2,
            color: "#00AEEF",
            fillColor: "#00AEEF"
        },

        init: function( map ) {
            this.map = map;
        },

        setPosition: function( position ) {
            this.marker.setLatLng(
                L.latLng(
                    position.latitude,
                    position.longitude
                )
            );
        },

        createMarker: function( position ) {
            console.log( [ position.latitude, position.longitude ] );
            this.marker = L.circle( [ position.latitude, position.longitude ], 50, this.options ).addTo( this.map );
        },

        update: function( user ) {
            if ( this.map ) {
                if ( this.marker ) this.setPosition( user.position );
                else this.createMarker( user.position );
            }
        }
    }

} );
