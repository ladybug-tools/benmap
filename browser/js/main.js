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


})
