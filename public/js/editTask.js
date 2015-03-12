'use strict';

// Call this function when the page loads (the "ready" event)
$(document).ready(function() {
	initializePage();
})

var taskID = "";
var user = "";

function initializePage() {
	// Get tasks from database
	user = getCookie("email"); // Get the current user
	hide();
	var query = window.location.pathname;
	var vars = query.split('/');
	// Get the select task id
	taskID = vars[vars.length-1];
	$.post("/getTask", {user: user, taskID: taskID},displayTask);
	$('#updateEdit').click(updateTask);
	$('#deleteTask').click(deleteTask);
}

// Update task
function updateTask() {
	var duration = $('#durationHour').val() + ":" + $('#durationMinutes').val();
	var type = $('#TypeList').val();
	var repeat = [];
	var stime = $('#setTimeStart').val();
	if (document.getElementById("setTimeCheck").checked) {
	    var stime = $('#setTimeStart').val();
	    var etime = $('#setTimeEnd').val();
	}
	else {
	    var today = new Date();
	    var shour = today.getHours();
	    var sminute = today.getMinutes();
	    var ehour = shour + parseInt($('#durationHour').val());
	    var eminute = sminute + parseInt($('#durationMinutes').val());
	    if (shour<10) {
	      	shour='0'+shour;
	    }
	    if (sminute<10) {
	      	sminute='0'+sminute;
	    }
	    if (eminute>60) {
	      	eminute=eminute-60;
	      	ehour+=1;
	    }
	    if (ehour>24) {
	      	ehour=24;
	    }
	    if (ehour<10) {
	      	ehour='0'+ehour;
	    }
	    if (eminute<10) {
	      	eminute='0'+eminute;
	    }
	    var stime = shour + ":" + sminute;
	    var etime = ehour + ":" + eminute;
	}
	var date = $('#setDateBox').val();
	if (document.getElementById("setRepeat").checked) {
		var is_repeat = true;
		date = "";
		for (var i=1;i<8;i++) {
			if ((document.getElementById("repeated0").checked)||(document.getElementById("repeated"+i).checked)) {
        		repeat.push(i);
			}
		}
	}
	else {
		var is_repeat = false;
	}
	var task = {
	  "user": user,
      "name": $('#taskName').val(),
      "priority": $('#setPriority').val(),
	  "type": type,
      "location": $('#setLocationBlank').val(),
      "duration": duration,
      "start-time": stime,
      "end-time": etime,
      "date": date,
      "is_repeat": is_repeat,
      "repeat": repeat
    };
	if(!(document.getElementById("setTimeCheck").checked)){
		var blank = "";
		var callbackFunction = function(data) {
			var time = findTime(data, task);
			task['start-time'] = time['start-time'];
			task['end-time'] = time['end-time'];
			$.post("/updateTask", {user: user, taskID: taskID, task: task}, done);
		};
		//wait until findTime finish
		$.post("/getTask", {user: user, taskID: blank}, callbackFunction);
	}
	else{
		$.post("/updateTask", {user: user, taskID: taskID, task: task}, done);
	}
}

// Go back to homepage
function done(result) {
	window.location = "/editSchedule";
}

// Delete task
function deleteTask() {
	var version = getCookie("version");
	bootbox.dialog({
		message: "Do you really want to delete it?",
		title: "Delete Confirm",
		buttons: {
			main: {
				label: "Cancel",
      			className: "btn-primary"
			},
			danger: {
      			label: "Delete",
      			className: "btn-danger",
      			callback: function() {
        			$.post("/deleteTask", {user: user, taskID: taskID}, function(result){
    					window.location = "/editSchedule";
    				});
      			}
    		}
		}
	});
	
}

