app.controller( 'singleGameCtrl', function( $scope, $routeParams, AppModel, SingleGameService, GameService ) {

    $scope.started = false;

    AppModel.game = AppModel.aroundGames.filter( function( game ) {
        return game.gameid === $routeParams.gameId;
    } )[ 0 ];

    $scope.startGame = function(  ){
        SingleGameService.startGame().then( function(  ){
            $scope.started = true;
        } );
    };

    $scope.stopGame = function(  ){
        if( $scope.started ){
            SingleGameService.stopGame().then( function(  ){
                $scope.started = false;
            } );
        }
        GameService.stop();
    };

    $scope.$on( "$destroy", function() {
        $scope.stopGame();
    } );

} );
