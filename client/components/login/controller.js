app.controller( 'loginCtrl', function( $scope, AppModel, $location, LoginService ) {

    $scope.onConnect = function() {
        $location.path( '/map' );
    }

} );