// Callback of the get tasks
// Display the select task
function displayTask(result) {
	// This task id is not exist, go back to schedule
	if (result.length < 1) {
		window.location = "/editSchedule";
	}
	var task = result[0];
	var stime = task['start-time'];
	var etime = task['end-time'];
	document.getElementById("setTimeCheck").checked = true;
	document.getElementById("setLocation").checked = true;
	var date = task['date'];
	// Repeat task
	if (task['is_repeat'] == true) {
		document.getElementById("setRepeat").checked = true;
		$('.dateRepeatChecked').show();
		$('#setDate').hide();
		if (task['repeat'].length == 7) {
			document.getElementById("repeated0").checked = true;
		}
		else {
			for (var i=0;i<task['repeat'].length;i++) {
				document.getElementById("repeated"+task['repeat'][i]).checked = true;
			}
		}
	}
	// One time task
	else {
		$('#setDateBox').val(date);
		$('#setDateBox').datepicker({
			orientation: 'auto left',
    		format: 'yyyy-mm-dd'
  		});
		$('#setDate').show();
		$('.dateRepeatChecked').hide();
	}
	var duration = task['duration'];
	var vars = duration.split(':');
	var durationHour = vars[0];
	var durationMinutes = vars[1];
	if (durationHour.length < 2)
		durationHour = "0" + durationHour;
	if (durationMinutes.length < 2)
		durationMinutes = "0" + durationMinutes;
	// Show name
	$('#taskName').val(task['name']);
	// Show Type
	$('#TypeList').val(task['type']);
	// Show duration
	$('#durationHour').val(durationHour);
	$('#durationMinutes').val(durationMinutes);
	// Show set time
	$('#setTimeStart').val(stime);
	$('#setTimeEnd').val(etime);
	// Show location
	$('#setLocationBlank').val(task['location']);
	// Show priority
	$('#setPriority').val(task['priority']);
}

// Hide unclick blanks
function hide() {
	$('#Advanced').hide();

  	$('#setTimeCheck').click(function() {
		$('#setTimeCheckBox')[this.checked ? "show" : "hide"]();
  	});

		$("#AdvancedButton").click(function()
		{
			$("#Advanced").toggle();
		});

  	$('#setLocation').click(function() {
		$('.setLocationCheckBox')[this.checked ? "show" : "hide"]();
  	});
  	$('#setRepeat').click(function() {
		$('.dateRepeatChecked')[this.checked ? "show" : "hide"]();
		$('#setDate')[this.checked ? "hide" : "show"]();
  	});
}

/* finds the intersection of
 * two arrays in a simple fashion.
 *
 * PARAMS
 *  a - first array, must already be sorted
 *  b - second array, must already be sorted
 *
 * NOTES
 *
 *  Should have O(n) operations, where n is
 *    n = MIN(a.length(), b.length())
 * from: http://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript
 */
function intersect(a, b)
{
  var ai=0, bi=0;

  while( ai < a.length && bi < b.length )
  {
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     {
		return true;
     }
  }
  return false;
}

