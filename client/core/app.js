var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {

    $routeProvider.when( '/', {
        redirectTo: '/login'
    } ).when( '/login', {
        template: '<login></login>'
    } ).when( '/map', {
        template: '<map></map>'
    } ).otherwise( {
        redirectTo: '/'
    } );

    $locationProvider.html5Mode( {
        enabled: true,
        requireBase: false
    } );

} );
