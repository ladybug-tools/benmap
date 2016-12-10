function trackMetric(metric){
    console.log("Metric: ", metric.value);
};

function getFilter(filter){
    console.log("Filter: ", filter.value);
};

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


    $.getJSON("5_building_sample.geojson", function(json) {
        console.log(json);

    //     var geojsonObject = {
    //    'type': 'FeatureCollection',
    //    'crs': {
    //      'type': 'name',
    //      'properties': {
    //        'name': 'EPSG:3857'
    //      }
    //    },
    //    'features': [{
    //      'type': 'Feature',
    //      'geometry': {
    //        'type': 'Point',
    //        'coordinates': [0, 0]
    //      }
    //    }, {
    //      'type': 'Feature',
    //      'geometry': {
    //        'type': 'LineString',
    //        'coordinates': [[4e6, -2e6], [8e6, 2e6]]
    //      }
    //    }, {
    //      'type': 'Feature',
    //      'geometry': {
    //        'type': 'LineString',
    //        'coordinates': [[4e6, 2e6], [8e6, -2e6]]
    //      }
    //    }, {
    //      'type': 'Feature',
    //      'geometry': {
    //        'type': 'Polygon',
    //        'coordinates': [[[-5e6, -1e6], [-4e6, 1e6], [-3e6, -1e6]]]
    //      }
    //    }, {
    //      'type': 'Feature',
    //      'geometry': {
    //        'type': 'MultiLineString',
    //        'coordinates': [
    //          [[-1e6, -7.5e5], [-1e6, 7.5e5]],
    //          [[1e6, -7.5e5], [1e6, 7.5e5]],
    //          [[-7.5e5, -1e6], [7.5e5, -1e6]],
    //          [[-7.5e5, 1e6], [7.5e5, 1e6]]
    //        ]
    //      }
    //    }, {
    //      'type': 'Feature',
    //      'geometry': {
    //        'type': 'MultiPolygon',
    //        'coordinates': [
    //          [[[-5e6, 6e6], [-5e6, 8e6], [-3e6, 8e6], [-3e6, 6e6]]],
    //          [[[-2e6, 6e6], [-2e6, 8e6], [0, 8e6], [0, 6e6]]],
    //          [[[1e6, 6e6], [1e6, 8e6], [3e6, 8e6], [3e6, 6e6]]]
    //        ]
    //      }
    //    }, {
    //      'type': 'Feature',
    //      'geometry': {
    //        'type': 'GeometryCollection',
    //        'geometries': [{
    //          'type': 'LineString',
    //          'coordinates': [[-5e6, -5e6], [0, -5e6]]
    //        }, {
    //          'type': 'Point',
    //          'coordinates': [4e6, -5e6]
    //        }, {
    //          'type': 'Polygon',
    //          'coordinates': [[[1e6, -6e6], [2e6, -4e6], [3e6, -6e6]]]
    //        }]
    //      }
    //    }]
    //  };
        var vectorSource = new ol.source.Vector({
            features: (new ol.format.GeoJSON()).readFeatures(json)
        });

        var customStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'red',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255,0,0,0.2)'
            })
        })

        var vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style : customStyle
        });

        olMap.addLayer(vectorLayer);
    });


})
