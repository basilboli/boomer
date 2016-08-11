var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {

    $routeProvider.when( '/', {
        redirectTo: '/login'
    } ).when( '/login', {
        template: '<login></login>'
    } ).when( '/map', {
        template: '<map></map>'
    } ).otherwise( {
        redirectTo: '/'
    } );

    $locationProvider.html5Mode( {
        enabled: true,
        requireBase: false
    } );

} );

app.factory( 'AppModel', function() {

    return {

        user: {
            id: Math.random() + "",
            position: {}
        },

        players: []

    };

} );

app.controller( 'loginCtrl', function( $scope, AppModel, $location, LoginService ) {

    $scope.onConnect = () => {
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

    $scope.updateUserGeolocation = function(  ){
        navigator.geolocation.getCurrentPosition(
            $scope.onGetUserLocation.bind( this ),
            err => console.log( err )
        );
    };

    $scope.onGetUserLocation = ( result ) => {
        $scope.model.user.position.latitude = result.coords.latitude + ( Math.random() - 0.5 ) / 100;
        $scope.model.user.position.longitude = result.coords.longitude + ( Math.random() - 0.5 ) / 100;

        UserMarker.update( $scope.model.user );

        $scope.map.setView( [ $scope.model.user.position.latitude, $scope.model.user.position.longitude ] );

        MapService.sendPosition();
    };

    MapService.start( () => {
        $scope.updateUserGeolocation();
        $interval( $scope.updateUserGeolocation, 5000 );
    } );

} );

app.directive( 'map', function ( $compile, PlayersLayer, UserMarker ) {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/map/template.html',
        link: ( $scope, elements ) => {

            L.mapbox.accessToken = 'pk.eyJ1IjoiZGFtbW1pZW4iLCJhIjoiY2lqeDRsc3NzMDAxd3Zua3AxNGg3N2g3MyJ9.VB6ZqQCOi9LMnR2ojeOHxw';

            $scope.map = L.mapbox.map( elements[ 0 ], 'mapbox.light').setView( [ 50, 30 ], 13 );

            PlayersLayer.init( $scope.map );

            UserMarker.init( $scope.map );
        }
    };

} );

app.factory( 'PlayersLayer', function( $http, AppModel ) {

    return {
        map: null,
        layer: null,
        model: AppModel,
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
            return L.circle( [ parseFloat( player.lat ), parseFloat( player.lng ) ], 25, this.options );
        },

        addPlayer: function( player ) {
            var marker = this.createMarker( player );
            marker.addTo( this.layer );
        },

        update: function( players ) {
            if ( this.map ) {
                this.layer.clearLayers();
                players.forEach( player => this.addPlayer( player ) );
            }
        }
    }

} );

app.factory( 'MapService', function( $http, AppModel, PlayersLayer ) {

    return {

        start: function( cb ) {
            this.socket = new WebSocket( "ws://104.155.123.156:3000/entry" );

            this.socket.onopen = event => cb();

            this.socket.onmessage = this.onMessage.bind( this );
        },

        sendPosition: function() {
            this.socket.send( JSON.stringify( {
                "type": 0,
                "name": AppModel.user.id,
                "lat": AppModel.user.position.latitude + "",
                "lng": AppModel.user.position.longitude + ""
            } ) );
        },

        onMessage: function( event ){
            var data = JSON.parse( event.data );

            AppModel.players = data.players.filter( player => player.name !== AppModel.user.id );

            PlayersLayer.update( AppModel.players );
        }

    };

} );

app.factory( 'UserMarker', function( $http, AppModel ) {

    return {
        map: null,
        marker: null,
        options: {
            stroke: false,
            fillOpacity: 1,
            fillColor: "#00AEEF"
        },

        init: function( map ) {
            this.map = map;
        },

        setPosition: function( user ) {
            this.marker.setLatLng(
                L.latLng(
                    user.position.latitude,
                    user.position.longitude
                )
            );
        },

        createMarker: function( position ) {
            this.marker = L.circle( [ position.latitude, position.longitude ], 25, this.options ).addTo( this.map );
        },

        update: function( user ) {
            if ( this.map ) {
                if ( this.marker ) this.setPosition( user.position );
                else this.createMarker( user );
            }
        }
    }

} );
