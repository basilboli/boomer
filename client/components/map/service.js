app.factory( 'MapService', function( $http, AppModel ) {

    return {

        start: function( cb ) {
            this.socket = new WebSocket( "ws://104.155.123.156:3000/entry" );

            this.socket.onopen = event => cb();

            this.socket.onmessage = this.onMessage.bind( this );
        },

        sendPosition: function() {
            this.socket.send( JSON.stringify( {
                "type": 0,
                "name": "Damien",
                "lat": AppModel.user.position.latitude + "",
                "lng": AppModel.user.position.longitude + ""
            } ) );
        },

        onMessage: function( event ){
            var data = JSON.parse( event.data );

            AppModel.players = data.players;
        }

    };

} );