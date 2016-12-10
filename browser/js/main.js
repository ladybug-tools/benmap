//
// page state

var state = {
    filter: "school",
    metric: "Site EUI (kBTU/sf)"
};


//
// objects/variables that need to be accessed within functions

var style = {};
var table = {};
var olMap = {};
var vectorLayer = {};
var vectorSource = {};
var key = 'PARCEL_ID';
var types = [];
var typeKey = 'Property Type';

//
// color scale for reuse
var scale = chroma.scale(['rgba(253,216,53 ,1)', 'rgba(183,28,28 ,1)']).domain([0, 100]);

//
// we put the FUN in functions

var updateSelectors = function() {
    types.map(function(type) {
        $('#filter').append('<option value="' + type + '">' + type + '</option>');
    });
};

var updateLayers = function() {
    vectorLayer.setStyle(setStyles);
};

var updateLegend = function() {
    var svg = d3.select("svg")
        .style("max-height", "50px");
    var defs = svg.append("defs");
    var linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");
    linearGradient
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
    //Set the color for the start (0%)
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "rgba(253,216,53 ,1)");

    //Set the color for the end (100%)
    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "rgba(183,28,28 ,1)"); //dark blue
    svg.append("rect")
        .attr("width", 300)
        .attr("height", 20)
        .style("fill", "url(#linear-gradient)");
    console.log("anything?")
        // linearGradient.selectAll("stop")
}


var handleData = function(values) {

    var localData = table;

    // values is an array:
    // [0] csv  file string
    // [1] json file string
    var csvRaw = values.shift();
    var rows = Papa.parse(csvRaw, {
        header: true
    }).data;
    var json = values.shift();
    if (typeof json == "string") {
        json = JSON.parse(json);
    }

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

    updateSelectors();

    json.features.map(function(feature) {
            setStyles(feature);
        })
        // console.log(style);
        // debugger;

    vectorSource = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(json)
    });

    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: styleFunction,
        projection: 'EPSG:4326'
    });
    // debugger;

    olMap.addLayer(vectorLayer);
};

var setStyles = function(feature) {

    // get feature ID
    var id;
    if (feature.properties) {
        id = feature.properties[key];
    } else if (feature.T) {
        id = feature.T[key];
    }

    // get row from table table by ID
    var row = {};
    if (table[id]) {
        row = table[id];
    } else {
        // console.log('row does not exist');
        row[state.metric] = 0;
    }

    // logic here for filter (set alpha to 0 if not pass filter?)
    var featureFilter = row[typeKey];
    // console.log(featureFilter);
    var alphaStroke = 0;
    var alphaFill = 0;
    if (featureFilter == state.filter) {
        console.log('we got a ' + state.filter);
        alphaStroke = 1;
        alphaFill = 0.8;
    }

    // get value from row
    var value = row[state.metric];

    // build color
    // console.log(value, scale(value).rgb());
    // debugger;
    scale = chroma.scale(['rgba(253,216,53 ,1)', 'rgba(183,28,28 ,1)']).domain([0, 200]);

    var color = scale(value).rgb();
    // console.log(value, color);
    // var alpha = scale(value).alpha();

    var rgba = "rgba(" + color[0].toFixed(0) + "," + color[1].toFixed(0) + "," + color[2].toFixed(0);
    var rgbaStroke = rgba + "," + alphaStroke + ")";
    var rgbaFill = rgba + "," + alphaFill + ")";

    return style[id] = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: rgbaStroke,
            width: 2
        }),
        fill: new ol.style.Fill({
            color: rgbaFill
        })
    })

};

var styleFunction = function(feature) {
    //console.log("in function prop", feature.getProperties());
    // debugger;
    return style[feature.getProperties()["PARCEL_ID"]];
}

function legendDemo() {

    sampleNumerical = [1, 2.5, 5, 10, 20];
    sampleThreshold = d3.scale.threshold()
        .domain(sampleNumerical)
        .range(colorbrewer.Reds[5]);
    horizontalLegend = d3.svg.legend()
        .units("EUI")
        .cellWidth(80)
        .cellHeight(25)
        .inputScale(sampleThreshold)
        .cellStepping(100);

    d3.select("svg")
        .append("g")
        .attr("transform", "translate(50,30)").attr("class", "legend").call(horizontalLegend);

}

//
// jQuery page listeners

$(document).on('change', '#metric', function(e) {
    state.metric = $(e.target).val();
    updateLayers();
});
$(document).on('change', '#filter', function(e) {
    state.filter = $(e.target).val();
    updateLayers();
});


//
// init on page ready

$(document).ready(function() {
    olMap = new ol.Map({
        layers: [
            new ol.layer.Tile({
                source: new ol.source.Stamen({
                    layer: "toner-lite"
                })
            })
        ],
        // overlays: [overlay],
        target: 'map',
        controls: ol.control.defaults({
            attributionOptions: {
                collapsible: false
            }
        }),
        view: new ol.View({
            //center: ol.proj.fromLonLat([-71.087955, 42.343583]),
            center: [-71.087955, 42.343583],
            zoom: 13,
            projection: 'EPSG:4326'
        })
    });
    // legendDemo();
    updateLegend();

    // handle data retrieved via ajax
    Promise.all(['./data.csv', "./geometry.geojson"].map($.get)).then(handleData);

    olMap.on('click', function(evt) {
        console.log("map Click event fired");
        olMap.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
            // get feature ID
            var id;
            if (feature.properties) {
                id = feature.properties[key];
            } else if (feature.T) {
                id = feature.T[key];
            }
            console.log("id", id);
            // get row from table table by ID
            var row = {};
            if (table[id]) {
                row = table[id];
                //find the way to bind the front end?
                console.log("rows", row);

                document.getElementById("name").innerHTML = row["Property Name"];
                document.getElementById("address").innerHTML = row["Address"];
                document.getElementById("siteEUI").innerHTML = row["Site EUI (kBTU/sf)"];
                document.getElementById("sourceEUI").innerHTML = row["Source EUI (kBTU/sf)"];
                document.getElementById("GHGIntensity").innerHTML = row["GHG Intensity (kgCO2/sf)"];
                document.getElementById("EnergyStar").innerHTML = row["Energy Star Score"];
                document.getElementById("waterIntensity").innerHTML = row["Water Intensity (gal/sf)"];
                document.getElementById("distanceTo2030").innerHTML = "TODO";
                document.getElementById("totalSite").innerHTML = row[" Total Site Energy (kBTU) "];
                document.getElementById("totalSource").innerHTML = row["Total Source Energy (kBTU)"];
                document.getElementById("GHGEmissions").innerHTML = row["GHG Emissions (MTCO2e)"];


            }

        })

    })


})
