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
