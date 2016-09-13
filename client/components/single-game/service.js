app.factory( 'SingleGameService', function( $http, AppModel ) {

    return {

        startGame: function(  ){
            return $http.post( 'http://api.boomer.im/game/start', null, {
                params: {
                    id: AppModel.game.gameid
                }
            } )
        },

        stopGame: function(  ){
            return $http.post( 'http://api.boomer.im/game/stop', null, {
                params: {
                    id: AppModel.game.gameid
                }
            } )
        }

    };

} );
