var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider, $httpProvider ) {
    $routeProvider.when( '/', {
        redirectTo: '/login'
    } ).when( '/login', {
        controller: "loginCtrl",
        templateUrl: 'templates/login/template.html'
    } ).when( '/game-type-choice', {
        controller: "gameTypeChoiceCtrl",
        templateUrl: 'templates/game-type-choice/template.html'
    } ).when( '/game-around', {
        controller: "gameAroundCtrl",
        templateUrl: 'templates/game-around/template.html'
    } ).when( '/single-game/:gameId', {
        controller: "singleGameCtrl",
        templateUrl: 'templates/single-game/template.html'
    } ).otherwise( {
        redirectTo: '/'
    } );


    $httpProvider.interceptors.push( 'AuthInterceptor' );
} );

app.controller( 'appCtrl', function( $scope, AppModel, LoginService ) {

    $scope.model = AppModel;

    var token = window.localStorage[ 'token' ];

    if ( token ) LoginService.setToken( token );

} );
