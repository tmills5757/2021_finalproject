//declare basemap variable in global scope
var basemap;
//create map
function createMap(){
  const basemap = L.map('basemap').setView([43.0731, -89.4012], 12);
  L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(basemap);
  const search = new GeoSearch.GeoSearchControl({
    provider: new GeoSearch.OpenStreetMapProvider(),
    showMarker: false,
    showPopup: false,
    retainZoomLevel: true, 
    animateZoom: false,
    autoClose: false,
    searchLabel: 'Enter Search Address',
    keepResult: false,
});
basemap.addControl(search);
 
};

$(document).ready(createMap);

