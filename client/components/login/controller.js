app.controller( 'loginCtrl', function( $scope, AppModel, $location, LoginService ) {

    if( AppModel.user.token ) $location.path( '/game-type-choice' );

    $scope.email = "";
    $scope.password = "";

    $scope.onConnect = function() {
        LoginService.login( $scope.email, $scope.password );
    }

} );
