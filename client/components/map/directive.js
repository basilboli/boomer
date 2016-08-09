app.directive( 'map', function() {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/map/template.html',
        link: ( $scope, elements ) => {

            let container = elements[ 0 ];

            L.mapbox.accessToken = 'pk.eyJ1IjoiZGFtbW1pZW4iLCJhIjoiY2lqeDRsc3NzMDAxd3Zua3AxNGg3N2g3MyJ9.VB6ZqQCOi9LMnR2ojeOHxw';

            $scope.map = L.mapbox.map( container, 'mapbox.light').setView( [ 50, 30 ], 13 );

            $scope.userMarker = L.circle( [ 50, 30 ], 50, {
                stroke: false,
                fillOpacity: 1,
                fillColor: "#00AEEF"
            } ).addTo( $scope.map );

            $scope.playersLayer = L.layerGroup().addTo( $scope.map );

            $scope.$watch( () => $scope.model.players, () => {
                $scope.playersLayer.clearLayers();
                $scope.model.players.forEach( player => {
                    var marker = L.circle( [ parseFloat( player.lat ), parseFloat( player.lng ) ], 50, {
                        stroke: false,
                        fillOpacity: 1,
                        fillColor: "#CC0000"
                    } );
                    marker.addTo( $scope.playersLayer );
                } );
            } );
        }
    };

} );
