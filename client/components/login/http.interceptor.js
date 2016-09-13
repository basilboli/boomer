app.factory( 'AuthInterceptor', function( AppModel ) {

    return {
        request: function( config ) {
            config.headers = config.headers || {};

            if( AppModel.user.token ){
                config.headers.Authorization = "Bearer " + AppModel.user.token;
            }

            return config;
        }
    };

} );
