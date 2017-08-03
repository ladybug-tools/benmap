//
// page state

var state = {
    filter: "All",
    metric: "Site EUI (kBtu/ft^2)", // change to 'Site EUI (kBtu/ft^2)' and fix that problem of onload doing the old shiz 
    view: "2D", 
    key: "PARCEL_ID"
};


//
// global variables that need to be accessed within functions

var style = {};
    table = {};
    statTable = {};
    olMap = {};
    typeKey = 'General Property Type';
    vectorLayer = {};
    vectorSource = {};
    types = [];
    domain = [];
    key = state.key; // (Alex): I need to make it possible to change the key depending on city but the variable has to be global so I added a section to the state object! 

//
// initial load  
var coordsBoston = [42.3568138, -71.0524385];


//
// color scale for reuse
var scale = chroma.scale(['rgb(0, 255, 0)', 'rgb(255,0,0)']).domain(domain); //red, green
//
// we put the FUN in functions

var validIdsFromString = function(unverified) { //padding for PARCEL_ID matching for handleBostonData
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

//visual updates

var updateSelectors = function() { //populates filter dropdown menu with the types of buildings 
    types.sort(); // (Alex): when I originally handled each city, updateSelectors() was called each time which doubled the dropdown on each location change 
    // (Alex): original had var typekey set to "Property Type" so that table of types set to true was way too many and dropdown menu was too extensive, fix: changed variable to "General Property Type"
    types.map(function(type) {
        $('#filter').append('<option value="' + type + '">' + type + '</option>');
    });
};

var updateLayers = function(key) { // (Alex): original function didn't take input, needed to pass in state.metric to fix the legend specific to each measurement
    vectorLayer.setStyle(setStyles); //(Alex): recalibrates layer to colors, called on event change
    updateLegend(key);
};

var updateLegend = function(key) {

    console.log("In update legend", domain);

    var maxWidth = 250;
    var height = 20;

    var svgContainer = d3.select("svg")
        .style("max-height", "40px")

    svgContainer.selectAll("svg > *").remove();

    var svg = svgContainer.append("g")
        .attr("transform", "translate(10, 0)")
        .attr("width", "100%");
    
    svg.data(domain);

    var color = d3.scale.linear()
        .domain([0,25,50, 75,100])
        .range(["#00ff00", "#fff600","#fff600", "#ff9e00", "#ff0000"])
        .interpolate(d3.interpolateHcl); 

    
    svg.append("defs")
        .append("linearGradient")
        .attr("id", "linear-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .selectAll("stop")
        .data(color.range())
        .enter()
        .append("stop")
        .attr("offset", function(d,i) {
            return i/(color.range().length-1);
        })
        .attr("stop-color", function(d) {
            return d;
        });

    //Create the bar
    svg.append("rect")
        .attr("class", "legendRect")
        .attr("y", -25)
        .attr("width", maxWidth)
        // .attr("max-width", maxWidth)
        .attr("height", height)
        .attr("y", 5)
        .style("fill", "url(#linear-gradient)"); 

    //Set scale for x-axis
    var xScale = d3.scale.linear()
        .range([0, maxWidth])
        .domain([0, d3.max(domain)]) //5 values, parse and match values, set tick value to series of ranges --> d3 axis range ticks
        .nice();

    var regular = d3.format("s"); 
    var test = d3.format(".3n");
    var twoafter = d3.format(".2n");
    var ifdec = d3.format("");
    var perc = d3.format(",%");

    var units = [" (kBtu/sf)", " (kgCO2/sf)", "%", " (gal/sf)", " (kBtu)", " (MtCO2e)"];


    //Define x-axis
    var xAxis = d3.svg.axis()
        .orient("bottom")
        .tickValues([parseFloat(d3.min(domain)).toFixed(0), parseFloat((d3.max(domain)/2)).toFixed(0), parseFloat(d3.max(domain)).toFixed(0)])
        .tickFormat(function(d) {
            switch (key) {
                case 'Site EUI (kBtu/ft^2)':
                    return test(d) + units[0]; 
                    break;
                case 'Source EUI (kBtu/ft^2)': 
                    return regular(d) + units[0];
                    break;
                case 'GHG Intensity (kgCO2/ft^2)': 
                    return regular(d) + units[1];
                    break;
                case 'Distance to 2030 Target %':
                    return perc(d);
                    break; 
                case 'ENERGY STAR Score':
                    return regular(d) + units[2]; 
                    break;
                case 'Water Use Intensity (gal/ft^2)':
                    return regular(d) + units[3]; 
                    break;
                case 'Total Site Energy (kBtu)':
                    return regular(d) + units[4];
                    break;
                case 'Total GHG Emissions (MtCO2e)':
                    return regular(d) + units[5]; 
                    break;
                default: 
                    return regular(d); 
                    break;
                }
        }) 
        .scale(xScale);

    //Set up X axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(10," + (20) + ")") 
        .call(xAxis);


    var labels = svg.selectAll("text")[0]; 
    
    function deleteUnits(textelmnt) { //(Alex): added this little function to delete the units on the rightmost ticks of the legend because the numbers and units were being pushed out of the bounding box
        //get the text in labels
        var mylabelstr = textelmnt.textContent;
        var n = mylabelstr.search(/\(/); 
        var nolab = mylabelstr.slice(0,n);
        if (nolab.search(/\./) != -1) {
            var sliced = nolab.slice(0, (nolab.search(/\./)+2));
            return sliced += nolab.slice(-1);
        } else {
            return nolab;
        }
    
    } 


    svg.selectAll("text") //(Alex): formatting ticks on legend 
        for (i = 0; i < labels.length; i++) {
            if (labels[i].textContent.includes('%') == true) {
                if (i == 0) {
                    labels[i].style = "text-anchor: start;";
                    labels[i].setAttribute('x','-10');
                } else if (i == 1) {
                    labels[i].style = "text-anchor: middle;";
                    labels[i].setAttribute('x','-10');
                } else {
                    labels[i].style = "text-anchor: end";
                    labels[i].setAttribute('x','-10');
                }
            } else if (i == 0) {
                labels[i].style = "text-anchor: start;";
                labels[i].setAttribute('x','-10');
            } else if (i == 1) {
                labels[i].style = "text-anchor: middle;";
                labels[i].textContent = deleteUnits(labels[i]);
                labels[i].setAttribute('x','-10');
            } else {
                labels[i].style = "text-anchor: end;";
                labels[i].textContent = deleteUnits(labels[i]);
                labels[i].setAttribute('x','-10');
            } 
        };
}


// handling and parsing data, this is the heavy lifting of the code

var parseNYCData = function(values) {
    
    var json = Papa.parse(values, {
        header: true, 
        skipEmptyLines: true, 
        complete: function(results) {
            addtarg(results); 
            changeNYCcat(results);
            addcat(results);  
            //console.log("NY results", results); 
        }
    }).data; 
    var csv = Papa.unparse(json); 
    return csv; 
};


var parseChicagoData = function(values) {
    var json = Papa.parse(values, {
        header: true, 
        skipEmptyLines: true, 
        complete: function(results) {
            addtarg(results); 
            changeChicagocat(results); 
            addcat(results);  
            console.log("Chi results", results); 
        }
    }).data; 
    var csv = Papa.unparse(json); 
    return csv; 
};


var parseSanFranData = function(values) {
    var json = Papa.parse(values, {
        header: true, 
        skipEmptyLines: true, 
        complete: function(results) {
            addtarg(results); 
            addcat(results); 
            changeSanFrancat(results); 
            console.log("SanFran results", results); 
        }
    }).data; 
    var csv = Papa.unparse(json); 
    return csv; 
};


var parseBostonData = function(values) { //(Alex): parse Boston data has extra cleaned and uncleaned parsing because the cleaned version is missing important energy values
     
    clvalues = values.shift(); 
    
    var json = Papa.parse(clvalues, {
        header:true, 
        skipEmptyLines: true, 
        complete: function(results) {
            addtarg(results); 
            addcat(results); 
            console.log(results); 
        }
    })

    var length = json.data.length; //need .data
    var doesntmatter = values.shift(); //json
    var unclvalues = values.shift(); //uncleansed dataset
    var unclvalues = unclvalues.slice(503, unclvalues.length); //need to slice off the top before parsing


    var count = 0; 
     
    for (i=0; i<length; i++) {
        if (+json.data[i]['Source EUI (kBtu/ft^2)'] == 0) { 
            var count = count + 1; //keeping track of how many source euis are missing 
        }
    };
    

    if (count/length > 1/4) { // if more than 25% of the data is missing source eui then we are going to calculate them using uncleansed data
        var uncljson = Papa.parse(unclvalues, {
            header: true,
            skipEmptyLines: true, 
            complete: function(unclresults) {
                addsource(unclresults); 
                parcelID(unclresults); // return ['PARCEL_ID'] with values from uncleansed
                //console.log("uncl", unclresults); 
            }
        }).data;
        for (i=0; i<length; i++) {
            delete json.data[i]['Source EUI (kBtu/ft^2)'];
            json.data[i]['Source EUI (kBtu/ft^2)'] = uncljson[i]['Source EUI (kBTU/sf)']; //adding the calculated source value into the json !!
            //need to add values from uncleansed Boston tax parcel to cleansed because cleansed left out a bajillion
            delete json.data[i]['Tax Parcel']; 
            json.data[i]['PARCEL_ID'] = uncljson[i]['PARCEL_ID'];
        };
    } else {
        return;
    }
    //console.log("newjson",json); //confirm that source eui has been added  
    var csv = Papa.unparse(json); 
    return csv; 
    //console.log(csv); 
};


var changeNYCcat = function(json) {
    var length = json.data.length; 
    for (i = 0; i<length; i++) {
        json.data[i]['BIN'] = json.data[i]['BINs']; 
        delete json.data[i]['BINs'];
    }
}; 

var changeChicagocat = function(json) {
    var length = json.data.length;
    for (i =0; i<length; i++) {
        json.data[i]['BLDG_ID'] = json.data[i]['ID'];
        delete json.data[i]['ID'];
    }
}

var changeSanFrancat = function(json) {
    var length = json.data.length;
    for (i = 0; i<length; i++) {
        //json.data[i]['Parcel'] = json.data[i]['Parcel'].replace(/\b0+[1-9]\d*/g, ''); //(Alex): remove leading 0s because only 5 digit ids in SanFrangeometry
        json.data[i]['objectid'] = json.data[i]['Parcel'].replace(/[^0-9]/g, ''); //(Alex): need to regex and cleanup the id
        delete json.data[i]['Parcel']; 
        //json.data[i]['objectid'] = json.data[i]['Parcel'];
    }
}
var handleChicagoData = function(values) {
    //console.log('Chistate', state); 
    var localData = {}; 
    //console.log("table", table); 
    var csv = values.shift();  
    var csv = parseChicagoData(csv);

    var rows = Papa.parse(csv, {
        header:true
    }).data; 
    //console.log("rows", rows); 

    var geojson = values.shift();  
    //console.log(geojson); 
    var geojson = geojson.slice(0,-1);  
    var geojson = geojson + "]" + "}";
    //console.log(geojson); 
    if (typeof geojson == "string") {
        geojson = JSON.parse(geojson); 
    }
    //console.log("ChicagoGeoJson", geojson);

    var typeMap = {}; 
    console.log()

    rows.map(function(row) {
        if (!row[state.key]) { // key = 'BIN' for NYC
            return; 
        }
        var type = 'unknown';
        if (row[typeKey]) { // typeKey = 'General Property Type' 
            type = row[typeKey]; // type, which is in updateSelectors is being set to all property types in the dataset
            typeMap[type] = true;
        }
        var ids = [row[state.key]];
        ids.map(function(id) {
            localData[id] = row; // {parcel ID: all info}
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

    //console.log("localDataNow", localData); 

    table = localData; 
    console.log(statTable, state.metric, statTable[state.metric]);
    domain = [statTable[state.metric].all.min, 400];

    updateLegend(state.metric); 

    geojson.features.map(function(feature) {
            setStyles(feature);
            //console.log("this is the feature: ", feature);
        })
        //console.log(style);
        // debugger;
    //console.log(geojson); 
    vectorSource = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(geojson)
    });

    olMap.removeLayer(vectorLayer); //to remove the previous location's layer and speed things up

    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: styleChicagoFunction,
        projection: 'EPSG:4326'
    });
    // debugger;

    olMap.addLayer(vectorLayer);

};

var styleChicagoFunction = function(feature) {
    //console.log("in function prop", feature.getProperties());
    // debugger;
    return style[feature.getProperties()['BLDG_ID']];
    
}


var handleSanFranData = function(values) {
    //console.log("SanFran", state); 
    var localData = {}; 
    var csv = values.shift(); 
    var csv = parseSanFranData(csv);

    var rows = Papa.parse(csv, {
        header:true
    }).data; 
    //console.log("rows", rows); 

    var geojson = values.shift();  
    //console.log(geojson); 
    var geojson = geojson.slice(0,-1);  
    var geojson = geojson + "]" + "}";
    //console.log(geojson); 
    if (typeof geojson == "string") {
        geojson = JSON.parse(geojson); 
    }
    //console.log("SanFranGeoJson", geojson);

    var typeMap = {}; 
    console.log()

    rows.map(function(row) {
        if (!row[state.key]) { // key = 'BIN' for NYC
            return; 
        }
        var type = 'unknown';
        if (row[typeKey]) { // typeKey = 'General Property Type' 
            type = row[typeKey]; // type, which is in updateSelectors is being set to all property types in the dataset
            typeMap[type] = true;
        }
        var ids = [row[state.key]];
        ids.map(function(id) {
            localData[id] = row; // {parcel ID: all info}
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


    table = localData; //(Alex) change global variable to city data 


    console.log(statTable, state.metric, statTable[state.metric]);
    domain = [statTable[state.metric].all.min, 400];

    updateLegend(state.metric); 

    geojson.features.map(function(feature) {
            setStyles(feature);
            //console.log("this is the feature: ", feature);
        })
        //console.log(style);
        // debugger;
  
    vectorSource = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(geojson)
    });

    olMap.removeLayer(vectorLayer); //to remove the previous location's layer and speed things up

    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: styleSanFranFunction,
        projection: 'EPSG:4326'
    });
    // debugger;

    olMap.addLayer(vectorLayer);

};

var styleSanFranFunction = function(feature) {
    //console.log("in function prop", feature.getProperties());
    // debugger;
    return style[feature.getProperties()['objectid']];
}


var handleNYCData = function(values) { 
    //console.log("stateafterNY", state); 
    var localData = {}; 
    var csv = values.shift();  
    var csv = parseNYCData(csv);

    var rows = Papa.parse(csv, {
        header:true
    }).data; 

    var geojson = values.shift();  
    var geojson = geojson.slice(0,-1);  
    var geojson = geojson + "]" + "}";
    if (typeof geojson == "string") {
        geojson = JSON.parse(geojson); 
    }
    //console.log("NYCgeojson", geojson);

    var typeMap = {}; 
    console.log()
    //console.log("key right now", state.key); 
    rows.map(function(row) {
        if (!row[state.key]) { // key = 'BIN' for NYC
            return; 
        }
        var type = 'unknown';
        if (row[typeKey]) { // typeKey = 'General Property Type' 
            type = row[typeKey]; // type, which is in updateSelectors is being set to all property types in the dataset
            typeMap[type] = true;
        } 
        var ids = [row[state.key]]; //(Alex) no need to pass this to validIDs, internal function that pads the id, because the data matches the original id. This was the important step to color matching the data.
        ids.map(function(id) {
            localData[id] = row; // {parcel ID: all info}
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
    console.log(localData); 
    table = localData; 

    console.log(statTable, state.metric, statTable[state.metric]);
    domain = [statTable[state.metric].all.min, 400];

    updateLegend(state.metric); 

    geojson.features.map(function(feature) {
            setStyles(feature);
            //console.log("this is the feature: ", feature);
        })
        //console.log(style);
        // debugger;
    //console.log(geojson); 
    vectorSource = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(geojson)
    });

    olMap.removeLayer(vectorLayer); //to remove the previous location's layer and speed things up

    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: styleNYCFunction,
        projection: 'EPSG:4326'
    });
    // debugger;

    olMap.addLayer(vectorLayer);

};

var styleNYCFunction = function(feature) {
    //console.log("in function prop", feature.getProperties());
    // debugger;
    return style[feature.getProperties()['BIN']];
    
}

var parseBostonData = function(values) { 
     
    clvalues = values.shift(); 
    
    var json = Papa.parse(clvalues, {
        header:true, 
        skipEmptyLines: true, 
        complete: function(results) {
            addtarg(results); 
            addcat(results); 
            console.log(results); 
        }
    })

    var length = json.data.length; //need .data
    var doesntmatter = values.shift(); //json
    var unclvalues = values.shift(); //uncleansed dataset
    var unclvalues = unclvalues.slice(503, unclvalues.length); //need to slice off the top before parsing


    var count = 0; 
     
    for (i=0; i<length; i++) {
        if (+json.data[i]['Source EUI (kBtu/ft^2)'] == 0) { 
            var count = count + 1; //keeping track of how many source euis are missing 
        }
    };
    

    if (count/length > 1/4) { // if more than 25% of the data is missing source eui then we are going to calculate them using uncleansed data
        var uncljson = Papa.parse(unclvalues, {
            header: true,
            skipEmptyLines: true, 
            complete: function(unclresults) {
                addsource(unclresults); 
                parcelID(unclresults); // return ['PARCEL_ID'] with values from uncleansed
                //console.log("uncl", unclresults); 
            }
        }).data;
        for (i=0; i<length; i++) {
            delete json.data[i]['Source EUI (kBtu/ft^2)'];
            json.data[i]['Source EUI (kBtu/ft^2)'] = uncljson[i]['Source EUI (kBTU/sf)']; //adding the calculated source value into the json !!
            //need to add values from uncleansed Boston tax parcel to cleansed because cleansed left out a bajillion
            delete json.data[i]['Tax Parcel']; 
            json.data[i]['PARCEL_ID'] = uncljson[i]['PARCEL_ID'];
        };
    } else {
        return;
    }
    //console.log("newjson",json); //confirm that source eui has been added  
    var csv = Papa.unparse(json); 
    return csv; 
    //console.log(csv); 
};

var addcat = function(json) {  // wouldn't need this anymore
    //GHG Intensity
    var length = json.data.length; 
    
    //if json.data.hasOwnProperty("") --> it has the property but a majority aka all are empty... 
    

    for (i = 0; i<length; i++) {
        //
        var totalGHG = +json.data[i]['Total GHG Emissions (MtCO2e)']
        var floorarea = +json.data[i]['Floor Area (ft^2)']; //(Alex): used floor area instead of reported because reported is self-reported vs. floor area recorded by Department of finance records 
        var siteeui = +json.data[i]['Site EUI (kBtu/ft^2)'];
        json.data[i]['Total Site Energy (kBtu)'] = (siteeui*floorarea).toFixed(2); //need to calculate  

        if (totalGHG == 0 || floorarea == 0) {
            var GHGIntensity= 0; 
        } else {
            var GHGIntensity = (totalGHG*1000)/floorarea; //(Alex): conversion 
        }

        json.data[i]['GHG Intensity (kgCO2/ft^2)'] = GHGIntensity.toFixed(2); 
    };

};

var addsource = function(json) {
    var length = json.data.length; 

    var elect = 3.14; // conversion rates 
    var natgas = 1.05;
    var electsolar = 1;
    var stm = 1.2; 
    //console.log(json); 
    for (i = 0; i < length; i ++) { //loop through array of objects
        var totalsite = +json.data[i][' Total Site Energy (kBTU) '].replace(/,/g, ''); //(Alex): have to replace commas and % to be able to convert to int, otherwise I was getting NaNs on NaNs
        if (json.data[i]['% Steam'].length < 1){
            var datasteam = 0;
        } else {
            var datasteam = +json.data[i]['% Steam'].replace(/%/g,"")/100; 
        };
        if (json.data[i]['% Electricity'].length < 1) {
            var dataelect = 0; 
        } else {
            var dataelect = +json.data[i]['% Electricity'].replace(/%/g,"")/100; 
        }
        if (json.data[i]["% Gas"].length < 1) {
            var datagas = 0; 
        } else {
            var datagas = +json.data[i]['% Gas'].replace(/%/g,"")/100;
        }
        if (json.data[i]["Onsite Solar (kWh)"].length < 1) {
            var datasolar = 0;
        } else {
            var datasolar = +json.data[i]["Onsite Solar (kWh)"]/100;
        }
        var grossarea = +json.data[i]['Gross Area (sq ft)'].replace(/,/g, ''); 
        var totalsourceEnergy = (((dataelect * elect) + (datagas * natgas) + (datasteam * stm) + (datasolar * electsolar)) * totalsite).toFixed(2); 
        var sourceEUI = (totalsourceEnergy/grossarea).toFixed(2);
        // json.data[i]['Total Source Energy (kBTU)'] = totalsourceEnergy;
        json.data[i]['Source EUI (kBTU/sf)'] = sourceEUI; 
    };
    return json;  


}; 


var addtarg = function(json) {
    var length = json.data.length; 
    for (i = 0; i < length; i++) {
        var type = json.data[i]['Property Type']; 
        var type = type.toLowerCase(); 
        var eui = +json.data[i]['Site EUI (kBtu/ft^2)'];
        var year_built = +json.data[i]['Year Built'];
        var mediansiteeui = []; 
        var energy_target = []; 
        var energy_percent_reduction = [];
        var val_energy_red = []; 
        var gentype = []; 


        var EducationKeys = ["elementary school", "campus","middle school","high school", "college","preschool","daycare","adult education","career","vocational training","religious education","school","college","education"];
        var OfficeKeys = ["administrative","professional office","laboratory","courthouse", "government office","mixed", "mixed-use office","bank","financial","office","non-profit","social services","city hall","call center"];
        var WarehouseKeys = ["refrigerated warehouse","non-refrigerated warehouse","distribution","shipping center","storage","shipping","refrigerated","parking","distribution"];
        var PublicAssemblyKeys = ["recreation","fitness","community","lodge","meeting","convention","senior center","recreation","gymnasium","health club","bowling","ice rink","field house", "entertainment","culture","museum","theater","cinema","sports","casino","club","public assembly","stadium","worship facility","arena","library","funeral","student center", "terminal","chapels","churches","mosques","synagogues","religious","temples","movie","performing","social","rink"];
        var MercentileKeys = ["mall","retail store","beer","wine","dealership","showroom","studio","gallery","vehicle repair","repair","race"];
        var ServiceKeys = ["food","grocery","convenience","restaurant","fast food"];
        var ResidentialKeys = ["lodging","hotel","residence","housing","senior care","barracks","residential","multifamily","home","dormitory"];
        var HealthKeys = ["outpatient","hospital","surgical","clinic","mental"];
        var OtherKeys = ["other","industrial","manafacturing","casting"];
        var OrderSafetyKeys = ["public order","safety","police", "station","jail","fire"];

        if (mediansiteeui.length == 0) { 
            EducationKeys.forEach(function(edukey) {
                if ((mediansiteeui.length == 0) && (type.indexOf(edukey) !== -1)) {
                    gentype.push("Education"); 
                    if (type.indexOf("college") !== -1|| type.indexOf("university")!== -1) {
                        mediansiteeui.push(104); 
                    } else {
                        mediansiteeui.push(58); 
                    }
         
                } 
            });
        };


        if (mediansiteeui.length == 0) {
            OfficeKeys.forEach(function(officekey) {
                if ((mediansiteeui.length == 0) && (type.indexOf(officekey) !== -1)) {
                    gentype.push("Office"); 
                    mediansiteeui.push(115); //site not listed so i just did other because 127 matched :/ 
        
                }
            });
        }; 
        
        if (mediansiteeui.length == 0) {
            WarehouseKeys.forEach(function(warehousekey) {
                if ((mediansiteeui.length == 0) && (type.indexOf(warehousekey) !== -1)) {
                    gentype.push("Warehouse and Storage"); 
                    mediansiteeui.push(10); 
        
                }
            });
        };
        

        if (mediansiteeui.length == 0) {
            PublicAssemblyKeys.forEach(function(publickey) {
                if ((mediansiteeui.length == 0) && (type.indexOf(publickey) !== -1)) {
                    gentype.push("Public Assembly"); 

                    if ((type.indexOf("entertainment") !== -1) || (type.indexOf("movie") !== -1) || (type.indexOf("performing") !== -1) || (type.indexOf("museum") !== -1)) {
                        mediansiteeui.push(46); 
                    } else if (type.indexOf("library") !== -1) {
                        mediansiteeui.push(92); 
                    } else if ((type.indexOf("public assembly") !== -1) || (type.indexOf("stadium") !== -1) || (type.indexOf("worship facility") !== -1) || (type.indexOf("arena") !== -1)) {
                        mediansiteeui.push(42); 
                    } else if (type.indexOf("social") !== -1) {
                        mediansiteeui.push(43);
                    } else if ((type.indexOf("recreation") !== -1) || (type.indexOf("fitness") !== -1)) {
                        mediansiteeui.push(39); 
                    } else {
                        mediansiteeui.push(45); 
                    }
        
                }
            });
        };


        if (mediansiteeui.length == 0) {
            MercentileKeys.forEach(function(merckey) {
                if (type.indexOf(merckey) !== -1) {
                    gentype.push("Mercentile"); 

                    if (type.indexOf("mall")!== -1) {
                        mediansiteeui.push(94);
                    } else if ((type.indexOf("vehicle repair")!== -1) || (type.indexOf("repair") !== -1)) {
                        mediansiteeui.push(45);
                    } else {
                        mediansiteeui.push(53); 
                    }
         
                }
            });
        }


        if (mediansiteeui.length == 0) {
            ServiceKeys.forEach(function(servicekey) {
                if (type.indexOf(servicekey) !== -1) {
                    gentype.push("Service"); 
                    if ((type.indexOf("food sales")!== -1) || (type.indexOf("grocery")!== -1)) {
                        mediansiteeui.push(193); 
                    } else if (type.indexOf("convenience")!== -1) {
                        mediansiteeui.push(228); 
                    } else if (type.indexOf("restaurant")!== -1) {
                        mediansiteeui.push(207); 
                    } else if (type.indexOf("fast food")!== -1) {
                        mediansiteeui.push(418); 
                    } else {
                        mediansiteeui.push(267); 
                    }
    
                }
            }); 
        };

        if (mediansiteeui.length == 0) {
            ResidentialKeys.forEach(function(reskey) {
                if ((mediansiteeui.length == 0) && (type.indexOf(reskey)!== -1)) {
                    gentype.push("Residential"); 
                    mediansiteeui.push(72); 
        
                }
            });
        };
        

        if (mediansiteeui.length == 0) {
            HealthKeys.forEach(function(healthkey) {
                if ((mediansiteeui.length == 0) && (type.indexOf(healthkey)!== -1)) {
                    gentype.push("Health"); 
                    if ((type.indexOf("outpatient")!== -1) || (type.indexOf("hospital")!== -1) || (type.indexOf("surgical")!== -1)) {
                        mediansiteeui.push(62); 
                    } else {
                        mediansiteeui.push(67); 
                    }
        
                }
            });
        };

        if (mediansiteeui.length == 0) {
            OtherKeys.forEach(function(otherkey) {
                if (type.indexOf(otherkey)!== -1) {
                    gentype.push("Other"); 
                    mediansiteeui.push(70); 
         
                }
            });
        }; 
        

        if (mediansiteeui.length == 0) {
            OrderSafetyKeys.forEach(function(orderkey) {
                if ((mediansiteeui.length == 0) && (type.indexOf(orderkey)!== -1)) {
                    gentype.push("Public Order and Safety"); 
                    if ((type.indexOf("public order")!== -1) || (type.indexOf("safety")!== -1)) {
                        mediansiteeui.push(82); 
                    } else {
                        mediansiteeui.push(82); 
                    }
        
                }
            });
        }; 

        if (mediansiteeui.length == 0) {
            mediansiteeui.push(78); 
            gentype.push("Unknown");
        }
        
        if (year_built<2002) {
            var energy_target = parseFloat(+mediansiteeui) * 0.8;
            var energy_percent_reduction = 1.0 - (energy_target/eui); //distance to 2030 %
            var val_energy_red = eui - energy_target; 

        } else {
            var energy_target = parseFloat(+mediansiteeui) * 0.2; 
            var energy_percent_reduction = 1 - (energy_target/eui); 
            var val_energy_red = eui - energy_target; 
        }
        json.data[i]['2030 Target'] = energy_target.toFixed(2); 
        json.data[i]['Distance to 2030 Target %'] = energy_percent_reduction.toFixed(6); 
        json.data[i]['Distance to 2030 Target val'] = val_energy_red.toFixed(6); 
        json.data[i]['General Property Type'] = gentype.toString(); 
    };
};


var parcelID = function(json) {
    var length = json.data.length; 
    for (i = 0; i < length; i++) {
        // parcel = json.data[i]['Tax Parcel']; 
        var parcelID = [];
        var taxid = json.data[i]['Tax Parcel'];
        if (taxid == "Not Available" || taxid == "") {
            parcelID.push("Not Available"); 
        } else if (taxid.length <10) {
            parcelID.push("0".concat(json.data[i]['Tax Parcel']));
        } else {
            parcelID.push(json.data[i]['Tax Parcel']);
        }
    delete json.data[i]['Tax Parcel']; 
    json.data[i]['PARCEL_ID'] = parcelID[0]; 
    };   
};

var handleBostonData = function(values) { 
    var localData = table; // {}
//values is clean, json, unclean
    // values is an array:
    // [0] csv  file string
    // [1] json file string
    var json = values[1]; //values.shift() wasn't working
    
    var csv = parseBostonData(values); //(Alex): send both the uncleansed data and the cleansed data to be parsed 
    var rows = Papa.parse(csv, { //JSON of csv
        header: true
    }).data;  
    
    // var json = values.shift();
    if (typeof json == "string") {
        json = JSON.parse(json);
    } 
    // console.log('json', json); 

    var typeMap = {};
    //console.log(typeKey); 
    //console.log(json);
    console.log()
    rows.map(function(row) {
        if (!row[key]) { // var key = 'PARCEL_ID';
            return;
        }
        var type = 'unknown';
        if (row[typeKey]) { // typeKey = 'General Property Type' 
            type = row[typeKey]; // type, which is in updateSelectors is being set to all property types in the dataset
            typeMap[type] = true;
        }
        var ids = validIdsFromString(row[key]); 
        ids.map(function(id) {
            localData[id] = row; // {parcel ID: all info}
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


    console.log(statTable, state.metric, statTable[state.metric]);
    domain = [statTable[state.metric].all.min, 400]; //statTable[state.metric].all.max 
    //need to manually set the domain to 400 for the site eui 
    //(Alex): Had to manually assign the first state.metric, but that's ok because this compiles on load so it's the default metric 
/* 

 (Alex): only called on the first load of the page and default "all" filter is the first filter (Site) 

*/
    //state.metric = 'Site EUI (kBtu/ft^2)'; //power move //possibly can remove if you fix state.metric at the tip-top 
    updateLegend(state.metric); 

    json.features.map(function(feature) {
            setStyles(feature, table);
            //console.log("this is the feature: ", feature);
        })
        //console.log(style);
        // debugger;
    vectorSource = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(json)
    });

    olMap.removeLayer(vectorLayer);

    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: styleFunction,
        projection: 'EPSG:4326'
    });
    // debugger;

    olMap.addLayer(vectorLayer);


};
var handleBostonData1 = function(values) { 
    var localData = table; // {}
//values is clean, json, unclean
    // values is an array:
    // [0] csv  file string
    // [1] json file string
    var json = values[1]; //values.shift() wasn't working
    
    var csv = parseBostonData(values); //(Alex): send both the uncleansed data and the cleansed data to be parsed 
    var rows = Papa.parse(csv, { //JSON of csv
        header: true
    }).data;  
    //console.log(rows); 
    // var json = values.shift();
    if (typeof json == "string") {
        json = JSON.parse(json);
    } 
    //console.log('json', json); 

    var typeMap = {};
    //console.log(typeKey); 
    //console.log(json);
    console.log()
    rows.map(function(row) {
        if (!row[key]) { // var key = 'PARCEL_ID';
            return;
        }
        var type = 'unknown';
        if (row[typeKey]) { // typeKey = 'General Property Type' 
            type = row[typeKey]; // type, which is in updateSelectors is being set to all property types in the dataset
            typeMap[type] = true;
        }
        var ids = validIdsFromString(row[key]);
        
        ids.map(function(id) {
            localData[id] = row; // {parcel ID: all info}
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

    console.log(statTable, state.metric, statTable[state.metric]);
    domain = [statTable[state.metric].all.min, 400]; //statTable[state.metric].all.max 
    //need to manually set the domain to 400 for the site eui 
    //(Alex): Had to manually assign the first state.metric, but that's ok because this compiles on load so it's the default metric 
/* 

 (Alex): only called on the first load of the page and default "all" filter is the first filter (Site) 

*/
    //state.metric = 'Site EUI (kBtu/ft^2)'; //power move //possibly can remove if you fix state.metric at the tip-top 
    updateLegend(state.metric); 

    json.features.map(function(feature) {
            setStyles(feature);
            //console.log("this is the feature: ", feature);
        })
        //console.log(style);
        // debugger;
    vectorSource = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(json)
    });

    olMap.removeLayer(vectorLayer);

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
        id = feature.properties[state.key]; //passed in depending on city 
    } else if (feature.T) {
        id = feature.T[state.key];
    }

    //console.log("id", id); 
    //console.log("tableinSetStyle", table); 
    // get row from table table by ID
    var row = {};
    if (table[id]) { //table has each row data, pulling that building by key (parcelid)
        row = table[id];
    } else {
        //console.log('row does not exist');
        row[state.metric] = 0;
    }
    //console.log("row", row)

    if (state.filter === "All") {
        alphaStroke = 1;
        alphaFill = 0.8;
    } else {
        // logic here for filter (set alpha to 0 if not pass filter?)
        var featureFilter = row[typeKey];
        //console.log(featureFilter);
        var alphaStroke = 0;
        var alphaFill = 0;
        if (featureFilter == state.filter) {
            //console.log('we got a ' + state.filter);
            alphaStroke = 1;
            alphaFill = 0.8;
        }

    }


    // get value from row
    var value = row[state.metric];
    //console.log("value", value); 
    // build color
    //console.log(value, scale(value).rgb());
    // debugger;

    scale = chroma.scale(['rgb(0,255,0)', 'rgb(255,0,0)']).domain(domain); //green, red
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
    return style[feature.getProperties()['PARCEL_ID']];
    
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
            //center: ol.proj.fromLonLat([-71.087955, 42.343583]),
            center: [coordsBoston[1], coordsBoston[0]], 
            zoom: 13,
            projection: 'EPSG:4326'
        })
    });
};

