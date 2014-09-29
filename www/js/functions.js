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

var LOCATION = "Scott Air Force Base"
var LOCAL_REFRESH_RATE = 10000
var WEATHER_REFRESH_RATE = 60000
var setpoint = 0;

/************************/
/*                      */
/*      HOME PAGE       */
/*                      */
/************************/
$(document).on("pagebeforeshow","#home",function(){ 
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

	$("#weather-city-container").html("<h2>"+data.name+"</h2>");
	$("#weather-img-container").html("<img src='http://openweathermap.org/img/w/"+data.weather[0].icon+".png'></img>");
	$("#weather-temp-container").html("<h3>"+data.main.temp+"&deg; F</h3>");
	$("#weather-humidity-container").html("Humidity: "+data.main.humidity+" %");
	$("#weather-wind-container").html("Wind: "+data.wind.speed+" mph");
}

function update_local(data) {
	//console.dir(data);
	$("#current-temp-container").html("<h3>Indoor Temp: "+Math.floor(data.current_temp)+"&deg; F</h3>");
	$("#current-setpoint-container").html("<h3>Setpoint: "+(setpoint = data.current_setpoint)+"&deg; F</h3>");
	$("#current-mode-container").html("Mode: "+data.mode);
	
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

$(function() {
    $("#increase-setpoint").button().click(function() { 
			set_val_db(CURRENT_SETPOINT_ID, ++setpoint);
			get_local();
		})
});

$(function() {
    $("#decrease-setpoint").button().click(function() { 
			set_val_db(CURRENT_SETPOINT_ID, --setpoint);
			get_local();
		})
});

/************************/
/*                      */
/*    SETTINGS PAGE     */
/*                      */
/************************/

// Grab variables before page shows
$(document).on("pagebeforeshow","#settings",function(){ 
	$.ajax({
		type : "POST",
		async: false,
		url : "settings.php",
		cache : false,
		dataType : "json",
		success : process_response,
		error: function(xhr) { console.log("AJAX request failed: " + xhr.status); }
	});

	// Connect Update Functions
	$(".settings-form-sliders").on( 'slidestop', function( event ) { 
		var id = 0;
		if ( event.currentTarget.id == "fan-switch" ) id = FAN_ID;
		if ( event.currentTarget.id == "override-switch" ) id = OVERRIDE_ID;

		if ( id != 0 ) 
			set_val_db(id, event.currentTarget.value);
	});

	$(".settings-form-radios").bind( "change", function(event, ui) {
		set_val_db(MODE_ID, event.currentTarget.value);
	});
});

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

function process_response(data) {
	console.dir(data); // for debug
	if (data.fan == "on") $("#fan-switch").val('on').slider("refresh");
	else $("#fan-switch").val('auto').slider("refresh");

	if (data.override == "True") $("#override-switch").val('True').slider("refresh");
	else $("#override-switch").val('False').slider("refresh");

	if (data.mode == "heat") $("#mode-selector-heat").prop('checked', true).checkboxradio( "refresh" );
	else if (data.mode == "cool") $("#mode-selector-cool").prop('checked', true).checkboxradio( "refresh" );
	else $("#mode-selector-off").prop('checked', true).checkboxradio( "refresh" );
}