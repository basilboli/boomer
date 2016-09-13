app.factory( 'GameAroundService', function( $http, AppModel ) {

    return {

        getAroundGames: function() {
            AppModel.loader.show = true;

            return $http.get( 'http://api.boomer.im/game/around', {
                params: {
                    lat: AppModel.user.position.latitude,
                    lng: AppModel.user.position.longitude
                }
            } ).then( function( resp ) {
                AppModel.aroundGames = resp.data;
                AppModel.loader.show = false;
            }, function( err ) {
                console.log( err );
                AppModel.loader.show = false;
            } );
        }

    };

} );
