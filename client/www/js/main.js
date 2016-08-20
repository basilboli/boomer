var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {
    $routeProvider.when( '/', {
        redirectTo: '/login'
    } ).when( '/login', {
        controller: "loginCtrl",
        templateUrl: 'templates/login/template.html'
    } ).when( '/map', {
        template: '<map></map>',
        resolve: {
            preload: function( AppModel, $q ) {
                var deferred = $q.defer();

                AppModel.loader.show = true;

                navigator.geolocation.getCurrentPosition(
                    function( result ) {
                        AppModel.user.position.latitude = result.coords.latitude;
                        AppModel.user.position.longitude = result.coords.longitude;
                        deferred.resolve();
                    },
                    function( err ) {
                        console.log( err );
                    }
                );

                return deferred.promise;
            }
        }
    } ).otherwise( {
        redirectTo: '/'
    } );
} );

app.config( [ '$httpProvider', function( $httpProvider ) {
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
} ] );

app.controller( 'appCtrl', function( $scope, AppModel ) {

    $scope.model = AppModel;


} );

app.factory( 'AppModel', function() {

    return {

        user: {
            position: {}
        },

        players: [],

        game: {
            polygon: []
        },

        loader: {
            show: false
        },

        heading: 0

    };

} );

app.directive( 'loader', function() {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/loader/template.html'
    }

} );

app.controller( 'loginCtrl', function( $scope, AppModel, $location, LoginService ) {

    $scope.onConnect = function() {
        $location.path( '/map' );
    }

} );

app.directive( 'login', function() {

    return {
        replace: true,
        templateUrl: 'templates/login/template.html'
    }

} );

app.factory( 'LoginService', function( $http, AppModel ) {

    return {

    };

} );

app.controller( 'mapCtrl', function( $scope, $timeout, AppModel, MapService, UserMarker ) {

    $scope.model = AppModel;

    $scope.updateUserGeolocation = function() {
        navigator.geolocation.getCurrentPosition(
            $scope.onGetUserLocation.bind( this ),
            $scope.onGeolocationError.bind( this ), {
                enableHighAccuracy: true,
                timeout: 5000
            }
        );
    };

    $scope.onGetUserLocation = function( result ) {
        $scope.model.user.position.latitude = result.coords.latitude;
        $scope.model.user.position.longitude = result.coords.longitude;
        // $scope.model.user.position.latitude = 48.8781;
        // $scope.model.user.position.longitude = 2.3291;

        UserMarker.update( $scope.model.user );

        //$scope.map.setView( [ $scope.model.user.position.latitude, $scope.model.user.position.longitude ] );

        MapService.sendPosition();

        $timeout( $scope.updateUserGeolocation, 3000 );
    };

    $scope.onGeolocationError = function( err ) {
        console.log( err );
        $timeout( $scope.updateUserGeolocation, 3000 );
    };

    $scope.updateUserGeolocation();

} );

app.directive( 'map', function( PlayersLayer, UserMarker, MapService, GamePolygon, SpotsLayer, AppModel ) {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/map/template.html',
        link: function( $scope, elements ) {

            L.mapbox.accessToken = 'pk.eyJ1IjoiZGFtbW1pZW4iLCJhIjoiY2lqeDRsc3NzMDAxd3Zua3AxNGg3N2g3MyJ9.VB6ZqQCOi9LMnR2ojeOHxw';

            $scope.map = L.mapbox.map( elements[ 0 ], 'mapbox.light', {
                zoomControl: false,
                attributionControl: false,
                reuseTiles: true,
                fadeAnimation: false,
                //zoomAnimation: false,
                minZoom: 10,
                maxZoom: 18
            } ).setView( [ AppModel.user.position.latitude, AppModel.user.position.longitude ], 13 );

            // $scope.map.on( 'zoomend', function( e ) {
            //     console.log( $scope.map.getZoom() );
            // } );

            SpotsLayer.init( $scope.map );

            PlayersLayer.init( $scope.map );

            UserMarker.init( $scope.map );

            MapService.getGame().then( function() {
                GamePolygon.init( $scope.map );
                AppModel.loader.show = false;
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
            fillOpacity: 0.2,
            fillColor: "#000000"
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
            fillColor: "#CC0000",
            radius: 8
        },

        init: function( map ) {
            this.map = map;
            this.layer = L.layerGroup().addTo( this.map );
        },

        createMarker: function( player ) {
            return L.circleMarker( [ player.coordinates[ 1 ], player.coordinates[ 0 ] ], this.options );
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

app.directive( 'spotMarker', function( MapService ) {

    return {
        restrict: 'E',
        link: function( $scope ) {
            $scope.marker = L.circleMarker( [
                $scope.spot.location.coordinates[ 1 ],
                $scope.spot.location.coordinates[ 0 ]
            ], {
                stroke: false,
                fillOpacity: 1,
                radius: 8,
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
        areaOptions: {
            stroke: false,
            fillOpacity: 0.3,
            color: "#00AEEF",
            fillColor: "#00AEEF"
        },
        markerOptions: {
            stroke: false,
            fillOpacity: 1,
            radius: 8,
            fillColor: "#00AEEF"
        },

        init: function( map ) {
            this.map = map;
            this.headingIcon = L.icon( {
                iconUrl: 'libs/images/compass.svg',
                iconSize: [ 48, 48 ],
                iconAnchor: [ 24, 24 ],
            } );
        },

        setPosition: function( position ) {
            this.area.setLatLng(
                L.latLng(
                    position.latitude,
                    position.longitude
                )
            );

            this.marker.setLatLng(
                L.latLng(
                    position.latitude,
                    position.longitude
                )
            );
        },

        setHeading: function( angle ) {
            this.marker.setRotationAngle( angle );
        },

        createMarker: function( position ) {
            this.area = L.circle( [ position.latitude, position.longitude ], 50, this.areaOptions ).addTo( this.map );
            // this.marker = L.circleMarker( [ position.latitude, position.longitude ], this.markerOptions ).addTo( this.map );
            this.marker = L.marker( [ position.latitude, position.longitude ], {
                icon: this.headingIcon,
                rotationAngle: 0,
                rotationOrigin: "center center"
            } ).addTo( this.map );

            this.watchCompass();
        },

        watchCompass(){
            if ( navigator.compass ) {
                navigator.compass.watchHeading( function( heading ) {
                    this.setHeading( heading.magneticHeading );
                }.bind( this ), function( err ) {
                    console.log( err );
                }, {
                    frequency: 50
                } );
            }
        },

        update: function( user ) {
            if ( this.map ) {
                if ( this.area && this.marker ) this.setPosition( user.position );
                else this.createMarker( user.position );
            }
        }
    }

} );
