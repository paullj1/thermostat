/**********************************/
/*                                */
/* Copyright (c) Paul Jordan 2013 */
/* paullj1@gmail.com              */
/*                                */
/**********************************/

// Constants
var LOCAL_REFRESH_RATE = 10000
var WEATHER_REFRESH_RATE = 60000
var SETTINGS_REFRESH_RATE = 10000
var setpoint = 0;
var modify_setpoint_id = 0;
var modify_setpoint_value = 0;

/************************/
/*                      */
/*      HOME PAGE       */
/*                      */
/************************/
$(document).ready(function() {
	get_data();

	// Connect Update Functions
	$(".settings-form-sliders").bind( 'click', function( event ) { 
		var id = 0;
		var value = '';
		if ( event.currentTarget.id == "fan-switch" ) {
			id = document.FAN_ID;
			value = event.currentTarget.checked ? 'on' : 'auto';
		}

		if ( event.currentTarget.id == "override-switch" ) {
			id = document.OVERRIDE_ID;
			value = event.currentTarget.checked ? 'True' : 'False';
		}

		if ( id != 0 && value != '')  {
			set_val_db(id, value);
			get_data();	
		}
	});

	$(".settings-form-radios").bind( "click", function(event) {
		//console.dir(event); // for debug
		set_val_db(document.MODE_ID, event.currentTarget.value);
		get_data();
	});

});

function get_data() {
	get_weather();
	get_local();
	get_settings();
}

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
			q: document.LOCATION,
			APPID: document.APIKEY,
			units: "imperial"
		},
		success : update_weather,
		error: function(xhr) { console.log("AJAX request failed: " + xhr.status); }
	});

	// Update info regularly
	setTimeout(get_weather, WEATHER_REFRESH_RATE);
}

function get_settings() {
	$.ajax({
		type : "POST",
		async: false,
		url : "settings.php",
		cache : false,
		dataType : "json",
		success : update_settings,
		error: function(xhr) { console.log("AJAX request failed: " + xhr.status); }
	});

	// Update info regularly
	setTimeout(get_settings, SETTINGS_REFRESH_RATE);
}

function update_weather(data) {
	//console.dir(data);

	$("#weather-city-container").html(data.name);
	$("#weather-img-container").html("<img src='http://openweathermap.org/img/w/"+data.weather[0].icon+".png'></img>");
	$("#weather-temp-container").html("<h5>"+data.main.temp+"º F</h5>");
	$("#weather-humidity-container").html("Humidity: "+data.main.humidity+" %");
	$("#weather-wind-container").html("Wind: "+data.wind.speed+" mph");
}

function update_local(data) {
	//console.dir(data);
	$("#current-temp-container").text(Math.floor(data.current_temp));
	$("#current-setpoint-container").text((setpoint = data.current_setpoint));

	var text_color = 'black-text';
	var text = 'Off';
	if (data.mode == 'heat') {
		text_color = 'red-text';
		text = 'Heat';
	} else if (data.mode == 'cool') {
		text_color = 'blue-text';
		text = 'Cool';
	}
		
	$("#current-mode-container").html('<span class="'+text_color+'">'+text+'</span>');
	
	var light = ( data.occupied == "True" ) ? 'on' : 'off';
	$("#occupied-status-container").html("Occupied: <img style='vertical-align:middle' src='images/"+light+".png'></img>");

	light = ( data.heat_status == "on" ) ? 'on' : 'off';
	$("#heat-status-container").html("Heat: <img style='vertical-align:middle' src='images/"+light+".png'></img>");

	light = ( data.cool_status == "on" ) ? 'on' : 'off';
	$("#cool-status-container").html("Cool: <img style='vertical-align:middle' src='images/"+light+".png'></img>");

	light = ( data.fan_status == "on" ) ? 'on' : 'off';
	$("#fan-status-container").html("Fan: <img style='vertical-align:middle' src='images/"+light+".png'></img>");

}

