var state = {
    filter: "All",
    metric: "Site EUI (kBTU/sf)"
};


// global vars
var style = {};
var table = {};
var key = 'PARCEL_ID';
var types = [];
var typeKey = 'Property Type';
var domain = [0, 200];

// Boston
var coordsBoston = [42.3568138, -71.0524385];

// color scale for reuse
var colourScale = chroma.scale(['rgba(253,216,53 ,1)', 'rgba(183,28,28 ,1)']).domain(domain);


// -----------------------------
// parse URL
// -----------------------------

// pull in csv file
var handleData = function(values) {
    
    var localData = table;
    
    // values is an array:
    // [0] csv  file string
    // [1] json file string
    var csvRaw = values.shift();
    var rows = Papa.parse(csvRaw, {
        header: true
    }).data;
    
    //var json = values.shift();
    //if (typeof json == "string") {
    //    json = JSON.parse(json);
    //}
    
    var typeMap = {};

    for (var r in rows) {
        var row = rows[r];
        // console.log(Object.keys(row));
        if (row[key]) {
            // console.log('adding row');
            if (row[typeKey]) {
                typeMap[row[typeKey]] = true;
            }
            localData[row[key]] = row;

        }
    }

    types = Object.keys(typeMap);
};


var styleFunction = function (feature) {
    var height = 10;
    var floors = 1;

    if (feature.properties.PART_HEIGH) {
        height = feature.properties.PART_HEIGH * 0.3048;
    }

    //if (feature.properties.PART_FLOOR) {
    //    floors = feature.properties.PART_FLOOR;
    //}

    var color = colourScale(height).hex();  // default color by height

    // get row from table table by ID
    if (feature.properties.PARCEL_ID) {
        
        var id = feature.properties.PARCEL_ID;
        var row = {};
        if (table[id]) {
            row = table[id];
        } else {
            //console.log('row does not exist');
            row[state.metric] = 0;
        }

        // get value from row        
        var value = row[state.metric];

        // build color
        // console.log(value, scale(value).rgb());
        // debugger;
        scale = chroma.scale(['rgba(253,216,53 ,1)', 'rgba(183,28,28 ,1)']).domain(domain);
        color = scale(value).rgb()

    }


    return {
        color: color,
        height: height
    };
}


// -----------------------------
// start generating map
// -----------------------------
$(document).ready(function () {

    Promise.all(['https://chriswmackey.github.io/BEnMap/browser/data.csv'].map($.get)).then(handleData);

    var world = VIZI.world('world', {
        skybox: false,
        postProcessing: false
    }).setView(coordsBoston);

    // Add controls
    VIZI.Controls.orbit().addTo(world);

    // CartoDB basemap
    VIZI.imageTileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }).addTo(world);

    // Grab our Mapzen GeoJSON tile including points, linestrings and polygons
    VIZI.geoJSONLayer('./boston_buildings_subset3.json', {
        interactive: false,
        output: true,
        style: styleFunction,        
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</a>.'

    }).addTo(world);

});  // end document ready