'use strict';

var _pants_brain = require('./pants_brain');

var _pants_brain2 = _interopRequireDefault(_pants_brain);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _pants_brain2.default)().then(function (value) {
  console.log(value);
}, function (error) {
  console.log(error);
});