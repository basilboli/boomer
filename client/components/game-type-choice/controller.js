app.controller( 'gameTypeChoiceCtrl', function( $scope, AppModel, $location, GameChoiceService ) {

    $scope.onChoiceSingle = function() {
        $location.path( '/game-around' );
    }

} );
