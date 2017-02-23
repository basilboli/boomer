app.factory( 'GameAroundService', function( $http, AppModel ) {

    return {

        getAroundGames: function() {
            return $http.get( 'https://api.boomer.im/game/around', {
                params: {
                    lat: AppModel.user.position.latitude,
                    lng: AppModel.user.position.longitude
                }
            } ).then( function( resp ) {
                AppModel.aroundGames = resp.data;
            }, function( err ) {
                console.log( err );
            } );
        }

    };

} );
