app.directive( 'spotMarker', function( MapService ) {

    return {
        restrict: 'E',
        link: function( $scope ) {
            $scope.marker = L.circleMarker( [
                $scope.spot.location.coordinates[ 1 ],
                $scope.spot.location.coordinates[ 0 ]
            ], {
                stroke: false,
                fillOpacity: 1,
                radius: 8,
                fillColor: $scope.spot.checked ? "green" : $scope.spot.nearby ? "blue" : "grey"
            } );

            $scope.marker.on( 'click', function( e ) {
                if( $scope.spot.nearby && !$scope.spot.checked ) MapService.checkSpot( $scope.spot );
            } );

            $scope.marker.addTo( $scope.layer );
        }
    };

} );
