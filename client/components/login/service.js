app.factory( 'LoginService', function( $http, $q, $location, AppModel ) {

    return {

        login: function( email, password ) {
            return $http.post( 'http://api.boomer.im/login', null, {
                headers: {
                    "Authorization": "Basic " + btoa( email + ":" + password )
                }
            } ).then(
                function( resp ) {
                    this.setToken( resp.data.token );
                    $location.path( '/game-type-choice' );
                }.bind( this ),
                function( err ) {
                    console.log( err );
                }.bind( this )
            )
        },

        setToken: function( token ) {
            AppModel.user.token = token;
            window.localStorage[ 'token' ] = token;
        }

    };

} );
