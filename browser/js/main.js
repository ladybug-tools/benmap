function trackMetric(metric){
    console.log("Metric: ", metric.value);
};

function getFilter(filter){
    console.log("Filter: ", filter.value);
};

var styles = {
    'R1': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'magenta',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255, 0, 255, 0.5)'
        })
    }),
    'R2': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'blue',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 0, 255, 0.5)'
        })
    }),
    'R3': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'red',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.5)'
        })
    })
}

var styleFunction = function(feature) {
    //console.log("in function prop", feature.getProperties());
    console.log("in function getkey", feature.getProperties()["PART_USE"]);

    return styles[feature.getProperties()["PART_USE"]];
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
