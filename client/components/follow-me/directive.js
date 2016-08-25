app.directive( 'followMe', function() {

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/follow-me/template.html',
        controller: function( $scope, AppModel ) {

            $scope.model = AppModel;

            $scope.onCenterMap = function() {
                if ( $scope.model.map ) {
                    $scope.model.map.setView( [ $scope.model.user.position.latitude, $scope.model.user.position.longitude ] );
                }
            };

        }
    }

} );
