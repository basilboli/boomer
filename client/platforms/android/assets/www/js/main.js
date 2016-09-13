var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {
    $routeProvider.when( '/', {
        redirectTo: '/login'
    } ).when( '/login', {
        controller: "loginCtrl",
        templateUrl: 'templates/login/template.html',
        resolve: {
            geo: function( AppModel, LoginService ) {
                return LoginService.getGeolocation();
            }
        }
    } ).when( '/game-type-choice', {
        controller: "gameTypeChoiceCtrl",
        templateUrl: 'templates/game-type-choice/template.html'
    } ).when( '/game-around', {
        controller: "gameAroundCtrl",
        templateUrl: 'templates/game-around/template.html',
        resolve: {
            preload: function( AppModel, GameAroundService ) {
                return GameAroundService.getAroundGames();
            }
        }
    } ).when( '/single-game/:gameId', {
        controller: "singleGameCtrl",
        templateUrl: 'templates/single-game/template.html',
        resolve: {
            preload: function( AppModel, GameService ) {
                return GameService.start();
            }
        }
    } ).otherwise( {
        redirectTo: '/'
    } );
} );

app.config( [ '$httpProvider', function( $httpProvider ) {
    // $httpProvider.defaults.headers.common = {};
    // $httpProvider.defaults.headers.post = {};
    // $httpProvider.defaults.headers.put = {};
    // $httpProvider.defaults.headers.patch = {};

    $httpProvider.interceptors.push( 'AuthInterceptor' );
} ] );

app.controller( 'appCtrl', function( $scope, AppModel ) {

    $scope.model = AppModel;


} );

app.factory( 'AppModel', function() {

    return {

        user: {
            position: {}
        },

        users: [],

        game: {},

        loader: {
            show: false
        },

        aroundGames: [],

        heading: 0

    };

} );

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

        initSocket: function() {
            var deferred = $q.defer();

            this.socket = new WebSocket( "ws://api.boomer.im/events?access_token=" + AppModel.user.token );

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

app.controller( 'gameAroundCtrl', function( $scope, AppModel, $location, GameAroundService ) {

    $scope.model = AppModel;

    $scope.launchGame = function( game ) {
        $location.path( '/single-game/' + game.gameid );
    };

} );

app.factory( 'GameAroundService', function( $http, AppModel ) {

    return {

        getAroundGames: function() {
            AppModel.loader.show = true;

            return $http.get( 'http://api.boomer.im/game/around', {
                params: {
                    lat: AppModel.user.position.latitude,
                    lng: AppModel.user.position.longitude
                }
            } ).then( function( resp ) {
                AppModel.aroundGames = resp.data;
                AppModel.loader.show = false;
            }, function( err ) {
                console.log( err );
                AppModel.loader.show = false;
            } );
        }

    };

} );

app.controller( 'gameTypeChoiceCtrl', function( $scope, AppModel, $location, GameChoiceService ) {

    $scope.onChoiceSingle = function() {
        $location.path( '/game-around' );
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

    $scope.email = "";
    $scope.password = "";

    $scope.onConnect = function() {
        LoginService.login( $scope.email, $scope.password );
    }

} );

app.factory( 'AuthInterceptor', function( AppModel ) {

    return {
        request: function( config ) {
            config.headers = config.headers || {};

            if( AppModel.user.token ){
                config.headers.Authorization = "Bearer " + AppModel.user.token;
            }

            return config;
        }
    };

} );

app.factory( 'LoginService', function( $http, $q, $location, AppModel ) {

    return {

        login: function( email, password ) {
            return $http.post( 'http://api.boomer.im/login', null, {
                headers: {
                    "Authorization": "Basic " + btoa( email + ":" + password )
                }
            } ).then(
                function( resp ) {
                    this.setToken( resp.data.token );
                    $location.path( '/game-type-choice' );
                }.bind( this ),
                function( err ) {
                    console.log( err );
                }.bind( this )
            )
        },

        setToken: function( token ) {
            AppModel.user.token = token;
        },

        getGeolocation: function() {
            var deferred = $q.defer();

            navigator.geolocation.getCurrentPosition(
                function( position ) {
                    AppModel.user.position.latitude = position.coords.latitude;
                    AppModel.user.position.longitude = position.coords.longitude;
                    deferred.resolve();
                }.bind( this ),
                function( err ) {
                    console.log( err );
                    deferred.resolve();
                }.bind( this )
            );

            return deferred.promise;
        }

    };

} );

app.directive( 'map', function( UsersLayer, UserMarker, GamePolygon, SpotsLayer, AppModel ) {

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

            SpotsLayer.init( $scope.map, AppModel.game.spots );

            UsersLayer.init( $scope.map );

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
            this.createPolygon( AppModel.game.geometry.coordinates[ 0 ] );
        },

        createPolygon: function( coordinates ) {
            coordinates = coordinates.map( function( point ) {
                return [ point[ 1 ], point[ 0 ] ]; // inverse [ lat, lng ] => [ lng, lat ]
            } );
            this.polygon = L.polygon( coordinates, this.options ).addTo( this.map );
        }
    }

} );

