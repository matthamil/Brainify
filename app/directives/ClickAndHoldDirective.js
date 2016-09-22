'use strict';

function clickAndHold($parse, $timeout) {
  return {
    link: function (scope, element, attrs) {
      var clickAndHoldFn = $parse(attrs.onClickAndHold);
      var start;
      var doNotTriggerClick;
      var timeoutHandler;
      element.on('mousedown', function () {
          start = Date.now();
          $timeout.cancel(timeoutHandler);
          timeoutHandler = $timeout(function () {
            clickAndHoldFn(scope, {$event: event})
          }, 3000)
      });
      element.on('mouseup', function (event) {
          $timeout.cancel(timeoutHandler);
      });

      if (attrs.onClick) {
          var clickFn = $parse(attrs.onClick);
          element.on('click', function (event) {
              if (doNotTriggerClick) {
                  doNotTriggerClick = false;
                  return;
              }
              clickFn(scope, {$event: event});
              scope.$apply();
          });
      }
    }
  };
}

module.exports = clickAndHold;
