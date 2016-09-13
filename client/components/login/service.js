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
        },

        getGeolocation: function() {
            var deferred = $q.defer();

            navigator.geolocation.getCurrentPosition(
                function( position ) {
                    AppModel.user.position.latitude = position.coords.latitude;
                    AppModel.user.position.longitude = position.coords.longitude;
                    deferred.resolve();
                }.bind( this ),
                function( err ) {
                    console.log( err );
                    deferred.resolve();
                }.bind( this )
            );

            return deferred.promise;
        }

    };

} );
