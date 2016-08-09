var gulp = require( 'gulp' ),
    less = require( 'gulp-less' ),
    gulp_concat = require( 'gulp-concat' ),
    Server = require( './Server' );

// LESS
gulp.task( 'less', function() {
    return gulp.src(
        './core/style/main.less'
    ).pipe(
        less()
    ).pipe(
        gulp.dest( './www/style/' )
    );
} );

// JS
gulp.task( 'js', function() {
    return gulp.src( [
        './core/app.js',
        './core/AppModel.js',
        './components/**/*.js'
    ] ).pipe(
        gulp_concat( 'main.js' )
    ).pipe(
        gulp.dest( './www/js/' )
    );
} );

// TEMPLATES
gulp.task( 'move_templates', function() {
    return gulp.src( [
        './core/templates/*.html',
        './components/**/*.html'
    ] ).pipe( gulp.dest( './www/templates/' ) );
} );

// BUILD
gulp.task( 'build', [ 'less', 'js', 'move_templates' ] );

// SERVER
gulp.task( 'serve', function() {
    var server = new Server( {
        port: 9000
    } );
} );

// DEFAULT
gulp.task( 'default', [ 'less', 'js', 'move_templates', 'serve' ], function() {
    gulp.watch( [ './core/style/*.less', './components/**/style/*.less' ], [ 'less' ] );
    gulp.watch( [ './core/app.js', './components/**/*.js' ], [ 'js' ] );
    gulp.watch( [ './core/templates/*.html', './components/**/*.html' ], [ 'move_templates' ] );
} );
