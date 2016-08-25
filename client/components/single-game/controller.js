app.controller( 'singleGameCtrl', function( $scope, AppModel, GameService ) {

    $scope.$on( "$destroy", function() {
        GameService.stopWatchGeolocation();
    } );

} );
