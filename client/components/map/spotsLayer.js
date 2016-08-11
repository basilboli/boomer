app.factory( 'SpotsLayer', function( $http ) {

    return {
        map: null,
        layer: null,
        options: {
            stroke: false,
            fillOpacity: 1,
            fillColor: "#CC0000"
        },

        init: function( map ) {
            this.map = map;
            this.layer = L.layerGroup().addTo( this.map );
        },

        createMarker: function( spot ) {
            var coordinates = spot.location.coordinates;
            return L.marker( [ coordinates[ 1 ], coordinates[ 0 ] ] );
        },

        addSpot: function( spot ) {
            var marker = this.createMarker( spot );
            marker.addTo( this.layer );
        },

        update: function( spots ) {
            if ( this.map ) {
                this.layer.clearLayers();
                spots.forEach( spot => this.addSpot( spot ) );
            }
        }
    }

} );