function modify2DMap (coords) {
    console.log("olMap", olMap); 
    olMap.setView(new ol.View({
        center: [coords[1], coords[0]],
        zoom: 13,
        projection: 'EPSG:4326'
    }));
};

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

        console.log("coord",coord);

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
                    //console.log("selectedfeature", feature);
                    //get feature ID
                    var id;
                    if (properties) {
                        id = properties[state.key];
                    } else if (e.selected[0].T) {
                        id = e.selected[0].T[state.key];
                    }
                    console.log("id", id);
                    // get row from table table by ID
                    var row = {};
                    if (table[id]) {
                        row = table[id];
                        //find the way to bind the front end?
                        console.log(row);

                        document.getElementById("name").innerHTML = row["Property Name"];
                        document.getElementById("address").innerHTML = row["Address"];
                        document.getElementById("siteEUI").innerHTML = row["Site EUI (kBtu/ft^2)"];
                        document.getElementById("sourceEUI").innerHTML = row["Source EUI (kBtu/ft^2)"];
                        document.getElementById("GHGIntensity").innerHTML = row["GHG Intensity (kgCO2/ft^2)"];
                        document.getElementById("EnergyStar").innerHTML = row["ENERGY STAR Score"];
                        document.getElementById("waterIntensity").innerHTML = row["Water Use Intensity (gal/ft^2)"];
                        document.getElementById("distanceTo2030").innerHTML = row["Distance to 2030 Target %"];
                        document.getElementById("totalSite").innerHTML = row["Total Site Energy (kBtu)"];
                        // document.getElementById("totalSource").innerHTML = row["Total Source Energy (kBtu)"];
                        document.getElementById("GHGEmissions").innerHTML = row["Total GHG Emissions (MtCO2e)"];
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
    state.metric = $(e.target).val(); // (Alex): need to manually change some of the maximum values so that the data visualization isn't skewed by outliers

    if(state.metric=='All') {
      domain = [statTable[state.metric].all.min, statTable[state.metric].all.max];
    } else if (state.metric == 'Site EUI (kBtu/ft^2)') {
        domain = [statTable[state.metric].all.min, 400];
    } else if (state.metric == 'Source EUI (kBtu/ft^2)') {
        domain = [statTable[state.metric].all.min, 1200];
    } else if (state.metric == 'Distance to 2030 Target %') {
        domain = [0,1]
    } else if (state.metric == 'GHG Intensity (kgCO2/ft^2)') {
        domain = [statTable[state.metric].all.min, 65]; 
    } else if (state.metric == 'Water Use Intensity (gal/ft^2)') {
        domain = [statTable[state.metric].all.min, 600]; 
    } else if (state.metric == "Total Site Energy (kBtu)") {
            domain = [statTable[state.metric].all.min, 95000000]
    } else if (state.metric == "Total GHG Emissions (MtCO2e)") {
        domain = [statTable[state.metric].all.min, 90000]
    }else {
        domain = [statTable[state.metric].all.min, statTable[state.metric].all.max]; 
    }
    updateLayers(state.metric);
});

