app.directive( 'spotMarker', function( GameService, SpotsLayer, AppModel ) {

    return {
        restrict: 'E',
        link: function( $scope ) {

            $scope.marker = L.circleMarker( [
                $scope.spot.geometry.coordinates[ 1 ],
                $scope.spot.geometry.coordinates[ 0 ]
            ], {
                stroke: false,
                fillOpacity: 1,
                radius: 8,
                fillColor: $scope.spot.checked ? "green" : $scope.spot.nearby ? "blue" : "grey"
            } );

            $scope.marker.on( 'click', function( e ) {
                if ( $scope.spot.nearby && !$scope.spot.checked ) {
                    GameService.checkSpot( $scope.spot ).then( function() {
                        SpotsLayer.update( AppModel.game.spots );
                    } );
                }
            } );

            $scope.marker.addTo( $scope.layer );
        }
    };

} );
