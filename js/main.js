//declare basemap variable in global scope
var basemap;
//create map
function createMap(){

    //create the map
    basemap = L.map('basemap', {
        center: [43.0731, -89.4012], //centered around coordinates of Madison
        zoom: 12
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {         
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(basemap);

 
};

$(document).ready(createMap);
