app.directive( 'followMe', function() {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/follow-me/template.html',
        controller: function( $scope, AppModel ) {

            $scope.model = AppModel;

            $scope.onToggleFollowGeolocation = function() {
                $scope.model.followGeolocation = !$scope.model.followGeolocation;

                if ( $scope.model.map && $scope.model.followGeolocation ) {
                    $scope.model.map.setView( [ $scope.model.user.position.latitude, $scope.model.user.position.longitude ] );
                }
            };

        }
    }

} );
