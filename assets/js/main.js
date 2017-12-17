//
// page state

var state = {
    filter: "All",
    metric: "Site EUI (kBTU/sf)",
};

//
// objects/variables that need to be accessed within functions
var style = {};
var table = {};
var statTable = {};
var olMap = {};
var vectorLayer = {};
var vectorSource = {};
var key = 'PARCEL_ID';
var types = [];
var typeKey = 'Property Type';
var domain = [];

// other variables
var coordsBoston = [42.3568138, -71.0524385];

//
// color scale for reuse
var colorScaleList = ['rgba(0,128,0,1)', 'rgba(245,239,103,1)', 'rgba(234,123,0,1)', 'rgba(234,38,0,1)']
var reversedColorList = colorScaleList.slice().reverse()

// Building Type List.
var typeList = [
  "All",
  "Office",
  "Residential",
  "Healthcare",
  "Education",
  "Laboratory",
  "Mercantile",
  "Grocery",
  "Public Assembly",
  "Public Safety and Utilities",
  "Warehouse and Storage",
  "Industrial Plant",
]

// Dictionary of default legend boundaries.
var legBound = {
    "Site EUI (kBTU/sf)": {
      "All": [0,200],
      "Other": [0,200],
      "Education": [0,200],
      "Healthcare": [100,450],
      "Grocery": [0,300],
      "Mercantile": [0,140],
      "Office": [0,200],
      "Residential": [0,120],
      "Warehouse and Storage": [0,200],
      "Industrial Plant": [0,500],
      "Laboratory": [0,600],
    },
    "Source EUI (kBTU/sf)": {
      "All": [0,400],
      "Other": [0,400],
      "Education": [0,350],
      "Healthcare": [200,800],
      "Grocery": [0,600],
      "Mercantile": [0,280],
      "Office": [0,400],
      "Residential": [0,240],
      "Warehouse and Storage": [0,400],
      "Industrial Plant": [0,800],
      "Laboratory": [0,1000],
    },
};

//
// we put the FUN in functions

var validIdsFromString = function(unverified) {
    var splitBy = new RegExp('[^0-9]{1,}', 'i');
    //         123456780
    var pad = "000000000";
    return unverified
        .split(splitBy)
        .filter(function(i) {
            return ((i) ? true : false);
        })
        .map(function(p) {
            return pad.substring(0, pad.length - p.length) + p
        });
};

var updateSelectors = function() {
    types.sort();
    for (i = 1; i < typeList.length; i++) {
      $('#filter').append('<option value="' + typeList[i] + '">' + typeList[i] + '</option>');
    }
    types.map(function(type) {
      if (typeList.indexOf(type) < 0 && type != "Other") {
          $('#filter').append('<option value="' + type + '">' + type + '</option>');
        }
    });
    $('#filter').append('<option value="' + "Other" + '">' + "Other" + '</option>');
};

var updateLayers = function() {
    vectorLayer.setStyle(setStyles);
    updateLegend();
};

var updateLegend = function() {
    var maxWidth = 250;
    var height = 20;

    var svgContainer = d3.select("svg")
        .style("max-height", "40px")

    svgContainer.selectAll("svg > *").remove();

    var svg = svgContainer.append("g")
        .attr("transform", "translate(10, 0)")
        .attr("width", "100%");
    svg.data(domain);
    var defs = svg.append("defs");

    var linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    if (state.metric == "Energy Star Score"){
      var colorList = reversedColorList
    } else{
      var colorList = colorScaleList
    }
    //Set the color for the start (0%)
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorList[0]);

    //Set the color for 33%
    linearGradient.append("stop")
        .attr("offset", "33%")
        .attr("stop-color", colorList[1]);

    //Set the color for 66%
    linearGradient.append("stop")
        .attr("offset", "66%")
        .attr("stop-color", colorList[2]);

    //Set the color for the end (100%)
    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorList[3]);

    //Create the bar
    svg.append("rect")
        .attr("width", maxWidth)
        .attr("height", height)
        .attr("y", 5)
        .style("fill", "url(#linear-gradient)");


    //Set scale for x-axis
    var xScale = d3.scale.linear()
        .range([0, maxWidth])
        .domain([0, d3.max(domain)])
        .nice();

    //Define x-axis
    var xAxis = d3.svg.axis()
        .orient("bottom")
        .ticks(5)
        //   .tickFormat(formatPercent)
        .scale(xScale);

    //Set up X axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (20) + ")")
        .call(xAxis);

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

    rows.map(function(row) {
        if (!row[key]) {
            return;
        }
        var type = 'unknown';
        if (row[typeKey]) {
            type = row[typeKey];
            typeMap[type] = true;
        }

        var ids = validIdsFromString(row[key]);

        ids.map(function(id) {
            localData[id] = row;
            Object.keys(row).map(function(col) {
                var val = parseFloat(row[col]);
                if (isNaN(val)) {
                    return;
                }
                if (!statTable[col]) {
                    return statTable[col] = {
                        all: {
                            max: val,
                            min: val
                        },
                        byType: {}
                    };
                }
                var stat = statTable[col];

                if (val > stat.all.max) {
                    stat.all.max = val;
                }
                if (val < stat.all.min) {
                    stat.all.min = val;
                }
                if (!stat.byType[type]) {
                    stat.byType[type] = {
                        max: val,
                        min: val
                    };
                }
                if (val > stat.byType[type].max) {
                    stat.byType[type].max = val;
                }
                if (val < stat.byType[type].min) {
                    stat.byType[type].min = val;
                }
            });
        });
    });

    types = Object.keys(typeMap);

    updateSelectors();

    try {
      domain = [legBound[state.metric][state.filter][0], legBound[state.metric][state.filter][1]];
    } catch(err) {
      domain = [statTable[state.metric].all.min, statTable[state.metric].all.max];
    }

    updateLegend();

    json.features.map(function(feature) {
            setStyles(feature);
        })

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
        row[state.metric] = 0;
    }

    if (state.filter === "All") {
        alphaStroke = 1;
        alphaFill = 0.8;
    } else {
        // logic here for filter (set alpha to 0 if not pass filter?)
        var featureFilter = row[typeKey];
        var alphaStroke = 0;
        var alphaFill = 0;
        if (featureFilter == state.filter) {
            alphaStroke = 1;
            alphaFill = 0.8;
        }

    }


    // get value from row
    var value = row[state.metric];

    // build color
    scale = chroma.scale(colorScaleList).domain(domain);

    var color = scale(value).rgb();

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
    return style[feature.getProperties()["PARCEL_ID"]];
}

