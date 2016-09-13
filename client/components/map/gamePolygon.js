app.factory( 'GamePolygon', function( $http, AppModel ) {

    return {
        map: null,
        polygon: null,
        options: {
            stroke: false,
            fillOpacity: 0.2,
            fillColor: "#000000"
        },

        init: function( map ) {
            this.map = map;
            this.createPolygon( AppModel.game.geometry.coordinates[ 0 ] );
        },

        createPolygon: function( coordinates ) {
            coordinates = coordinates.map( function( point ) {
                return [ point[ 1 ], point[ 0 ] ]; // inverse [ lat, lng ] => [ lng, lat ]
            } );
            this.polygon = L.polygon( coordinates, this.options ).addTo( this.map );
        }
    }

} );
