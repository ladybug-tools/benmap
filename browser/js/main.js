
//
// page state

var state = {
  filter: "school",
  metric: "Source EUI (kBTU/sf)"
};


//
// objects/variables that need to be accessed within functions

var style         = {};
var table         = {};
var olMap         = {};
var vectorLayer   = {};
var vectorSource  = {};
var key           = 'PARCEL_ID';
var types         = [];
var typeKey       = 'Property Type';


//
// we put the FUN in functions

var updateSelectors = function(){
  types.map(function(type){
    $('#filter').append('<option value="'+type+'">'+type+'</option>');
  });
};

var updateLayers = function(){
  vectorLayer.setStyle( setStyles );
};

var handleData = function(values){

  var localData = table;

  // values is an array:
  // [0] csv  file string
  // [1] json file string
  var csvRaw  = values.shift();
  var rows = Papa.parse(csvRaw, {header: true} ).data;
  var json = values.shift();
  if(typeof json == "string"){
    json = JSON.parse(json);
  }

  var typeMap = {};

  for(var r in rows){
    var row = rows[r];
    // console.log(Object.keys(row));
    if(row[ key ]){
      // console.log('adding row');
      if(row[ typeKey ]){
        typeMap[row[typeKey]] = true;
      }
      localData[row[ key ]] = row;

    }
  }

  types = Object.keys(typeMap);

  updateSelectors();

  json.features.map(function(feature){
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
    if(feature.properties){
      id = feature.properties[ key ];
    }else if(feature.T){
      id = feature.T[ key ];
    }

    // get row from table table by ID
    var row = {};
    if(table[id]){
      row = table[id];
    }else{
      // console.log('row does not exist');
      row[ state.metric ] = 0;
    }

    // logic here for filter (set alpha to 0 if not pass filter?)
    var featureFilter = row[ typeKey ];
    // console.log(featureFilter);
    var alphaStroke = 0;
    var alphaFill   = 0;
    if( featureFilter == state.filter ){
      console.log('we got a '+state.filter);
      alphaStroke = 1;
      alphaFill   = 0.8;
    }

    // get value from row
    var value = row[ state.metric ];

    // build color
    var scale = chroma.scale(['blue', 'rgba(183,28,28 ,1)']).domain([0, 200]);
    var color = scale(value).rgb();
    // console.log(value, color);
    // var alpha = scale(value).alpha();

    var rgba = "rgba(" + color[0].toFixed(0) + "," + color[1].toFixed(0) + "," + color[2].toFixed(0);
    var rgbaStroke = rgba + ","+alphaStroke+")";
    var rgbaFill = rgba + ","+alphaFill+")";

    // console.log(rgbaStroke);

    return style[ id ] = new ol.style.Style({
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
    // console.log("in function getkey", feature.getProperties()["PART_USE"]);
    // var res1 = style[feature.getProperties()["PARCEL_ID"]]
    // var res = setStyles(feature);
    // debugger;
    // console.log(style[feature.getProperties()["PARCEL_ID"]]);

    return style[feature.getProperties()["PARCEL_ID"]];
    // return style["R2"];
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


//
// jQuery page listeners

$(document).on('change','#metric',function(e){
  state.metric = $(e.target).val();
  updateLayers();
});
$(document).on('change','#filter',function(e){
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

  // handle data retrieved via ajax
  Promise.all( ['./data.csv',"./geometry.geojson"].map($.get) ).then( handleData );

  olMap.on('click', function(evt){
      console.log("map Click event fired");
      olMap.forEachFeatureAtPixel(evt.pixel, function(feature, layer){
          // get feature ID
          var id;
          if(feature.properties){
            id = feature.properties[ key ];
          }else if(feature.T){
            id = feature.T[ key ];
          }
           console.log("id", id);
          // get row from table table by ID
          var row = {};
          if(table[id]){
            row = table[id];
            //find the way to bind the front end?
            console.log("rows", row);
          }

      })

  })


})
