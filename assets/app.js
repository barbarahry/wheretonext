// This is where the logic for the app will go.


// TweenMax.to("#sprite-1", 4, {x:450});




var map;
var geoJSON;
var request;
var gettingData = false;
var openWeatherMapKey = "166a433c57516f51dfab1f7edaed8413"
var latStore = 50;
var longStore = -50;
var inputCity;
var email;
var password;

//   $("body").keypress(function (e) {
//   var key = e.which;
//   if(key == 13)  // the enter key code
//    {
//      $(".searchButton").click();
//      return false;  
//    }
//  });
  
// Initialize Firebase
var config = {
  apiKey: "AIzaSyCtKH56VjqALo8SeJdKZn_x-eqpSGbfcgY",
  authDomain: "travel-guide-76ea0.firebaseapp.com",
  databaseURL: "https://travel-guide-76ea0.firebaseio.com",
  projectId: "travel-guide-76ea0",
  storageBucket: "travel-guide-76ea0.appspot.com",
  messagingSenderId: "611590203730"
};
firebase.initializeApp(config);

var database = firebase.database();


$("#createAccount").on("click", function(){
  email = $("#emailInput").val();
  password = $("#passwordInput").val();
  console.log(email, password);
  // Create a new user
  firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
  });
});



// Previous user signs in
/*firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // ...
});

// User sign out
firebase.auth().signOut().then(function() {
  // Sign-out successful.
}).catch(function(error) {
  // An error happened.
});*/




