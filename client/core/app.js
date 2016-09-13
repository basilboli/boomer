var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {
    $routeProvider.when( '/', {
        redirectTo: '/login'
    } ).when( '/login', {
        controller: "loginCtrl",
        templateUrl: 'templates/login/template.html',
        resolve: {
            geo: function( AppModel, LoginService ) {
                return LoginService.getGeolocation();
            }
        }
    } ).when( '/game-type-choice', {
        controller: "gameTypeChoiceCtrl",
        templateUrl: 'templates/game-type-choice/template.html'
    } ).when( '/game-around', {
        controller: "gameAroundCtrl",
        templateUrl: 'templates/game-around/template.html',
        resolve: {
            preload: function( AppModel, GameAroundService ) {
                return GameAroundService.getAroundGames();
            }
        }
    } ).when( '/single-game/:gameId', {
        controller: "singleGameCtrl",
        templateUrl: 'templates/single-game/template.html',
        resolve: {
            preload: function( AppModel, GameService ) {
                return GameService.start();
            }
        }
    } ).otherwise( {
        redirectTo: '/'
    } );
} );

app.config( [ '$httpProvider', function( $httpProvider ) {
    // $httpProvider.defaults.headers.common = {};
    // $httpProvider.defaults.headers.post = {};
    // $httpProvider.defaults.headers.put = {};
    // $httpProvider.defaults.headers.patch = {};

    $httpProvider.interceptors.push( 'AuthInterceptor' );
} ] );

app.controller( 'appCtrl', function( $scope, AppModel ) {

    $scope.model = AppModel;


} );
