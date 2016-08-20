app.factory( 'UserMarker', function( $http, AppModel ) {

    return {
        map: null,
        marker: null,
        areaOptions: {
            stroke: false,
            fillOpacity: 0.3,
            color: "#00AEEF",
            fillColor: "#00AEEF"
        },
        markerOptions: {
            stroke: false,
            fillOpacity: 1,
            radius: 8,
            fillColor: "#00AEEF"
        },

        init: function( map ) {
            this.map = map;
            this.headingIcon = L.icon( {
                iconUrl: 'libs/images/compass.svg',
                iconSize: [ 48, 48 ],
                iconAnchor: [ 24, 24 ],
            } );
        },

        setPosition: function( position ) {
            this.area.setLatLng(
                L.latLng(
                    position.latitude,
                    position.longitude
                )
            );

            this.marker.setLatLng(
                L.latLng(
                    position.latitude,
                    position.longitude
                )
            );
        },

        setHeading: function( angle ) {
            this.marker.setRotationAngle( angle );
        },

        createMarker: function( position ) {
            this.area = L.circle( [ position.latitude, position.longitude ], 50, this.areaOptions ).addTo( this.map );
            // this.marker = L.circleMarker( [ position.latitude, position.longitude ], this.markerOptions ).addTo( this.map );
            this.marker = L.marker( [ position.latitude, position.longitude ], {
                icon: this.headingIcon,
                rotationAngle: 0,
                rotationOrigin: "center center"
            } ).addTo( this.map );

            this.watchCompass();
        },

        watchCompass(){
            if ( navigator.compass ) {
                navigator.compass.watchHeading( function( heading ) {
                    this.setHeading( heading.magneticHeading );
                }.bind( this ), function( err ) {
                    console.log( err );
                }, {
                    frequency: 50
                } );
            }
        },

        update: function( user ) {
            if ( this.map ) {
                if ( this.area && this.marker ) this.setPosition( user.position );
                else this.createMarker( user.position );
            }
        }
    }

} );
