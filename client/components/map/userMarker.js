app.factory( 'UserMarker', function( $http, AppModel ) {

    return {
        map: null,
        marker: null,
        options: {
            stroke: true,
            fillOpacity: 0.4,
            weight: 2,
            color: "#00AEEF",
            fillColor: "#00AEEF"
        },

        init: function( map ) {
            this.map = map;
        },

        setPosition: function( position ) {
            this.marker.setLatLng(
                L.latLng(
                    position.latitude,
                    position.longitude
                )
            );
        },

        createMarker: function( position ) {
            console.log( [ position.latitude, position.longitude ] );
            this.marker = L.circle( [ position.latitude, position.longitude ], 50, this.options ).addTo( this.map );
        },

        update: function( user ) {
            if ( this.map ) {
                if ( this.marker ) this.setPosition( user.position );
                else this.createMarker( user.position );
            }
        }
    }

} );
