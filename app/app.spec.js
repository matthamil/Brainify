import app from './app';

describe('app', () => {

  describe('LoginCtrl', () => {
    let $controller

    beforeEach(() => {
      angular.mock.module(app);

      angular.mock.inject((_$controller_) => {
        $controller = _$controller_
      });
    });

    it('should have a controller', () => {
      let $scope = {}
      let ctrl = $controller('LoginCtrl', { $scope: $scope });
      expect(ctrl).toBeDefined();
    });

    it('should have a login function', () => {
      let $scope = {}
      let ctrl = $controller('LoginCtrl', { $scope: $scope });
      expect($scope.login).toBeDefined();
    });
  });
});
