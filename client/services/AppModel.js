app.factory( 'AppModel', function() {

    return {

        followGeolocation: false,

        user: {
            position: {}
        },

        players: [],

        game: {
            polygon: []
        },

        loader: {
            show: false
        },

        heading: 0

    };

} );
