var style = {};

function trackMetric(metric) {
    console.log("Metric: ", metric.value);
};

function getFilter(filter) {
    console.log("Filter: ", filter.value);
};

function setStyles(feature) {
    console.log(feature.getProperties());
    var scale = chroma.scale(['rgba(250,250,250 ,1)', 'rgba(183,28,28 ,1)']).domain([0, 30]);

    var value = feature.getProperties().PART_HEIGH;

    var color = scale(value).rgb();
    var alpha = scale(value).alpha();

    var rgba = "rgba(" + color[0] + "," + color[1] + "," + color[2];
    var rgbaStroke = rgba + ", 1)"
    var rgbaFill = rgba + ", 0.8)"
    console.log(rgba, rgbaStroke, rgbaFill)
    return style[feature.getProperties().PARCEL_ID] = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: rgbaStroke,
            width: 2
        }),
        fill: new ol.style.Fill({
            color: rgbaFill
        })
    })

}



var styles = {
    'R1': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(142,36,170 ,1)',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(142,36,170 ,0.6)'
        })
    }),
    'R2': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(0,172,193 ,1)',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0,172,193 ,0.6)'
        })
    }),
    'R3': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(255,179,0 ,1)',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255,179,0 ,0.6)'
        })
    })
}


var styleFunction = function(feature) {
    //console.log("in function prop", feature.getProperties());
    console.log("in function getkey", feature.getProperties()["PART_USE"]);
    var res = setStyles(feature);
    console.log(res);
    // return styles[feature.getProperties()["PART_USE"]];
    return res;
}


$(document).ready(function() {

    var olMap = new ol.Map({
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
            //center: ol.proj.fromLonLat([-74,40]),
            center: ol.proj.fromLonLat([-71.087955, 42.343583]),
            zoom: 13
        })
    });


    $.getJSON("5_building_sample_epsg3857.geojson", function(json) {
        console.log(json);


        var vectorSource = new ol.source.Vector({
            features: (new ol.format.GeoJSON()).readFeatures(json)
        });


        var vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: styleFunction
        });

        olMap.addLayer(vectorLayer);
    });


})
