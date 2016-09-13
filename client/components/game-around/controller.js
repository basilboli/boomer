app.controller( 'gameAroundCtrl', function( $scope, AppModel, $location, GameAroundService ) {

    $scope.model = AppModel;

    $scope.launchGame = function( game ) {
        $location.path( '/single-game/' + game.gameid );
    };

} );
