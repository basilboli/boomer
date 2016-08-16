app.factory( 'SpotsLayer', function( $http, $compile ) {

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

        addSpot: function( spot ) {
            $compile('<spot-marker></spot-marker>')( {
                foo: "bar",
                layer: this.layer,
                spot: spot
            });
        },

        update: function( spots ) {
            if ( this.map ) {
                this.layer.clearLayers();
                spots.forEach( spot => this.addSpot( spot ) );
            }
        }
    }

} );
