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
            preload: function( AppModel, $q ) {
                var deferred = $q.defer();

                AppModel.loader.show = true;

                navigator.geolocation.getCurrentPosition(
                    function( result ) {
                        AppModel.user.position.latitude = result.coords.latitude;
                        AppModel.user.position.longitude = result.coords.longitude;
                        deferred.resolve();
                    },
                    function( err ) {
                        console.log( err );
                    }
                );

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
