/**********************************/
/*                                */
/* Copyright (c) Paul Jordan 2013 */
/* paullj1@gmail.com              */
/*                                */
/**********************************/

// Constants
var CURRENT_TEMP_ID = 1;
var CURRENT_SETPOINT_ID = 2;
var MODE_ID = 3;
var VARIANCE_ID = 4;
var FAN_ID = 6;
var LAST_OCCUPIED_ID = 7;
var UNOCCUPIED_HEAT_ID = 8;
var UNOCCUPIED_COOL_ID = 9;
var NIGHT_OCCUPIED_HEAT_ID = 11;
var DAY_OCCUPIED_HEAT_ID = 12;
var NIGHT_OCCUPIED_COOL_ID = 13;
var DAY_OCCUPIED_COOL_ID = 14;
var OVERRIDE_ID = 17;
var OCCUPIED_ID = 18
var HEAT_STATUS_ID = 19
var COOL_STATUS_ID = 20
var FAN_STATUS_ID = 21

var LOCATION = "Dayton"
var APIKEY="INSERT YOURS HERE"
var LOCAL_REFRESH_RATE = 10000
var WEATHER_REFRESH_RATE = 60000
var setpoint = 0;
var modify_setpoint_id = 0;
var modify_setpoint_value = 0;

/************************/
/*                      */
/*      HOME PAGE       */
/*                      */
/************************/
$(document).ready(function() {
	get_weather();
	get_local();
});

function get_local() {
  // Get local DB stuff
	$.ajax({
		type : "POST",
		async: false,
		url : "home.php",
		cache : false,
		dataType : "json",
		success : update_local,
		error: function(xhr) { console.log("AJAX request failed: " + xhr.status); }
	});

	// Update info regularly
	setTimeout(get_local, LOCAL_REFRESH_RATE);
}

function get_weather() {
  // Get Weather data
	$.ajax({
		type : "GET",
		async: false,
		url : "http://api.openweathermap.org/data/2.5/weather",
		cache : false,
		dataType : "json",
		data : {
			q: LOCATION,
			APPID: APIKEY,
			units: "imperial"
		},
		success : update_weather,
		error: function(xhr) { console.log("AJAX request failed: " + xhr.status); }
	});

	// Update info regularly
	setTimeout(get_weather, WEATHER_REFRESH_RATE);
}

function update_weather(data) {
	//console.dir(data);

	$("#weather-city-container").html(data.name);
	$("#weather-img-container").html("<img src='http://openweathermap.org/img/w/"+data.weather[0].icon+".png'></img>");
	$("#weather-temp-container").html("<h5>"+data.main.temp+"&deg; F</h5>");
	$("#weather-humidity-container").html("Humidity: "+data.main.humidity+" %");
	$("#weather-wind-container").html("Wind: "+data.wind.speed+" mph");
}

function update_local(data) {
	//console.dir(data);
	$("#current-temp-container").html("<h5>Indoor Temp: "+Math.floor(data.current_temp)+"&deg; F</h5>");
	$("#current-setpoint-container").html("<h5>Setpoint: "+(setpoint = data.current_setpoint)+"&deg; F</h5>");
	$("#current-mode-container").html("Mode: <b>"+data.mode+"</b>");
	
	var light = 'off';
	if ( data.occupied == "True" ) light = 'on';
	$("#occupied-status-container").html("Occupied: <img style='vertical-align:middle' src='images/"+light+".png'></img>");

	light = 'off';
	if ( data.heat_status == "on" ) light = 'on';
	$("#heat-status-container").html("Heat: <img style='vertical-align:middle' src='images/"+light+".png'></img>");

	light = 'off';
	if ( data.cool_status == "on" ) light = 'on';
	$("#cool-status-container").html("Cool: <img style='vertical-align:middle' src='images/"+light+".png'></img>");

	light = 'off';
	if ( data.fan_status == "on" ) light = 'on';
	$("#fan-status-container").html("Fan: <img style='vertical-align:middle' src='images/"+light+".png'></img>");

}

/************************/
/*                      */
/*    SETTINGS PAGE     */
/*                      */
/************************/

// Grab variables before page shows
$(document).on("pagebeforeshow","#settings",function(){ 
	get_settings_data();

	// Connect Update Functions
	$(".settings-form-sliders").on( 'check', function( event ) { 
		var id = 0;
		var value = '';
		if ( event.currentTarget.id == "fan-switch" ) {
			id = FAN_ID;
			value = event.currentTarget.checked ? 'On' : 'Auto';
		}

		if ( event.currentTarget.id == "override-switch" ) {
			id = OVERRIDE_ID;
			value = event.currentTarget.checked ? 'True' : 'False';
		}

		if ( id != 0 && value != '') 
			set_val_db(id, value);

	});

	$(".settings-form-radios").bind( "click", function(event) {
		console.dir(event); // for debug
		set_val_db(MODE_ID, event.currentTarget.value);
	});
});

function get_settings_data() {
	$.ajax({
		type : "POST",
		async: false,
		url : "settings.php",
		cache : false,
		dataType : "json",
		success : populate_settings,
		error: function(xhr) { console.log("AJAX request failed: " + xhr.status); }
	});
}

