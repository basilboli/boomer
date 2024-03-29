app.directive( 'map', function( UsersLayer, UserMarker, GamePolygon, SpotsLayer, AppModel ) {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/map/template.html',
        link: function( $scope, elements ) {

            $scope.model = AppModel;

            L.mapbox.accessToken = 'pk.eyJ1IjoiZGFtbW1pZW4iLCJhIjoiY2lqeDRsc3NzMDAxd3Zua3AxNGg3N2g3MyJ9.VB6ZqQCOi9LMnR2ojeOHxw';

            $scope.map = L.mapbox.map( elements[ 0 ], 'mapbox.light', {
                zoomControl: false,
                attributionControl: false,
                reuseTiles: true,
                fadeAnimation: false,
                //zoomAnimation: false,
                minZoom: 10,
                maxZoom: 18
            } ).setView( [ AppModel.user.position.latitude, AppModel.user.position.longitude ], 13 );

            AppModel.map = $scope.map;

            // $scope.map.on( 'zoomend', function( e ) {
            //     console.log( $scope.map.getZoom() );
            // } );

            SpotsLayer.init( $scope.map, AppModel.game.spots );

            UsersLayer.init( $scope.map );

            UserMarker.init( $scope.map );

            GamePolygon.init( $scope.map );

            UserMarker.update( AppModel.user );
        }
    };

} );
