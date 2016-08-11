var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {

    // $httpProvider.defaults.headers.common = {};
    // $httpProvider.defaults.headers.post = {};

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

app.config( [ '$httpProvider', function( $httpProvider ) {
    //Reset headers to avoid OPTIONS request (aka preflight)
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
} ] );
