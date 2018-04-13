'use strict';

var _brainjs = require('brainjs');

var _brainjs2 = _interopRequireDefault(_brainjs);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.run = function (state, city, existing_data) {
  if (!existing_data) existing_data = [];
  var deferred = _q2.default.defer();
  var temps = [];
  _axios2.default.get('http://api.wunderground.com/api/22662d2addfdc007/hourly/q/' + state + '/' + city + '.json').then(function (response) {
    var first_hour = parseInt(response.data.hourly_forecast[0]['FCTTIME']['hour']);
    var yday = parseInt(response.data.hourly_forecast[0]['FCTTIME']['yday']);
    var year = parseInt(response.data.hourly_forecast[0]['FCTTIME']['year']);
    var month = parseInt(response.data.hourly_forecast[0]['FCTTIME']['mon_padded']);
    var day = parseInt(response.data.hourly_forecast[0]['FCTTIME']['mday_padded']);
    var todays = _underscore2.default.filter(response.data.hourly_forecast, function (obj) {
      return parseInt(obj['FCTTIME']['yday']) == yday;
    });
    var evens = _underscore2.default.filter(todays, function (obj) {
      return parseInt(obj['FCTTIME']['hour']) % 2 == 0;
    });
    var needed = _underscore2.default.filter(evens, function (obj) {
      return parseInt(obj['FCTTIME']['hour']) > 5 && parseInt(obj['FCTTIME']['hour']) < 19;
    });
    temps = _underscore2.default.map(needed, function (obj) {
      return {
        hour: "h" + parseInt(obj['FCTTIME']['hour']),
        temp: obj['temp']['english']
      };
    });

    if (temps.length < 7) {
      _axios2.default.get('http://api.wunderground.com/api/22662d2addfdc007/history_' + year + month + day + '/q/' + state + '/' + city + '.json').then(function (response) {
        var needed = _underscore2.default.filter(response.data.history.observations, function (obj) {
          return parseInt(obj['date']['hour']) % 2 == 0 && parseInt(obj['date']['hour']) > 5 && parseInt(obj['date']['hour']) < 19;
        });
        var previous_temps = _underscore2.default.map(needed, function (obj) {
          return {
            hour: "h" + parseInt(obj['date']['hour']),
            temp: obj['tempi']
          };
        });
        temps = temps.concat(previous_temps);
        deferred.resolve(computeGuess(temps, existing_data));
      }).catch(function (error) {
        deferred.reject(new Error(error));
      });
    } else {
      deferred.resolve(computeGuess(temps, existing_data));
    }
  }).catch(function (error) {
    deferred.reject(new Error(error));
  });
  return deferred.promise;
};

function computeGuess(temps, existing_data) {

  console.log('temps', temps);
  console.log('existing', existing_data);

  var net = new _brainjs2.default.NeuralNetwork();

  var input = { h6: null, h8: null, h10: null, h12: null, h14: null, h16: null, h18: null, s: 1, w: 0 };
  _underscore2.default.each(temps, function (temp) {
    var t = Math.round(parseFloat(temp['temp']));
    var v = t < 31 ? 0 : t > 90 ? 1 : 1 * ((t - 30) / 60);
    input[temp['hour']] = v;
  });

  //patch the missing observations, this weather api is not perfect
  //first try to get the first available previous hour value
  _underscore2.default.each([6, 8, 10, 12, 14, 16, 18], function (num) {
    var i = num;
    while (input['h' + num] == null && i > 5) {
      input['h' + num] = input['h' + (i - 2)];
      i = i - 2;
    }
  });
  //first try to get the first available later hour value
  _underscore2.default.each([6, 8, 10, 12, 14, 16, 18], function (num) {
    var i = num;
    while (input['h' + num] == null && i < 19) {
      input['h' + num] = input['h' + (i + 2)];
      i = i + 2;
    }
  });

  // below 30 degrees is a 0
  // above 90 degrees is a 1
  // all others fit to scale
  // ex: 70 degrees is 1 * (40/60), it is 40 units into the 60 unit scale
  var training_data = [{ input: { h6: 0.0, h8: 0.1, h10: 0.2, h12: 0.2, h14: 0.2, h16: 0.2, h18: 0.1, s: 0.5, w: 0.5 }, output: { pants: 1 } }, { input: { h6: 0.7, h8: 0.8, h10: 0.9, h12: 1.0, h14: 1.0, h16: 1.0, h18: 0.9, s: 0.5, w: 0.5 }, output: { shorts: 1 } }, { input: { h6: 0.5, h8: 0.5, h10: 0.55, h12: 0.6, h14: 0.66, h16: 0.64, h18: 0.6, s: 0.0, w: 0.5 }, output: { pants: 1 } }, { input: { h6: 0.5, h8: 0.5, h10: 0.55, h12: 0.6, h14: 0.66, h16: 0.64, h18: 0.6, s: 1.0, w: 0.0 }, output: { shorts: 1 } }, { input: { h6: 0.6, h8: 0.65, h10: 0.68, h12: 0.7, h14: 0.73, h16: 0.7, h18: 0.68, s: 1.0, w: 0.0 }, output: { shorts: 1 } }, { input: { h6: 0.1, h8: 0.1, h10: 0.3, h12: 0.3, h14: 0.1, h16: 0.1, h18: 0.1, s: 0.75, w: 0.3 }, output: { pants: 1 } }, { input: { h6: 0.3, h8: 0.33, h10: 0.44, h12: 0.5, h14: 0.44, h16: 0.4, h18: 0.4, s: 0.25, w: 0.7 }, output: { pants: 1 } }, { input: { h6: 0.35, h8: 0.4, h10: 0.48, h12: 0.52, h14: 0.5, h16: 0.48, h18: 0.47, s: 1.0, w: 0.1 }, output: { shorts: 1 } }, { input: { h6: 0.03, h8: 0.1, h10: 0.15, h12: 0.2, h14: 0.2, h16: 0.25, h18: 0.2, s: 1, w: 0 }, output: { pants: 1 } }];

  net.train(training_data.concat(existing_data));

  var output = net.run(input);
  return { input: input, output: output };
}