app.factory( 'SpotsLayer', function( $http, $compile ) {

    return {
        map: null,
        layer: null,
        options: {
            stroke: false,
            fillOpacity: 1,
            fillColor: "#000000"
        },

        init: function( map, spots ) {
            this.map = map;
            this.layer = L.layerGroup().addTo( this.map );
            this.update( spots );
        },

        createMarker: function( spot ) {
            return L.circle( [ spot.location.coordinates[ 1 ], spot.location.coordinates[ 0 ] ], 25, this.options );
        },

        addUser: function( user ) {},

        addSpot: function( spot ) {
            $compile( '<spot-marker></spot-marker>' )( {
                layer: this.layer,
                spot: spot
            } );
        },

        update: function( spots ) {
            if ( this.map ) {
                this.layer.clearLayers();
                spots.forEach( function( spot ) {
                    this.addSpot( spot );
                }, this );
            }
        }
    }

} );
