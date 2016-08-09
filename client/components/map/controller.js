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
