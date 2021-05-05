//declare basemap variable in global scope
var basemap;
var pointLayer;
var routeAttr = {}; //route attributes
var routeFeat; //complete list of all the route GeoJSON features
var routeGeoJSON;
var searchOne;
var searchTwo;
//create map
function createMap(){

    basemap = L.map('basemap', {zoomControl: false}).setView([43.0731, -89.4012], 12); 
    //centered around coordinates of Madison
    new L.Control.Zoom({ position: 'bottomleft' }).addTo(basemap);

    //add OSM base tilelayer
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {

    maxZoom: 19,

    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'

    }).addTo(basemap);

    //call getData function

    getData(basemap);

    search();

};
//function to create a title for the map
function createGeosearch(){

    var PanelControl = L.Control.extend({

        options: {//declares position of the legend searcher

            position: 'topleft'
        },
        onAdd: function () {

            // create the control searcher with a particular class name
            var searcher = L.DomUtil.create('div', 'geosearch-control-container');
            //Add title in the box
            $(searcher).append('<div class="helpIndicator">Add start and end destination markers to the map by searching for them in the search bar above. Then click the nearest button to find a bus route for this trip.</div>');
            
            $(searcher).append('<div class="searchResults">Search Results</div>');

            $(searcher).append('<div class="searchResults2">Search Results</div>');

            $(searcher).append('<button class="nearest" id="nearest">Nearest</button>');

            $(searcher).append('<button class="clearMarkers" id="clearMarkers">Clear</button>');

            

            return searcher;
        }
    });
    //adds previously created variable to the map
    basemap.addControl(new PanelControl());

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

    basemap.on('geosearch/showlocation', function (result) {

    pos = result.location.x

    pos2 = result.location.y

    L.marker([pos2, pos]).addTo(basemap);

    nearestNeighbor();
    removeMarkers();

    });



}


function nearestNeighbor(){

    $('.nearest').click(function(){
    latlngs = [];

    basemap.eachLayer(function (layer) {

    if (layer instanceof L.Marker){

        //var car = layer.getLatLng();

        latlngs.push(layer.getLatLng());

        
        }
    });

    determineRoutes(latlngs);

    });
}



function determineRoutes(latlngs){

    closestStop = [];
    routeList = []; //returns combined list of routes served by each bus stop

    pos = latlngs[0]['lat'];

    pos2 = latlngs[0]['lng'];

    var res = leafletKnn(pointLayer).nearest(

                [pos2, pos], 5);

            if (res.length) {
                $(".searchResults").html('Closest Stop to You is ' + res[0].layer.feature.properties.stop_name);
                closestStop.push(res[0].layer.feature.properties.stop_name);
                var routes = res[0].layer.feature.properties.Route.split(", ");
                for (let i = 0; i < routes.length; i++) {
                    routeList.push(routes[i]);
                }
                basemap.setView(res[0].layer.getLatLng(), 100);
            
            } 

            else {

                document.getElementById('geosearch-control-container').innerHTML = 'You aren\'t in Madison';
            }
    
    pos21 = latlngs[1]['lat'];

    pos22 = latlngs[1]['lng'];
    var res = leafletKnn(pointLayer).nearest(


                [pos22, pos21], 5);

            if (res.length) {
                
                $(".searchResults2").html('Closest Stop to You is ' + res[0].layer.feature.properties.stop_name);
                closestStop.push(res[0].layer.feature.properties.stop_name);
                var routes = res[0].layer.feature.properties.Route.split(", ");
                for (let i = 0; i < routes.length; i++) {
                    routeList.push(routes[i]);
                }
                basemap.setView(res[0].layer.getLatLng(), 100);

            } 

            else {

                document.getElementById('geosearch-control-container').innerHTML = 'You aren\'t in Madison';
            }


    filterRoutes(routeList);
}

function removeMarkers(){

    $('.clearMarkers').click(function(){

        basemap.eachLayer(function (layer) {

        if (layer instanceof L.Marker){

            //var car = layer.getLatLng();

            basemap.removeLayer(layer);
            
            }
        });

    });

}