//going to take the statTable[state.metric] so that statTable[state.metric].byType[state.filter] will choose from the 11 categories
//maybe do it forEach state.metric , take in the statTable


$(document).on('change', '#filter', function(e) {
    state.filter = $(e.target).val();
    if(state.filter=='All'){
            if(state.metric=='All') {
                domain = [statTable[state.metric].all.min, statTable[state.metric].all.max];
            } else if (state.metric == 'Site EUI (kBtu/ft^2)') {
                domain = [statTable[state.metric].all.min, 400];
            } else if (state.metric == 'Source EUI (kBtu/ft^2)') {
                domain = [statTable[state.metric].all.min, 1200];
            } else if (state.metric == 'Distance to 2030 Target %') {
                domain = [0,1]
            } else if (state.metric == 'GHG Intensity (kgCO2/ft^2)') {
                domain = [statTable[state.metric].all.min, 65]; 
            } else if (state.metric == 'Water Use Intensity (gal/ft^2)') {
                domain = [statTable[state.metric].all.min, 600]; 
            } else if (state.metric == 'Total Site Energy (kBtu)') {
                domain = [statTable[state.metric].all.min, 95000000]
            } else if (state.metric == 'Total GHG Emissions (MtCO2e)') {
                domain = [statTable[state.metric].all.min, 90000]
            } else {
                domain = [statTable[state.metric].all.min, statTable[state.metric].all.max]; 
            }
    }else{
            if(state.metric=='All') {
                domain = [statTable[state.metric].all.min, statTable[state.metric].all.max];
            } else if (state.metric == 'Site EUI (kBtu/ft^2)') {
                domain = [statTable[state.metric].all.min, 400];
            } else if (state.metric == 'Source EUI (kBtu/ft^2)') {
                domain = [statTable[state.metric].all.min, 1200];
            } else if (state.metric == 'Distance to 2030 Target %') {
                domain = [0,1]
            } else if (state.metric == 'GHG Intensity (kgCO2/ft^2)') {
                domain = [statTable[state.metric].all.min, 65]; 
            } else if (state.metric == 'Water Use Intensity (gal/ft^2)') {
                domain = [statTable[state.metric].all.min, 600]; 
            } else if (state.metric == 'Total Site Energy (kBtu)') {
                domain = [statTable[state.metric].all.min, 95000000]
            } else if (state.metric == 'Total GHG Emissions (MtCO2e)') {
                domain = [statTable[state.metric].all.min, 90000]
            } else {
                domain = [statTable[state.metric].all.min, statTable[state.metric].all.max]; 
            }

      //domain = [statTable[state.metric].byType[state.filter].min, statTable[state.metric].byType[state.filter].max];
    }
    updateLayers(state.metric); 
    //case 
});


