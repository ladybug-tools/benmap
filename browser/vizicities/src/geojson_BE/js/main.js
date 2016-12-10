

function trackMetric(metric) {
    if (metric.value === "energy") {
        // redirect to function to recalculate data using EUI column in csv data
        // trigger setStyles
    }
    if (metric.value === "carbon"){
        // use Carbon Intensity column
    }
};

function getFilter(filter) {
    switch (filter.value) {
        case ("School") :
        // do something
        break;
        case ("Residential") :
        // do something else
        break;
    }
};


setupScene = function(object) {
  // Boston
  var coordsBoston = [42.3568138, -71.0524385];

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

  // Chroma scale for height-based colours
  var colourScale = chroma.scale(['blue', 'yellow', 'red']).domain([0,12,60]);

  // Grab our Mapzen GeoJSON tile including points, linestrings and polygons
  VIZI.geoJSONLayer('./data/geometry.json', {
    interactive: false,
    output: true,
    style: function(feature) {
      var height = 10;
      var floors = 1;

      if (feature.properties.PART_HEIGH) {
        height = feature.properties.PART_HEIGH;
      }

  	if (feature.properties.PART_FLOOR) {
        floors = feature.properties.PART_FLOOR;
      }

      var colour = colourScale(floors).hex();

      return {
        color: colour,
        height: height
      };
    },
    //pointGeometry: function(feature) {
    //  var geometry = new THREE.SphereGeometry(2, 16, 16);
    //  return geometry;
    //},
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</a>.'
  }).addTo(world);
}

drawLegend = function(object) {

}

setupScene();
