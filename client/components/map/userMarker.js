app.factory( 'UserMarker', function( $http, AppModel ) {

    return {
        map: null,
        marker: null,
        options: {
            stroke: false,
            fillOpacity: 1,
            fillColor: "#00AEEF"
        },

        init: function( map ) {
            this.map = map;
        },

        setPosition: function( user ) {
            this.marker.setLatLng(
                L.latLng(
                    user.position.latitude,
                    user.position.longitude
                )
            );
        },

        createMarker: function( position ) {
            this.marker = L.circle( [ position.latitude, position.longitude ], 25, this.options ).addTo( this.map );
        },

        update: function( user ) {
            if ( this.map ) {
                if ( this.marker ) this.setPosition( user.position );
                else this.createMarker( user );
            }
        }
    }

} );
