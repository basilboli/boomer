var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {
    $routeProvider.when( '/', {
        redirectTo: '/login'
    } ).when( '/login', {
        controller: "loginCtrl",
        templateUrl: 'templates/login/template.html'
    } ).when( '/game-type-choice', {
        controller: "gameTypeChoiceCtrl",
        templateUrl: 'templates/game-type-choice/template.html'
    } ).when( '/single-game', {
        controller: "singleGameCtrl",
        templateUrl: 'templates/single-game/template.html',
        resolve: {
            preload: function( AppModel, $q, GameService ) {
                AppModel.loader.show = true;

                var deferred = $q.defer();

                GameService.start( deferred );

                return deferred.promise;
            }
        }
    } ).otherwise( {
        redirectTo: '/'
    } );
} );

app.config( [ '$httpProvider', function( $httpProvider ) {
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
} ] );

app.controller( 'appCtrl', function( $scope, AppModel ) {

    $scope.model = AppModel;


} );
