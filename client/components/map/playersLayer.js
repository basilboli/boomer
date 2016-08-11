app.factory( 'PlayersLayer', function( $http, AppModel ) {

    return {
        map: null,
        layer: null,
        model: AppModel,
        options: {
            stroke: false,
            fillOpacity: 1,
            fillColor: "#CC0000"
        },

        init: function( map ) {
            this.map = map;
            this.layer = L.layerGroup().addTo( this.map );
        },

        createMarker: function( player ) {
            return L.circle( [ player.coordinates[ 1 ], player.coordinates[ 0 ] ], 25, this.options );
        },

        addPlayer: function( player ) {
            var marker = this.createMarker( player );
            marker.addTo( this.layer );
        },

        update: function( players ) {
            if ( this.map ) {
                this.layer.clearLayers();
                players.forEach( player => this.addPlayer( player ) );
            }
        }
    }

} );