app.directive( 'spotMarker', function( GameService, SpotsLayer, AppModel ) {

    return {
        restrict: 'E',
        link: function( $scope ) {

            $scope.marker = L.circleMarker( [
                $scope.spot.geometry.coordinates[ 1 ],
                $scope.spot.geometry.coordinates[ 0 ]
            ], {
                stroke: false,
                fillOpacity: 1,
                radius: 8,
                fillColor: $scope.spot.checked ? "green" : $scope.spot.nearby ? "blue" : "grey"
            } );

            $scope.marker.on( 'click', function( e ) {
                if ( $scope.spot.nearby && !$scope.spot.checked ) {
                    GameService.checkSpot( $scope.spot ).then( function() {
                        SpotsLayer.update( AppModel.game.spots );
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

        init: function( map, spots ) {
            this.map = map;
            this.layer = L.layerGroup().addTo( this.map );
            this.update( spots );
        },

        createMarker: function( spot ) {
            return L.circle( [ spot.location.coordinates[ 1 ], spot.location.coordinates[ 0 ] ], 25, this.options );
        },

        addUser: function( user ) {},

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

app.factory( 'UsersLayer', function( $http ) {

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

        createMarker: function( user ) {
            return L.circleMarker( [ user.coordinates[ 1 ], user.coordinates[ 0 ] ], this.options );
        },

        addUser: function( user ) {
            var marker = this.createMarker( user );
            marker.addTo( this.layer );
        },

        update: function( users ) {
            if ( this.map ) {
                this.layer.clearLayers();
                users.forEach( function( user ) {
                    this.addUser( user )
                }, this );
            }
        }
    }

} );

app.controller( 'singleGameCtrl', function( $scope, $routeParams, AppModel, SingleGameService, GameService ) {

    $scope.started = false;

    AppModel.game = AppModel.aroundGames.filter( function( game ) {
        return game.gameid === $routeParams.gameId;
    } )[ 0 ];

    $scope.startGame = function(  ){
        SingleGameService.startGame().then( function(  ){
            $scope.started = true;
        } );
    };

    $scope.stopGame = function(  ){
        SingleGameService.stopGame().then( function(  ){
            $scope.started = false;
        } );
        GameService.stopWatchGeolocation();
    };

    $scope.$on( "$destroy", function() {
        $scope.stopGame();
    } );

} );

app.factory( 'SingleGameService', function( $http, AppModel ) {

    return {

        startGame: function(  ){
            return $http.post( 'http://api.boomer.im/game/start', null, {
                params: {
                    id: AppModel.game.gameid
                }
            } )
        },

        stopGame: function(  ){
            return $http.post( 'http://api.boomer.im/game/stop', null, {
                params: {
                    id: AppModel.game.gameid
                }
            } )
        }

    };

} );