$(".searchButton").on("click", function () {

//  $("#thingie").css('visibility', 'visible')
  var responseOne;
  var responseTwo;
  var responseThree;

  var inputCity = $("#destinationInput").val().trim();
  $("#food-header").html("<h4>Dining in "  + inputCity + "</h4>")
  $("#title-header").html("<h4> Weather in "  + inputCity + "</h4>")
  $("#title-header2").html("<h4>Map of "  + inputCity + "</h4>")


function initialize() {
  var mapOptions = {
    zoom: 10,
    center: new google.maps.LatLng(latStore, longStore)
  };

  map = new google.maps.Map(document.getElementById('map-canvas'),
    mapOptions);
  // Add interaction listeners to make weather requests
  google.maps.event.addListener(map, 'idle', checkIfDataRequested);

  // Sets up and populates the info window with details
  map.data.addListener('click', function (event) {
    infowindow.setContent(
      "<img src=" + event.feature.getProperty("icon") + ">"
      + "<br /><strong>" + event.feature.getProperty("city") + "</strong>"
      + "<br />" + event.feature.getProperty("temperature") + "&deg;C"
      + "<br />" + event.feature.getProperty("weather")
    );
    infowindow.setOptions({
      position: {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      },
      pixelOffset: {
        width: 0,
        height: -15
      }
    });
    infowindow.open(map);
  });
}

var checkIfDataRequested = function () {
  // Stop extra requests being sent
  while (gettingData === true) {
    request.abort();
    gettingData = false;
  }
  getCoords();
};

// Get the coordinates from the Map bounds
var getCoords = function () {
  var bounds = map.getBounds();
  var NE = bounds.getNorthEast();
  var SW = bounds.getSouthWest();
  getWeather(NE.lat(), NE.lng(), SW.lat(), SW.lng());
};

// Make the weather request
var getWeather = function (northLat, eastLng, southLat, westLng) {
  gettingData = true;
  var requestString = "https://api.openweathermap.org/data/2.5/box/city?bbox="
    + westLng + "," + northLat + "," //left top
    + eastLng + "," + southLat + "," //right bottom
    + map.getZoom()
    + "&cluster=yes&format=json"
    + "&APPID=" + openWeatherMapKey;
  request = new XMLHttpRequest();
  request.onload = proccessResults;
  request.open("get", requestString, true);
  request.send();
};

// Take the JSON results and proccess them
var proccessResults = function () {
  console.log(this);
  var results = JSON.parse(this.responseText);
  if (results.list.length > 0) {
    resetData();
    for (var i = 0; i < results.list.length; i++) {
      geoJSON.features.push(jsonToGeoJson(results.list[i]));
    }
    drawIcons(geoJSON);
  }
};

var infowindow = new google.maps.InfoWindow();

// For each result that comes back, convert the data to geoJSON
var jsonToGeoJson = function (weatherItem) {
  var feature = {
    type: "Feature",
    properties: {
      city: weatherItem.name,
      weather: weatherItem.weather[0].main,
      temperature: weatherItem.main.temp,
      min: weatherItem.main.temp_min,
      max: weatherItem.main.temp_max,
      humidity: weatherItem.main.humidity,
      pressure: weatherItem.main.pressure,
      windSpeed: weatherItem.wind.speed,
      windDegrees: weatherItem.wind.deg,
      windGust: weatherItem.wind.gust,
      icon: "https://openweathermap.org/img/w/"
        + weatherItem.weather[0].icon + ".png",
      coordinates: [weatherItem.coord.Lon, weatherItem.coord.Lat]
    },
    geometry: {
      type: "Point",
      coordinates: [weatherItem.coord.Lon, weatherItem.coord.Lat]
    }
  };
  // Set the custom marker icon
  map.data.setStyle(function (feature) {
    return {
      icon: {
        url: feature.getProperty('icon'),
        anchor: new google.maps.Point(25, 25)
      }
    };
  });

  // returns object
  return feature;
};

// Add the markers to the map
var drawIcons = function (weather) {
  map.data.addGeoJson(geoJSON);
  // Set the flag to finished
  gettingData = false;
};

// Clear data layer and geoJSON
var resetData = function () {
  geoJSON = {
    type: "FeatureCollection",
    features: []
  };
  map.data.forEach(function (feature) {
    map.data.remove(feature);
  });
};

google.maps.event.addDomListener(window, 'load', initialize);



  // First AJAX call takes city from destinationInput...
  $.ajax({
    url: "https://developers.zomato.com/api/v2.1/cities?q=" + inputCity + "",
    dataType: 'json',
    async: true,
    method: "GET",
    beforeSend: function (xhr) {
      xhr.setRequestHeader('user-key',
        '7d25b115751c62f6d4e261ce9c0a2bc0');
    },  // This inserts the api key into the HTTP header
    success: function (response) { console.log(response) }
  }).then(function (response) {
    responseOne = response;
    // Finds city ID in JSON and stores it in a variable...
    var cityId = response.location_suggestions[0].id;

    // Second AJAX call uses search function in Zomato by city ID, sorts by rating, highest to lowest...
    $.ajax({
      url: "https://developers.zomato.com/api/v2.1/search?entity_id=" + cityId + "&entity_type=city&sort=rating",
      dataType: 'json',
      async: true,
      method: "GET",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('user-key',
          '7d25b115751c62f6d4e261ce9c0a2bc0');
      },  // This inserts the api key into the HTTP header
      success: function (response) { console.log(response) }
    }).then(function (response) {
      responseTwo = response;
      // clear before printing new search
      $("#food-info").empty();

      // lists all entries found (this can be bad if it's alot so I maxed it at 20)
      for (var i = 0; i < response.restaurants.length || i < 10; i++) {
        $("#food-info").addClass("card-body","col-sm-6");
        $("#food-info").append("<h5><a href='" + response.restaurants[i].restaurant.url + "'>" + response.restaurants[i].restaurant.name + "</a></h5>");
        $("#food-info").append("<p>Cusines: <span>" + response.restaurants[i].restaurant.cuisines + "</span></p>");
        $("#food-info").append("<p>Rating: <span>" + response.restaurants[i].restaurant.user_rating.aggregate_rating + "</span></p>");
        $("#food-info").append("<p>Address: <span>" + response.restaurants[i].restaurant.location.address + "</span></p>");
        $("#food-info").append("<hr>");
       

      }

    }).then(function(response){

// Weather API call
var APIweather = "&APPID=166a433c57516f51dfab1f7edaed8413";
$.ajax({
  url: "https://api.openweathermap.org/data/2.5/weather?q=" + inputCity + APIweather,
  dataType: 'json',
  async: true,
  method: "GET"

}).then(function (response) {
  console.log(response)
  responseThree = response;
  latStore = response.coord.lat;
  longStore = response.coord.lon;
  // 9/5(K - 273) + 32 convert farenheight to Kelvin.
  var K_temp = response.main.temp;
  var F_temp = (9 * (K_temp - 273.15) / 5 + 32).toFixed(1);

  $("#city").html("<h4>" + response.name + " Weather Details</h4><hr>");
  $("#wind").text("Wind Speed: " + response.wind.speed + " mph");
  $("#humidity").text("Humidity: " + response.main.humidity + " %");
  $("#temp").text("Temperature: " + F_temp + " °F");
  $("#weather").text((response.weather[0].description).toUpperCase());
 
  


  initialize();
  console.log(responseOne)

  // Firebase object...
  var newCity = {
    inputCity: inputCity,
    responseOne: JSON.stringify(responseOne),
    responseTwo: JSON.stringify(responseTwo),
    responseThree: JSON.stringify(responseThree)

  };

  database.ref().push(newCity);
  console.log("DATABASE")
  console.log(newCity);
});






    })




  });

  





});

