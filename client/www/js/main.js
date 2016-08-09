var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {

    $routeProvider.when( '/', {
        templateUrl: 'templates/login.html'
    } ).when( '/map', {
        templateUrl: 'templates/map.html'
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
            position: null
        },

        players: []

    };

} );

app.controller( 'mapCtrl', function( $scope, $timeout, AppModel, MapService ) {

    $scope.model = AppModel;

    $scope.updateUserGeolocation = function(  ){
        navigator.geolocation.getCurrentPosition( ( result ) => {

            $scope.model.user.position = {
                latitude: result.coords.latitude + ( Math.random() - 0.5 ) / 100,
                longitude: result.coords.longitude + ( Math.random() - 0.5 ) / 100
            };

            $scope.map.setView( [ $scope.model.user.position.latitude, $scope.model.user.position.longitude ], 13 );

            $scope.userMarker.setLatLng( L.latLng( $scope.model.user.position.latitude, $scope.model.user.position.longitude ) );

            MapService.sendPosition();

            $timeout( $scope.updateUserGeolocation.bind( this ), 5000 );
        }, ( err ) => {
            $timeout( $scope.updateUserGeolocation.bind( this ), 5000 );
        } );
    };

    MapService.start( () => {
        $scope.updateUserGeolocation();
    } );

} );

app.directive( 'map', function() {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/map/template.html',
        link: ( $scope, elements ) => {

            let container = elements[ 0 ];

            L.mapbox.accessToken = 'pk.eyJ1IjoiZGFtbW1pZW4iLCJhIjoiY2lqeDRsc3NzMDAxd3Zua3AxNGg3N2g3MyJ9.VB6ZqQCOi9LMnR2ojeOHxw';

            $scope.map = L.mapbox.map( container, 'mapbox.light');

            $scope.userMarker = L.circle( [ 50.5, 30.5 ], 50, {
                stroke: false,
                fillOpacity: 1,
                fillColor: "#00AEEF"
            } ).addTo( $scope.map );

            $scope.playersLayer = L.layerGroup().addTo( $scope.map );

            $scope.$watch( () => $scope.model.players, () => {
                $scope.playersLayer.clearLayers();
                $scope.model.players.forEach( player => {
                    var marker = L.circle( [ parseFloat( player.lat ), parseFloat( player.lng ) ], 50, {
                        stroke: false,
                        fillOpacity: 1,
                        fillColor: "#CC0000"
                    } );
                    marker.addTo( $scope.playersLayer );
                } );
            } );
        }
    };

} );

app.factory( 'MapService', function( $http, AppModel ) {

    return {

        start: function( cb ) {
            this.socket = new WebSocket( "ws://104.155.123.156:3000/entry" );

            this.socket.onopen = event => cb();

            this.socket.onmessage = this.onMessage.bind( this );
        },

        sendPosition: function() {
            this.socket.send( JSON.stringify( {
                "type": 0,
                "name": "Damien",
                "lat": AppModel.user.position.latitude + "",
                "lng": AppModel.user.position.longitude + ""
            } ) );
        },

        onMessage: function( event ){
            var data = JSON.parse( event.data );

            AppModel.players = data.players;
        }

    };

} );
