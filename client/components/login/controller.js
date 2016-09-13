app.controller( 'loginCtrl', function( $scope, AppModel, $location, LoginService ) {

    $scope.email = "";
    $scope.password = "";

    $scope.onConnect = function() {
        LoginService.login( $scope.email, $scope.password );
    }

} );
