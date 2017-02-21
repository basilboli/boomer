app.filter( 'secondsToHuman', function() {
    return function( input ) {
        var h = Math.floor( input / 3600 ),
            m = Math.floor( ( input - ( h * 3600 ) ) / 60 ),
            s = input - ( h * 3600 ) - ( m * 60 );

        return ( h < 10 ? "0" + h : h ) + ':' + ( m < 10 ? "0" + m : m ) + ':' + ( s < 10 ? "0" + s : s );
    };
} );
