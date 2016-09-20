import app from './app';
require('jasmine-ajax');

describe('Brainify', () => {
  // Unit tests for the app
  // See: https://i.imgur.com/ia4igcZ.png

  describe('LoginCtrl', () => {
    let $controller

    beforeEach(() => {
      angular.mock.module(app);

      angular.mock.inject((_$controller_) => {
        $controller = _$controller_
      });

      // Setup Jasmine Ajax
      jasmine.Ajax.install();
    });

    afterEach(() => {
      // Disable Jasmine Ajax
      jasmine.Ajax.uninstall();
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
