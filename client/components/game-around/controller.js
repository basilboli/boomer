app.controller( 'gameAroundCtrl', function( $scope, AppModel, $location, GameAroundService ) {

    $scope.model = AppModel;

    navigator.geolocation.getCurrentPosition(
        function( position ) {
            AppModel.user.position.latitude = position.coords.latitude;
            AppModel.user.position.longitude = position.coords.longitude;
            $scope.getGamesList();
        }.bind( this ),
        function( err ) {
            console.log( err );
        }.bind( this )
    );

    $scope.getGamesList = function() {
        AppModel.loader.show = true;
        GameAroundService.getAroundGames().finally( function() {
            AppModel.loader.show = false;
        } );
    };

    $scope.launchGame = function( game ) {
        $location.path( '/single-game/' + game.gameid );
    };

} );
