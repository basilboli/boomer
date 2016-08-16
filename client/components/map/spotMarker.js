app.directive( 'spotMarker', function() {

    return {
        restrict: 'E',
        link: ( $scope ) => {
            $scope.marker = L.marker( [
                $scope.spot.location.coordinates[ 1 ],
                $scope.spot.location.coordinates[ 0 ]
            ] );

            $scope.marker.on( 'click', function( e ) {
                console.log( 'ok' );
            } );

            $scope.marker.addTo( $scope.layer );
        }
    };

} );
