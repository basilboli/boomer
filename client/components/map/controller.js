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
