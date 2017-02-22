app.factory( 'SingleGameService', function( $http, AppModel ) {

    return {

        startGame: function() {
            return $http.post( 'http://api.boomer.im/game/start', null, {
                params: {
                    id: AppModel.game.gameid
                }
            } ).then( function() {

            }.bind( this ), function( err ) {
                console.log( err );
            }.bind( this ) )
        },

        stopGame: function() {
            return $http.post( 'http://api.boomer.im/game/stop', null, {
                params: {
                    id: AppModel.game.gameid
                }
            } )
        }

    };

} );