function update_settings(data) {
	//console.dir(data); // for debug
	if (data.fan == "on") $("#fan-switch").prop("checked", true);
	else $("#fan-switch").prop("checked", false);

	if (data.override == "True") {
		$("#presence-mode").hide(100);
		$("#current-setpoint-changer").show(100);
		$("#override-switch").prop("checked", true);
	} else {
		$("#current-setpoint-changer").hide(100, function() { $("#presence-mode").show(); });
		$("#override-switch").prop("checked", false);
	}

	$("#mode-selector-heat").removeClass('btn').removeClass('btn-flat');
	$("#mode-selector-cool").removeClass('btn').removeClass('btn-flat');
	$("#mode-selector-off").removeClass('btn').removeClass('btn-flat');

	if (data.mode == "heat") {
		$("#mode-selector-heat").addClass('btn')
		$("#mode-selector-cool").addClass('btn-flat')
		$("#mode-selector-off").addClass('btn-flat')
	} else if (data.mode == "cool") {
		$("#mode-selector-heat").addClass('btn-flat')
		$("#mode-selector-cool").addClass('btn')
		$("#mode-selector-off").addClass('btn-flat')
	} else { // OFF
		$("#mode-selector-heat").addClass('btn-flat')
		$("#mode-selector-cool").addClass('btn-flat')
		$("#mode-selector-off").addClass('btn')
	}

	$("#occupied-day-heat").text(data.day_occupied_heat+"º");
	$("#occupied-night-heat").text(data.night_occupied_heat+"º");
	$("#unoccupied-heat").text(data.unoccupied_heat+"º");
	$("#occupied-day-cool").text(data.day_occupied_cool+"º");
	$("#occupied-night-cool").text(data.night_occupied_cool+"º");
	$("#unoccupied-cool").text(data.unoccupied_cool+"º");

	if ( !$("#ip-addresses").is(":focus") )
		$("#ip-addresses").val(data.ip_addresses);
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
	$("#change-setpoint-container").html("<h5>"+data.value+"º F</h5>");
  modify_setpoint_value = data.value; // MESSY! need a better way to do this
}

function save_ip_addresses() {
	addresses = $("#ip-addresses").val()
	set_val_db(document.IP_ADDRESSES, addresses)
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
		success : (id == document.IP_ADDRESSES) ? db_update_ip : db_update_success,
		error: function(xhr) { console.log("AJAX request failed: " + xhr.status); }
	});
}

function db_update_success() {
	console.log("Successufully Updated DB");
}

function db_update_ip() {
	alert("Successfully Updated MAC Addresses");
}

// Button Handler
$(function() {
    $(".therm-buttons").click(function() { 
			var id = $(this).attr("id");
			switch(id) {
				case "increase-setpoint":
					set_val_db(document.CURRENT_SETPOINT_ID, ++setpoint);
					get_data();
					break;
				case "decrease-setpoint":
					set_val_db(document.CURRENT_SETPOINT_ID, --setpoint);
					get_data();
					break;
				case "mod-setpoint-up":
          if (modify_setpoint_id != 0 && modify_setpoint_value != 0)
					  set_val_db(modify_setpoint_id, ++modify_setpoint_value);
					get_setpoint(modify_setpoint_id);
					get_data();
					break;
				case "mod-setpoint-down":
          if (modify_setpoint_id != 0 && modify_setpoint_value != 0)
					  set_val_db(modify_setpoint_id, --modify_setpoint_value);
					get_setpoint(modify_setpoint_id);
					get_data();
					break;
				case "occupied-night-heat":
					get_setpoint(document.NIGHT_OCCUPIED_HEAT_ID);
					break;
				case "occupied-day-heat":
					get_setpoint(document.DAY_OCCUPIED_HEAT_ID);
					break;
				case "unoccupied-heat":
					get_setpoint(document.UNOCCUPIED_HEAT_ID);
					break;
				case "occupied-night-cool":
					get_setpoint(document.NIGHT_OCCUPIED_COOL_ID);
					break;
				case "occupied-day-cool":
					get_setpoint(document.DAY_OCCUPIED_COOL_ID);
					break;
				case "unoccupied-cool":
					get_setpoint(document.UNOCCUPIED_COOL_ID);
					break;
			}
		})
});