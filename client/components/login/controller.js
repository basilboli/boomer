app.controller( 'loginCtrl', function( $scope, AppModel, $location, LoginService ) {

    $scope.onConnect = () => {
        $location.path( '/map' );
    }

} );
