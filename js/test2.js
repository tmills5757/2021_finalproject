//declare basemap variable in global scope
var basemap;
var pointLayer;
//create map
function createMap(){

  /*
  //create the map
  basemap = L.map('basemap', {
    center: [43.0731, -89.4012], //centered around coordinates of Madison
    zoom: 12
  });
  */

  basemap = L.map('basemap').setView([43.0731, -89.4012], 12); //centered around coordinates of Madison

  //add OSM base tilelayer
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {         
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).addTo(basemap);

  //call getData function
  getData(basemap);

	const search = new GeoSearch.GeoSearchControl({
  	provider: new GeoSearch.OpenStreetMapProvider(),
  showPopup: false, // optional: true|false  - default false
      marker: {
        // optional: L.Marker    - default L.Icon.Default
        icon: new L.Icon.Default(),
        draggable: false,
      },
      popupFormat: ({ query, result }) => result.label, // optional: function    - default returns result label,
      resultFormat: ({ result }) => result.label, // optional: function    - default returns result label
      maxMarkers: 1, // optional: number      - default 1
      retainZoomLevel: false, // optional: true|false  - default false
      animateZoom: true, // optional: true|false  - default true
      autoClose: false, // optional: true|false  - default false
      searchLabel: 'Enter address', // optional: string      - default 'Enter address'
      keepResult: false, // optional: true|false  - default false
      updateMap: true, // optional: true|false  - default true
  });

  basemap.addControl(search);
  basemap.on('geosearch_showlocation', function (result) {
    L.marker([result.x, result.y]).addTo(map)
  });
  basemap.on('click', function(e) {
  console.log(e.latlng.lat,e.latlng.lng);
  var c = L.circle([e.latlng.lat,e.latlng.lng], {radius: 15}).addTo(basemap);

});
 
};


//Import GeoJSON data
function getData(basemap){
    //load the data
    $.ajax("data/Metro_Transit_Bus_Stops.geojson", {
        dataType: "json",
        success: function(response){
            
            //create an attributes array
            var attributes = processData(response);
            //add symbols and UI elements
            createBusStops(response, attributes);
        }
    });
};

//build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("stop_name") > -1){
            attributes.push(attribute);
        };
    };

    //check result

    return attributes;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[3];
    //check

    //create marker options
    var options = {
        fillColor: "#1f355a",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    options.radius = 3; //each bus stop marker will have a set radius of 5

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    var popupContent = createPopupContent(feature.properties, attribute);

    //bind the popup to the circle marker    
    layer.bindPopup(popupContent, {  offset: new L.Point(0,-options.radius)    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Add circle markers for point features to the map
function createBusStops(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    pointLayer = L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(basemap);
    return pointLayer;
};

function createPopupContent(properties, attribute){
    var popupContent = "<p><b>Stop name:</b> " + properties.stop_name + "</p>"; //bus stop name
    popupContent += "<p><b>Routes:</b> " + properties.Route + "</p>"; //routes serving bus stop


    return popupContent;
};

$(document).ready(createMap);


document.getElementById('me').onclick = function() {
    navigator.geolocation.getCurrentPosition(function(pos) {
        console.log(pos);
        var res = leafletKnn(pointLayer).nearest(
            [pos.coords.longitude, pos.coords.latitude], 5);
        if (res.length) {
            document.getElementById('me').innerHTML = 'Closest Stop to You is ' + res[0].layer.feature.properties.stop_name;
            basemap.setView(res[0].layer.getLatLng(), 100);
            for(i=0; i<res.length; i++) {
                basemap.addLayer(res[i].layer);
            }
        } else {
            document.getElementById('me').innerHTML = 'You aren\'t in America';
        }
    });
};