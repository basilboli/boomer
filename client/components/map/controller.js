app.controller( 'mapCtrl', function( $scope, $timeout, $window, AppModel, MapService, UserMarker ) {

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
        $timeout( $scope.updateUserGeolocation, 3000 );
    };

    $window.plugins.insomnia.keepAwake();

    $scope.updateUserGeolocation();

} );
