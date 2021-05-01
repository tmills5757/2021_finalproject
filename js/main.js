//declare basemap variable in global scope
var basemap;
var pointLayer;
var routeAttr = {}; //route attributes
var routeFeat; //route features
var routeGeoJSON;
//create map
function createMap(){

    basemap = L.map('basemap', {zoomControl: false}).setView([43.0731, -89.4012], 12); //centered around coordinates of Madison
    new L.Control.Zoom({ position: 'bottomleft' }).addTo(basemap);

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(basemap);
    //call getData function
    getData(basemap);
    search();
    search2();
};
function search(){
    const search = new GeoSearch.GeoSearchControl({
        provider: new GeoSearch.OpenStreetMapProvider(),
        // style: 'bar',
        showMarker: false,
        showPopup: false,
        retainZoomLevel: true,
        animateZoom: true,
        autoClose: false,
        searchLabel: 'Enter Starting Address',
        keepResult: false,
    });

  basemap.addControl(search);
  //basemap.on('geosearch/showlocation', function (result) {
    //L.marker([result.location.x, result.location.y]).addTo(basemap)
    //});
  basemap.on('geosearch/showlocation', function (result) {
    pos = result.location.x
    pos2 = result.location.y
    var res = leafletKnn(pointLayer).nearest(
            [pos, pos2], 5);
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
}

function search2(){
    const search2 = new GeoSearch.GeoSearchControl({
        provider: new GeoSearch.OpenStreetMapProvider(),
        // style: 'bar',
        showMarker: false,
        showPopup: false,
        retainZoomLevel: true,
        animateZoom: true,
        autoClose: false,
        searchLabel: 'Enter Final Destination Address',
        keepResult: false,
    });

  basemap.addControl(search2);
  //basemap.on('geosearch/showlocation', function (result) {
    //L.marker([result.location.x, result.location.y]).addTo(basemap)
    //});
  basemap.on('geosearch/showlocation', function (result) {
    pos = result.location.x
    pos2 = result.location.y
    var res = leafletKnn(pointLayer).nearest(
            [pos, pos2], 5);
        if (res.length) {
            document.getElementById('me2').innerHTML = 'Closest Stop to You is ' + res[0].layer.feature.properties.stop_name;
            basemap.setView(res[0].layer.getLatLng(), 100);
            for(i=0; i<res.length; i++) {
                basemap.addLayer(res[i].layer);
            }
        } else {
            document.getElementById('me2').innerHTML = 'You aren\'t in America';
        }
    });
}


//Import GeoJSON data
function getData(basemap){
    //load the data
    $.ajax("data/Metro_Transit_Bus_Stops.geojson", {
        dataType: "json",
        success: function(response){

            //create an attributes array
            var attributes = processStopData(response);
            //add symbols and UI elements
            addBusStops(response, attributes);
            parseRoutes(response);
            createTitle();
            createInfo();
            createPop();

            $.ajax("data/Metro_Transit_Bus_Routes.geojson", {
                dataType: "json",
                success: function(response){
                    //create an attributes array
                    var attributes = processRouteData(response);
                    routeAttr, routeFeat = createBusRoutes(response);
                    createPanelControls(routeAttr, routeFeat);
                    //add symbols and UI elements
                    createRouteFeatures(routeFeat);
                }
            });
        }
    });

};



//build an attributes array from the data
function processRouteData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with route values
        if (attribute.indexOf("route_shor") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};

//build an attributes array from the data
function processStopData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with stop names
        if (attribute.indexOf("stop_name") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};

//parse routes serving each bus stop
function parseRoutes(data) {
    var busStops = []; //create new array holding all the bus stops
    var servedRoutes; //create new array for routes serving each bus stop

    for (i in data.features) {
        var stop = data.features[i];
        servedRoutes = [];
        var routes = stop.properties.Route.split(", "); //splits string into multiple routes
        servedRoutes.push(routes);
        busStops.push(servedRoutes);
    }

    return busStops;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];

    //create marker options
    var options = {
        fillColor: "#fff",
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
function addBusStops(data, attributes){

    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(basemap);

};

function createBusRoutes(data){
    //blank objects to store bus route data
    routeAttr = {};
    routeFeat = data.features;

    for (i in data.features) {
        var route = data.features[i];

        var service = route.properties.Service.split(", ");
        
        var routeData = {
            route_name: route.properties.route_shor,
            service: service,
            color: route.properties.Color
        };
        routeAttr[i] = routeData;
    };

    //console.log(routeFeat);
    return routeAttr, routeFeat;

};

//Add bus routes to map
function createRouteFeatures(features) {
    routeGeoJSON = L.geoJson(features);
    routeGeoJSON.addTo(basemap);

    /*
    for (i in features) {
        var route = features[i];
        var style = {
            color: route.properties.Color,
            weight: 2,
            opacity: 1
        };

        //create a Leaflet GeoJSON layer and add it to the map
        L.geoJson(route, {style: style}).addTo(basemap); //adds each route as a separate layer

    };
    */
    
};

function removeRouteFeatures() {
    basemap.removeLayer(routeGeoJSON);
}

function createPopupContent(properties, attribute){
    var popupContent = "<p><b>Stop name:</b> " + properties.stop_name + "</p>"; //bus stop name
    popupContent += "<p><b>Routes:</b> " + properties.Route + "</p>"; //routes serving bus stop


    return popupContent;
};

/* Panel */
// 1. Add panel--Completed 4/28/21
// 2. Add buttons for bus routes and weekday, weekend, and holiday bus routes--Completed 4/30/21
// 3. Add event handlers for buttons
// 4. Filter out bus routes and stops outside search criteria

//Create new panel controls
function createPanelControls(attr, feat){
    var PanelControl = L.Control.extend({
        options: {//declares position of the legend container
            position: 'topleft'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'panel-control-container');

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            $(container).append('<button class="service" id="weekday">Weekday</button>');
            $(container).append('<button class="service" id="weekend">Weekend</button>');
            $(container).append('<button class="service" id="holiday">Holiday</button>');

            for (i in attr) {
                $(container).append(`<button class="route">${attr[i].route_name}</button>`);
                //try to make route buttons different colors
            }
            

            return container;
        }

    });

    basemap.addControl(new PanelControl());    // add listeners after adding control

    //click listener for service buttons
    $('.service').click(function(){

        //filter bus routes by service type
        if ($(this).attr('id') == 'weekday'){
            //display bus stops with weekday service
            removeRouteFeatures();
            
            routeGeoJSON = L.geoJson(feat, {filter: weekdayFilter}).addTo(basemap);
            function weekdayFilter(feature) {
                //console.log(feature);
            if (feature.properties.Service.indexOf("Weekday") != -1) return true
            }
            
            console.log("Weekday");
        } else if ($(this).attr('id') == 'weekend'){
            //display bus stops with weekend service
            removeRouteFeatures();
            
            routeGeoJSON = L.geoJson(feat, {filter: weekendFilter}).addTo(basemap);
            function weekendFilter(feature) {
                //console.log(feature);
            if (feature.properties.Service.indexOf("Weekend") != -1) return true
            }
            console.log("Weekend");
        } else if ($(this).attr('id') == 'holiday') {
            //display bus stops with holiday service

            removeRouteFeatures();
            
            routeGeoJSON = L.geoJson(feat, {filter: holidayFilter}).addTo(basemap);
            function holidayFilter(feature) {
                //console.log(feature);
            if (feature.properties.Service.indexOf("Holiday") != -1) return true
            }
            console.log("Holiday");
        }


    });

};

//function to create a title for the map
function createTitle(){

    var PanelControl = L.Control.extend({
        options: {//declares position of the legend container
            position: 'topright'
        },
        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'title-control-container');
            //Add title in the box
            $(container).append('<div class="temporalLegend">Madison Bus Finder</div>');

            return container;
        }
    });
    //adds previously created variable to the map
    basemap.addControl(new PanelControl());

};


//function to show how to use the map
function createInfo(){

    var PanelControl = L.Control.extend({
        options: {//declares position of the legend container
            position: 'topright'
        },

        onAdd: function () {

            var container = L.DomUtil.create('div', 'infor-control-container');
            //Add words on how to use the map
            $(container).append('<div class="temporalLegend">Click on the desired bus route for weekdays, weekend, or holiday.<br>Click on a bus stop along the roads to view the bus schedule and destinations near the stop.<br>Alternatively, search for a destination using the search bar to view bus stops and routes near the destination.</div>');

            return container;
        }
    });
    //adds previously created variable to the map
    basemap.addControl(new PanelControl());

};

//function to show what the map provides
function createPop(){

    var PanelControl = L.Control.extend({
        options: {//declares position of the legend container
            position: 'bottomright'
        },

        onAdd: function () {

            var container = L.DomUtil.create('div', 'pop-control-container');
            //Add information of the map
            $(container).append('<div class="temporalLegend">1. Madison bus line routes and schedules, and locations of bus stops on each route.<br>2. Locations of grocery stores, hospitals, primary care, and social service centers.</div>');

            return container;
        }
    });
    //adds previously created variable to the map
    basemap.addControl(new PanelControl());

};


$(document).ready(createMap);