function create2DMap () {

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
            center: [coordsBoston[1], coordsBoston[0]],
            zoom: 13,
            projection: 'EPSG:4326'
        })
    });
}

function add2DInteraction (){
    var geocoder = new Geocoder('nominatim', {
        provider: 'osm',
        key: '__some_key__',
        lang: 'en-US', //en-US, fr-FR
        placeholder: 'Search for ...',
        limit: 5,
        autocomplete: true,
        keepOpen: true
    });

    geocoder.on('addresschosen', function(evt) {
        var feature = evt.feature,
            coord = evt.coordinate,
            address = evt.address;

        olMap.setView(new ol.View({
            center: [coord[0], coord[1]],
            zoom: 16,
            projection: 'EPSG:4326'
        }));
    });

    olMap.addControl(geocoder);

    var select = null; // ref to currently selected interaction

    // select interaction working on "click"
    var selectClick = new ol.interaction.Select({
        condition: ol.events.condition.click
    });


    var changeInteraction = function() {
        if (select !== null) {
            olMap.removeInteraction(select);
        }
        select = selectClick;
        if (select !== null) {

            olMap.addInteraction(select);
            select.on('select', function(e) {
                if (!e.selected[0]) document.getElementById("details").style.display = "none";
                else {
                    document.getElementById("details").style.display = "block";
                    var properties = e.selected[0].getProperties();
                    var id;
                    if (properties) {
                        id = properties[key];
                    } else if (e.selected[0].T) {
                        id = e.selected[0].T[key];
                    }
                    // get row from table table by ID
                    var row = {};
                    if (table[id]) {
                        row = table[id];
                        //find the way to bind the front end?
                        document.getElementById("name").innerHTML = row["Property Name"];
                        document.getElementById("address").innerHTML = row["Address"];
                        document.getElementById("siteEUI").innerHTML = row["Site EUI (kBTU/sf)"];
                        document.getElementById("sourceEUI").innerHTML = Math.round(row["Source EUI (kBTU/sf)"]* 10 ) / 10;
                        document.getElementById("GHGIntensity").innerHTML = row["GHG Intensity (kgCO2/sf)"];
                        document.getElementById("EnergyStar").innerHTML = row["Energy Star Score"];
                        document.getElementById("waterIntensity").innerHTML = row["Water Intensity (gal/sf)"];
                        document.getElementById("floorArea").innerHTML = row["Gross Area (sq ft)"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        document.getElementById("yearBuilt").innerHTML = row["Year Built"];
                        document.getElementById("propertyType").innerHTML = row["Specific Property Type"];
                        document.getElementById("propertyUses").innerHTML = row["Property Uses"];
                    }

                }

            });
        }
    };

    /**
     * onchange callback on the select element.
     */
    changeInteraction();
}





//
// jQuery page listeners

$(document).on('change', '#metric', function(e) {
    state.metric = $(e.target).val();
    try {
      domain = [legBound[state.metric][state.filter][0], legBound[state.metric][state.filter][1]];
    } catch(err) {
      if(state.filter=='All'){
        domain = [statTable[state.metric].all.min, statTable[state.metric].all.max];
      }else{
        domain = [statTable[state.metric].byType[state.filter].min, statTable[state.metric].byType[state.filter].max];
      }
    }
    if (state.metric == "Energy Star Score"){
      domain = [domain[1],domain[0]]
    }
    updateLayers();
});
$(document).on('change', '#filter', function(e) {
    state.filter = $(e.target).val();
    try {
      domain = [legBound[state.metric][state.filter][0], legBound[state.metric][state.filter][1]];
    } catch(err) {
      if(state.filter=='All'){
          domain = [statTable[state.metric].all.min, statTable[state.metric].all.max];
      }else{
          domain = [statTable[state.metric].byType[state.filter].min, statTable[state.metric].byType[state.filter].max];
      }
    }
    if (state.metric == "Energy Star Score"){
      domain = [domain[1],domain[0]]
    }
    updateLayers();
});


$(document).ready(function() {
    create2DMap();

    // handle data retrieved via ajax
    Promise.all(['./assets/data/data.csv', "./assets/data/geometry.geojson"].map($.get)).then(handleData);

    add2DInteraction();


})