function populate_settings(data) {
	console.dir(data); // for debug
	if (data.fan == "on") $("#fan-switch").checked = true;
	else $("#fan-switch").checked = false;

	if (data.override == "True") $("#override-switch").checked = true;
	else $("#override-switch").checked = false;


	if (data.mode == "heat") {
		$("#mode-selector-heat").className = $("#mode-selector-heat").className.replace( /(?:^|\s)btn-flat(?!\S)/g , 'btn' )
		$("#mode-selector-cool").className = $("#mode-selector-cool").className.replace( /(?:^|\s)btn(?!\S)/g , 'btn-flat' )
		$("#mode-selector-off").className = $("#mode-selector-off").className.replace( /(?:^|\s)btn(?!\S)/g , 'btn-flat' )
	} else if (data.mode == "cool") {
		$("#mode-selector-heat").className = $("#mode-selector-heat").className.replace( /(?:^|\s)btn(?!\S)/g , 'btn-flat' )
		$("#mode-selector-cool").className = $("#mode-selector-cool").className.replace( /(?:^|\s)btn-flat(?!\S)/g , 'btn' )
		$("#mode-selector-off").className = $("#mode-selector-off").className.replace( /(?:^|\s)btn(?!\S)/g , 'btn-flat' )
	} else { // OFF
		$("#mode-selector-heat").className = $("#mode-selector-heat").className.replace( /(?:^|\s)btn(?!\S)/g , 'btn-flat' )
		$("#mode-selector-cool").className = $("#mode-selector-cool").className.replace( /(?:^|\s)btn(?!\S)/g , 'btn-flat' )
		$("#mode-selector-off").className = $("#mode-selector-off").className.replace( /(?:^|\s)btn-flat(?!\S)/g , 'btn' )
	}

	$("#occupied-day-heat").html(data.day_occupied_heat+"&deg; F");
	$("#occupied-night-heat").html(data.night_occupied_heat+"&deg; F");
	$("#unoccupied-heat").html(data.unoccupied_heat+"&deg; F");
	$("#occupied-day-cool").html(data.day_occupied_cool+"&deg; F");
	$("#occupied-night-cool").html(data.night_occupied_cool+"&deg; F");
	$("#unoccupied-cool").html(data.unoccupied_cool+"&deg; F");
}

function get_setpoint(id) {
	$.ajax({
		type : "POST",
		async: false,
		url : "setpoint_changer.php",
		cache : false,
		dataType : "json",
		data : {
			id: id
		},
		success : update_setpoint,
		error: function(xhr) { console.log("AJAX request failed: " + xhr.status); }
	});
  modify_setpoint_id = id;
}

function update_setpoint(data) {
	//console.dir(data);
	$("#change-setpoint-label").html("<h5>"+data.label+": </h5>");
	$("#change-setpoint-container").html("<h5>"+data.value+"&deg; F</h5>");
  modify_setpoint_value = data.value; // MESSY! need a better way to do this
}

/************************/
/*                      */
/*        GENERIC       */
/*                      */
/************************/

function set_val_db(id,value) {
	$.ajax({
		type : "POST",
		async: false,
		url : "update.php",
		cache : false,
		dataType : "json",
		data : {
			id: id,
			value: value
		},
		success : function(xhr) { console.log("Successufully Updated DB"); },
		error: function(xhr) { console.log("AJAX request failed: " + xhr.status); }
	});
}

// Button Handler
$(function() {
    $(".therm-buttons").click(function() { 
			var id = $(this).attr("id");
			switch(id) {
				case "increase-setpoint":
					set_val_db(CURRENT_SETPOINT_ID, ++setpoint);
					get_local();
					break;
				case "decrease-setpoint":
					set_val_db(CURRENT_SETPOINT_ID, --setpoint);
					get_local();
					break;
				case "mod-setpoint-up":
          if (modify_setpoint_id != 0 && modify_setpoint_value != 0)
					  set_val_db(modify_setpoint_id, ++modify_setpoint_value);
					get_setpoint(modify_setpoint_id);
					get_settings_data();
					break;
				case "mod-setpoint-down":
          if (modify_setpoint_id != 0 && modify_setpoint_value != 0)
					  set_val_db(modify_setpoint_id, --modify_setpoint_value);
					get_setpoint(modify_setpoint_id);
					get_settings_data();
					break;
				case "occupied-night-heat":
					get_setpoint(NIGHT_OCCUPIED_HEAT_ID);
					break;
				case "occupied-day-heat":
					get_setpoint(DAY_OCCUPIED_HEAT_ID);
					break;
				case "unoccupied-heat":
					get_setpoint(UNOCCUPIED_HEAT_ID);
					break;
				case "occupied-night-cool":
					get_setpoint(NIGHT_OCCUPIED_COOL_ID);
					break;
				case "occupied-day-cool":
					get_setpoint(DAY_OCCUPIED_COOL_ID);
					break;
				case "unoccupied-cool":
					get_setpoint(UNOCCUPIED_COOL_ID);
					break;
			}
		})
});
