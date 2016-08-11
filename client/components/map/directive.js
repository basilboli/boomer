app.directive( 'map', function( $compile, PlayersLayer, UserMarker, MapService, GamePolygon, SpotsLayer ) {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/map/template.html',
        link: ( $scope, elements ) => {

            L.mapbox.accessToken = 'pk.eyJ1IjoiZGFtbW1pZW4iLCJhIjoiY2lqeDRsc3NzMDAxd3Zua3AxNGg3N2g3MyJ9.VB6ZqQCOi9LMnR2ojeOHxw';

            $scope.map = L.mapbox.map( elements[ 0 ], 'mapbox.light' ).setView( [ 50, 30 ], 13 );

            SpotsLayer.init( $scope.map );

            PlayersLayer.init( $scope.map );

            UserMarker.init( $scope.map );

            MapService.getGame().then( () => GamePolygon.init( $scope.map ) );
        }
    };

} );