function filterRoutes(routeList){
    removeRouteFeatures();

    for (i in routeList) {
        
        route = routeList[i];
        //filter bus route
        for (i in routeAttr) {
            if (route == routeAttr[i].route_name) {
                createRouteFeatures(routeFeat, routeFilter);
                function routeFilter(feature) {
                    if (feature.properties.route_shor == routeAttr[i].route_name) return true
                }
            }
        }
    }

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
            createGeosearch();

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

    var popupContent = createStopPopups(feature.properties, attribute);

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {  offset: new L.Point(0,-options.radius)    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Add circle markers for point features to the map
function addBusStops(data, attributes){

    //create a Leaflet GeoJSON layer and add it to the map
    pointLayer = L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }, filter: busStopFilter
    }).addTo(basemap);

    function busStopFilter(feature) {
        if (feature.properties.Route != "None") return true
    }
    

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

    return routeAttr, routeFeat;

};

//Add bus routes to map
function createRouteFeatures(routeFeat, filter) {

    //creates and binds popup for each feature
    function onEachFeature(feature, layer) {
        popupContent = createRoutePopups(feature.properties);
        layer.bindPopup(popupContent);
    }
    
    routeGeoJSON = L.geoJson(routeFeat, 
        {style: function(feature) {
            return {color: feature.properties.Color};
        }, onEachFeature: onEachFeature, filter: filter
    }).addTo(basemap);
    
};

function removeRouteFeatures() {
    basemap.removeLayer(routeGeoJSON);
}

function createStopPopups(properties, attribute){
    var popupContent = "<p><b>Stop name:</b> " + properties.stop_name + "</p>"; //bus stop name
    popupContent += "<p><b>Routes:</b> " + properties.Route + "</p>"; //routes serving bus stop
    return popupContent;
};

function createRoutePopups(properties, attribute) {
    var popupContent = "<p><b>Route:</b> " + properties.route_shor + "</p>"; //route number
    popupContent += "<p><b>Service:</b> " + properties.Service + "</p>"; //route service
    return popupContent;
}



/* Panel */
// 1. Add panel--Completed 4/28/21
// 2. Add buttons for bus routes and weekday, weekend, and holiday bus routes--Completed 4/30/21
// 3. Add event handlers for buttons--Completed 5/3/21
// 4. Filter out bus routes and stops outside search criteria

//Create new panel controls
function createPanelControls(attr, feat){
    var PanelControl = L.Control.extend({
        options: {//declares position of the legend container
            position: 'bottomleft'
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
                $(container).append(`<button class="route" id=${attr[i].route_name}>`
                    + `${attr[i].route_name}</button>`);
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
            removeRouteFeatures();
            //display bus stops with weekday service
            createRouteFeatures(feat, weekdayFilter);
            //routeGeoJSON = L.geoJson(feat, {filter: weekdayFilter}).addTo(basemap);
            function weekdayFilter(feature) {
            if (feature.properties.Service.indexOf("Weekday") != -1) return true
            }
        } else if ($(this).attr('id') == 'weekend'){
            removeRouteFeatures();
            //display bus stops with weekend service
            createRouteFeatures(feat, weekendFilter);
            //routeGeoJSON = L.geoJson(feat, {filter: weekendFilter}).addTo(basemap);
            function weekendFilter(feature) {
            if (feature.properties.Service.indexOf("Weekend") != -1) return true
            }
        } else if ($(this).attr('id') == 'holiday') {
            removeRouteFeatures();
            //display bus stops with holiday service
            createRouteFeatures(feat, holidayFilter);
            //routeGeoJSON = L.geoJson(feat, {filter: holidayFilter}).addTo(basemap);
            function holidayFilter(feature) {
            if (feature.properties.Service.indexOf("Holiday") != -1) return true
            }
        }


    });

    //click listener for route buttons
    $(".route").click(function() {
        removeRouteFeatures();
        for (i in attr) {
            //filter bus route
            if ($(this).attr('id') == attr[i].route_name) {
                createRouteFeatures(feat, routeFilter);
                //routeGeoJSON = L.geoJson(feat, {filter: routeFilter}).addTo(basemap);
                function routeFilter(feature) {
                    if (feature.properties.route_shor == attr[i].route_name) return true
                }
            }
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
