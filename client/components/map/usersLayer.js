app.factory( 'UsersLayer', function( $http ) {

    return {
        map: null,
        layer: null,
        options: {
            stroke: false,
            fillOpacity: 1,
            fillColor: "#CC0000",
            radius: 8
        },

        init: function( map ) {
            this.map = map;
            this.layer = L.layerGroup().addTo( this.map );
        },

        createMarker: function( user ) {
            return L.circleMarker( [ user.coordinates[ 1 ], user.coordinates[ 0 ] ], this.options );
        },

        addUser: function( user ) {
            var marker = this.createMarker( user );
            marker.addTo( this.layer );
        },

        update: function( users ) {
            if ( this.map ) {
                this.layer.clearLayers();
                users.forEach( function( user ) {
                    this.addUser( user )
                }, this );
            }
        }
    }

} );
