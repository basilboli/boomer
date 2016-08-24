var app = angular.module( 'Application', [ 'ngRoute' ] );

app.config( function( $routeProvider, $locationProvider ) {
    $routeProvider.when( '/', {
        redirectTo: '/login'
    } ).when( '/login', {
        controller: "loginCtrl",
        templateUrl: 'templates/login/template.html'
    } ).when( '/map', {
        template: '<map></map>',
        resolve: {
            preload: function( AppModel, $q, Game ) {
                AppModel.loader.show = true;

                var deferred = $q.defer();

                Game.start( deferred );

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
