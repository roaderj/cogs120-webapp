
/*
 * GET home page.
 */
var data = require('../Data/tasks.json');

exports.view = function(req, res){
  res.render('EditSchedule', data);
};

exports.altView = function(req, res){
  res.render('EditScheduleAlt', data);
};