//data => all the tasks binded to the account in list
function findTime(data, currentTask){

	//TODO: check previous task before adding
	var sameDate = [];

	var qualified = [];
	var today = new Date();
	var day = today.getDay();
	var time = "";
	var hours = today.getHours();
	var minutes = today.getMinutes();
	if(currentTask['is_repeat']==0){
		if(today.getDate() == parseInt(currentTask['date'].substring(currentTask['date'].length -2,currentTask['date'].length),10)){
			today = new Date();
		}
		else{
			today = new Date(currentTask['date']);
			day = today.getDay();
			hours = 8;
			minutes = 0;
			//starts from 00:00 for other dates
		}
	}
	if (hours<10) {
      hours='0'+hours;
    }
    if (minutes<10) {
      minutes='0'+minutes;
    }
	time = hours +":" +minutes;
	if(day == 0){
		day = 7;
	}
	var i = 0;

	if(currentTask['is_repeat']==1){
		time = "08:00"; // if repeating start time as 8 am
		//collect schedule within those days
		for(i = 0; i < data.length; i++){

			if((data[i])['is_repeat'] == 1){
				if(intersect(currentTask['repeat'],(data[i])['repeat'])){
					qualified.push(data[i]);
					sameDate.push(data[i]);
				}
			}
			else{
				var tempDate = new Date((data[i])['date']);
				var tempDay = tempDate.getDay();
				if(tempDay == 0){
					tempDay = 7;
				}
				if(currentTask['repeat'].indexOf(tempDay) != -1){
					qualified.push(data[i]);
					sameDate.push(data[i])
				}
			}
		}
	}
	else{
		for(i = 0; i < data.length; i++){
			if((data[i])['is_repeat'] == 1){
				if((data[i])['repeat'].indexOf(day) != -1){
					qualified.push(data[i]);
					sameDate.push(data[i]);
				}
			}
			else{
				if(currentTask['date'].localeCompare((data[i])['date']) == 0 ){
					sameDate.push(data[i]);
					if(compare((data[i])['start-time'], time) == 1){
						qualified.push(data[i]);
					}
				}
			}
		}
	}
	qualified.sort(function(a, b){ return compare(a['start-time'], b['start-time'])});
	sameDate.sort(function(a, b){ return compare(a['start-time'], b['start-time'])});


	i = 0;
	while(i < qualified.length){
		var nearest = qualified[i];
		//09:03 -
		if( compare((diff(nearest['start-time'],time)), currentTask['duration']) == 1){
			if(i > 0){
				if(compare(diff(nearest['start-time'],(qualified[i-1])['end-time']), currentTask['duration']) != 1 ){
					i++; continue;
				}
			}
			var flag = false;
			for(var j = 0; j < sameDate.length; j++){
				if(nearest != (sameDate[j]) && currentTask['is_repeat'] == 0){
					if(compare((sameDate[j])['end-time'], (diff(nearest['start-time'], currentTask['duration']))) == 1){
						if(compare((sameDate[j])['start-time'], (diff(nearest['start-time'], currentTask['duration']))) == -1){
							flag = true;
							break;
						}
					}
				}
			}
			if(flag==true){
				i++;
				continue;
			}
			currentTask['start-time'] = diff(nearest['start-time'], currentTask['duration']);
			currentTask['end-time'] = nearest['start-time'];
			var t = {
				"start-time": currentTask['start-time'],
				"end-time": currentTask['end-time']
			};
			return t;
		}
		i++;
	}
	i--;
	//find previous
	//no qualified tasks to hook to
	if(qualified.length == 0){
		for(var j = 0; j < sameDate.length; j++){
			if(compare((sameDate[j])['end-time'], time) == 1 && currentTask['is_repeat'] == 0){
				//problem occurred
				if(j == (sameDate.length - 1)){
					var t = {
						"start-time": (sameDate[j])['end-time'],
						"end-time": addTime((sameDate[j])['end-time'], currentTask['duration'])
					};
					return t;
				}
				else{
					var t = {
						"start-time": (sameDate[j+1])['end-time'],
						"end-time": addTime((sameDate[j+1])['end-time'], currentTask['duration'])
					};
					return t;
				}
			}
		}
		var t = {
			"start-time": time,
			"end-time": addTime(time, currentTask['duration'])
		};
		return t;
	}
	var t = {
		"start-time": (qualified[i])['end-time'],
		"end-time": addTime((qualified[i])['end-time'], currentTask['duration'])
	};
	return t;
}
function addTime(str0, str1){
	var h = parseInt(str0.substring(0,2),10) + parseInt(str1.substring(0,2),10);
	var m = parseInt(str0.substring(3,5),10) + parseInt(str1.substring(3,5),10);

    if (m>60) {
      m=m-60;
      h+=1;
    }
	if (m<10) {
      m='0'+m;
    }
    if (h>24) {
	  //TODO: make go over extra day
      h=h-24;
    }
    if (h<10) {
      h='0'+h;
    }
    var t = (h + ":" + m);
    return t;
}
function diff(str0, str1){
	var h = parseInt(str0.substring(0,2),10) - parseInt(str1.substring(0,2),10);
	var m = parseInt(str0.substring(3,5),10) - parseInt(str1.substring(3,5),10);
	if(m < 0){
		m = 60 + m;
		h--;
	}
	if (h<10) {
      h='0'+h;
    }
    if (m<10) {
      m='0'+m;
    }
	var r = h+":"+m;
	return r;
}

function compare(str0, str1){
	if(parseInt(str0.substring(0,2),10) < parseInt(str1.substring(0,2),10)){
		return -1;
	}
	else if(parseInt(str0.substring(0,2),10) > parseInt(str1.substring(0,2),10)){
		return 1;
	}
	else{
		if(parseInt(str0.substring(3,5),10) < parseInt(str1.substring(3,5),10)){
			return -1;
		}
		else if(parseInt(str0.substring(3,5),10) > parseInt(str1.substring(3,5),10)){
			return 1;
		}
		else{
			return 0;
		}
	}
}