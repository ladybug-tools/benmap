var state = {
  filter: "school",
  metric: "Source EUI (kBTU/sf)"
};

var style       = {};
var data        = {};
var olMap       = {};
var vectorLayer = {};

function trackMetric(metric) {
    // console.log("Metric: ", metric.value);
    if (metric.value === "energy") {
        // redirect to function to recalculate data using EUI column in csv data
        // trigger setStyles
    }
    if (metric.value === "carbon"){
        // use Carbon Intensity column
    }
};

$(document).on('change','#metric',function(e){
  state.metric = $(e.target).val();
  vectorLayer.redraw();
});

$(document).on('change','#filter',function(e){
  state.filter = $(e.target).val();
  vectorLayer.redraw();
});

var getFilter = function(filter) {
    console.log("Filter: ", filter.value);
    column = filter.value;
    switch (filter.value) {
        case ("School") :
        // do something
        break;
        case ("Residential") :
        // do something else
        break;
    }
};

var setStyles = function(feature) {
    // console.log(feature);
    var scale = chroma.scale(['white', 'rgba(183,28,28 ,1)']).domain([0, 35]);
    
    var id = feature.properties.PARCEL_ID;
    
    var row = {};
    row[ state.metric ] = 0;
    if(data[id]){
      row = data[id];
    }else{
      // console.log('row does not exist');
    }

    var value = row[ state.metric ];

    var color = scale(value).rgb();
    // console.log(value, color);
    // var alpha = scale(value).alpha();

    var rgba = "rgba(" + color[0].toFixed(0) + "," + color[1].toFixed(0) + "," + color[2].toFixed(0);
    var rgbaStroke = rgba + ",1)";
    var rgbaFill = rgba + ",0.8)";

    // console.log(rgbaStroke);

    return style[feature.properties["PARCEL_ID"]] = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: rgbaStroke,
            width: 2
        }),
        fill: new ol.style.Fill({
            color: rgbaFill
        })
    })

}



// var styles = {
//     'R1': new ol.style.Style({
//         stroke: new ol.style.Stroke({
//             color: 'rgba(142,36,170 ,1)',
//             width: 2
//         }),
//         fill: new ol.style.Fill({
//             color: 'rgba(142,36,170 ,0.6)'
//         })
//     }),
//     'R2': new ol.style.Style({
//         stroke: new ol.style.Stroke({
//             color: 'rgba(0,172,193 ,1)',
//             width: 2
//         }),
//         fill: new ol.style.Fill({
//             color: 'rgba(0,172,193 ,0.6)'
//         })
//     }),
//     'R3': new ol.style.Style({
//         stroke: new ol.style.Stroke({
//             color: 'rgba(255,179,0 ,1)',
//             width: 2
//         }),
//         fill: new ol.style.Fill({
//             color: 'rgba(255,179,0 ,0.6)'
//         })
//     })
// }

var styleFunction = function(feature) {
    //console.log("in function prop", feature.getProperties());
    // console.log("in function getkey", feature.getProperties()["PART_USE"]);
    // var res1 = style[feature.getProperties()["PARCEL_ID"]]
    // var res = setStyles(feature);
    // debugger;
    // console.log(style[feature.getProperties()["PARCEL_ID"]]);

    return style[feature.getProperties()["PARCEL_ID"]];
    // return style["R2"];
}


$(document).ready(function() {
  

  
    var readyData = data;
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
  
  var CSVPromise  = $.get('./data.csv');
  var JSONPromise = $.getJSON("./geometry.geojson");

  Promise.all([CSVPromise,JSONPromise]).then(function(values){
    var csv  = values.shift();
    var json = values.shift();
    // console.log(csv);
    
    var rows = Papa.parse(csv, {header: true} ).data;
    
    
    
    for(var r in rows){
      var row = rows[r];
      // console.log(Object.keys(row));
      if(row['PARCEL_ID']){
        // console.log('adding row');
        readyData[row['PARCEL_ID']] = row;
      }else{
        // console.log('no row');
      }
    }
    
    // console.log(readyData);
        
    json.features.map(function(feature){
        setStyles(feature);
    })
    // console.log(style);
    // debugger;

    var vectorSource = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(json)
    });

    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: styleFunction,
        projection: 'EPSG:4326'
    });
    // debugger;

    olMap.addLayer(vectorLayer);
  });

})