$(document).on('change', '#location', function(e) {
        state.location = $(e.target).val();
        if(state.location=='All') {
            create2DMap();      
        } else { // need to addcat to most of them when parsing through
            switch (state.location) {
                case 'Boston': 
                    modify2DMap([42.3568138, -71.0524385]);
                    state.key = 'PARCEL_ID'; 
                    Promise.all(['./Boston-CleansedEnergyData.csv', "./geometry.geojson", 'Boston-UncleansedEnergyData.csv'].map($.get)).then(handleBostonData1);
                    break;
                case 'NYC': 
                    var coords = [40.7829, -73.9654];
                    modify2DMap(coords);
                    state.key = 'BIN'; 
                    Promise.all(['./NYC-CleansedEnergyData.csv', "./NYC_FILTEREDPart234.geojson"].map($.get)).then(handleNYCData); 
                    break;
                case 'Philadelphia': 
                    var coords = [39.9526, -75.1652];
                    modify2DMap(coords);
                    //Promise.all(['./Philadelphia-CleansedEnergyData.csv', "./Philly_FILTERED.geojson"].map($.get)).then(parsePhillyData);
                    break;
                case 'Chicago':
                    var coords = [41.8781, -87.6298];
                    modify2DMap(coords);
                    state.key = 'BLDG_ID'; 
                    Promise.all(['./Chicago-CleansedEnergyData.csv', './Chicago_FILTERED.geojson'].map($.get)).then(handleChicagoData);
                    break; 
                case 'Minneapolis':
                    var coords = [44.9778, -93.2650];
                    modify2DMap(coords);
                    //Promise.all(['./Minneapolis-CleansedEnergyData.csv'].map($.get)).then(parseMinneapolisData);
                    break;
                case 'San Francisco':
                    var coords = [37.7749, -122.4194];
                    modify2DMap(coords);
                    state.key = 'objectid';
                    Promise.all(['./SanFrancisco-CleansedEnergyData.csv', './SanFranBuilding_FILTERED.geojson'].map($.get)).then(handleSanFranData);
                    //water use intensity is empty 
                    break;
                case 'Washington D.C':
                    var coords = [38.9072, -77.0369];
                    modify2DMap(coords);
                    //missing a lot of site/source eui but when there's site there's source
                    //don't think there's anything we could do about that... 
                    //Promise.all(['./WashingtonDC-CleansedEnergyData.csv'].map($.get)).then(parseWashDCData);
                    break;
                default: 
                    modify2DMap([coordsBoston[1], coordsBoston[0]]);
                    //Promise.all(['./Boston-CleansedEnergyData.csv'].map($.get)).then(parseBostonData);
                    break;
            }
        };    
    });
 



$(document).ready(function() {
    create2DMap(); 
    Promise.all(['./Boston-CleansedEnergyData.csv', "./geometry.geojson", 'Boston-UncleansedEnergyData.csv'].map($.get)).then(handleBostonData);
    add2DInteraction();

})
