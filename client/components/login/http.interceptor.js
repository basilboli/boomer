app.factory( 'AuthInterceptor', function( AppModel, $location ) {

    return {

        request: function( config ) {
            config.headers = config.headers || {};

            if ( AppModel.user.token ) {
                config.headers.Authorization = "Bearer " + AppModel.user.token;
            }

            return config;
        },

        responseError: function( response ) {

            if ( response.status === 401 ) {
                delete AppModel.user.token;
                delete window.localStorage[ 'token' ];
                $location.path( '/login' );
            }

            return response;
        }

    };

} );
