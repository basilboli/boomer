var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {
    $routeProvider.when( '/', {
        redirectTo: '/login'
    } ).when( '/login', {
        controller: "loginCtrl",
        templateUrl: 'templates/login/template.html'
    } ).when( '/game-type-choice', {
        controller: "gameTypeChoiceCtrl",
        templateUrl: 'templates/game-type-choice/template.html'
    } ).when( '/single-game', {
        controller: "singleGameCtrl",
        templateUrl: 'templates/single-game/template.html',
        resolve: {
            preload: function( AppModel, $q, GameService ) {
                AppModel.loader.show = true;

                var deferred = $q.defer();

                GameService.start( deferred );

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

app.factory( 'GameService', function( $http, $q, $timeout, AppModel, UserMarker, PlayersLayer, SpotsLayer ) {

    return {

        start: function( deferred ) {
            navigator.geolocation.getCurrentPosition(
                function( position ) {
                    AppModel.user.position.latitude = position.coords.latitude;
                    AppModel.user.position.longitude = position.coords.longitude;

                    this.createPlayer().then(
                        function( resp ) {
                            AppModel.user.playerid = resp.data.playerid;
                            return this.getGame();
                        }.bind( this ),
                        function( err ) {
                            return $q.reject();
                        }.bind( this )
                    ).then(
                        function() {
                            return this.initSocket();
                        }.bind( this ),
                        function( err ) {
                            return $q.reject();
                        }
                    ).then(
                        function() {
                            this.watchLocation();
                            deferred.resolve();
                            AppModel.loader.show = false;
                        }.bind( this ),
                        function( err ) {
                            return $q.reject();
                        }
                    );

                }.bind( this ),
                function( err ) {
                    console.log( err );
                }.bind( this )
            );
        },

        createPlayer: function() {
            return $http.post( 'http://api.boomer.im/player/locupdate', {
                name: "Damien",
                coordinates: [ AppModel.user.position.longitude, AppModel.user.position.latitude ]
            } );
        },

        initSocket: function() {
            var deferred = $q.defer();

            this.socket = new WebSocket( "ws://api.boomer.im/events?access_token=" + AppModel.user.playerid );

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
            // AppModel.user.position.latitude = 48.8781;
            // AppModel.user.position.longitude = 2.3291;

            UserMarker.update( AppModel.user );

            // AppModel.map.setView( [ AppModel.user.position.latitude, AppModel.user.position.longitude ] );

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

            return $http.post( 'http://api.boomer.im/spot/checkin', {
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

app.directive( 'followMe', function() {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/follow-me/template.html',
        controller: function( $scope, AppModel ) {

            $scope.model = AppModel;

            $scope.onCenterMap = function() {
                if ( $scope.model.map ) {
                    $scope.model.map.setView( [ $scope.model.user.position.latitude, $scope.model.user.position.longitude ] );
                }
            };

        }
    }

} );

app.controller( 'gameTypeChoiceCtrl', function( $scope, AppModel, $location, GameChoiceService ) {

    $scope.onChoiceSingle = function() {
        $location.path( '/single-game' );
    }

} );

app.factory( 'GameChoiceService', function( $http, AppModel ) {

    return {

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
        $location.path( '/game-type-choice' );
    }

} );

app.factory( 'LoginService', function( $http, AppModel ) {

    return {

    };

} );

app.directive( 'map', function( PlayersLayer, UserMarker, GamePolygon, SpotsLayer, AppModel ) {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/map/template.html',
        link: function( $scope, elements ) {

            $scope.model = AppModel;

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

            AppModel.map = $scope.map;

            // $scope.map.on( 'zoomend', function( e ) {
            //     console.log( $scope.map.getZoom() );
            // } );

            SpotsLayer.init( $scope.map );

            PlayersLayer.init( $scope.map );

            UserMarker.init( $scope.map );

            GamePolygon.init( $scope.map );

            UserMarker.update( AppModel.user );
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

app.directive( 'spotMarker', function( GameService, SpotsLayer, AppModel ) {

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
                if ( $scope.spot.nearby && !$scope.spot.checked ) {
                    GameService.checkSpot( $scope.spot ).then( function() {
                        SpotsLayer.update( AppModel.spots );
                    } );
                }
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
        headingIcon: L.icon( {
            iconUrl: 'libs/images/compass.svg',
            iconSize: [ 48, 48 ],
            iconAnchor: [ 24, 24 ],
        } ),

        init: function( map ) {
            this.map = map;
            this.marker = null;
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

        watchCompass() {
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

app.controller( 'singleGameCtrl', function( $scope, AppModel, GameService ) {

    $scope.$on( "$destroy", function() {
        GameService.stopWatchGeolocation();
    } );

} );

app.factory( 'SingleGameService', function( $http, AppModel ) {

    return {

    };

} );
