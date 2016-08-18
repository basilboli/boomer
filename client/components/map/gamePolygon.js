app.factory( 'GamePolygon', function( $http, AppModel ) {

    return {
        map: null,
        polygon: null,
        options: {
            stroke: false,
            fillOpacity: 0.25,
            fillColor: "#00AEEF"
        },

        init: function( map ) {
            this.map = map;
            this.createPolygon( AppModel.game.polygon.coordinates );
        },

        createPolygon: function( coordinates ) {
            coordinates.pop();
            coordinates = coordinates.map( function( point ) {
                point.push( point.shift() );
                return point;
            } );
            this.polygon = L.polygon( coordinates, this.options ).addTo( this.map );
        }
    }

} );
