var csv = require('fast-csv');
var fs  = require('fs');

module.exports = function( config ){
  this.config = config;
  this.table   = {}; // master object here
  this.geom   = {};
  this.geomArray = [];
  this.files  = {};
  this.mergeData = function( key ){
    this.config.key = key;
    this.loadData(function(){
      console.log('loaded data to merge on key',key);
    });
  };
  this.writeOut = function(){
    var thisWrite = this;
    
    var csvStream = csv.createWriteStream({headers: true});
    var writableStream = fs.createWriteStream( thisWrite.config.out+'/table.csv' );
    
    writableStream.on("finish", function(){
      console.log("DONE!");
    });

    csvStream.pipe(writableStream);
    console.log('writing',Object.keys(thisWrite.table).length,'rows');
    for(var r in thisWrite.table){
      var row = thisWrite.table[r];
      csvStream.write( row );
    }
    csvStream.end();
    
    var ob = {
      type: "FeatureCollection",
      // features: []
      features: thisWrite.geomArray
    };
    // for(var f in thisWrite.geom){
      // var feature = thisWrite.geom[f];
      // ob.features.push(feature);
    // }
    fs.writeFile( thisWrite.config.out+'/geometry.geojson', JSON.stringify(ob));
  };
  this.loadGeojson = function( file ){
    console.log('found GeoJSON',file);
    var num = 0;
    var thisLoad = this;
    var stream = fs.readFile( thisLoad.config.dir+'/'+file, function(err,data){
      if(err)return err;
      try{
        // console.log('loaded',file,', got data');
        var ob = JSON.parse(data);
        // console.log(Object.keys(ob));
        if(ob.features){
          // console.log('features',ob.features.length)
          for(var f in ob.features){
            var feature = ob.features[f];
            thisLoad.geomArray.push({
              type: feature.type,
              geometry: feature.geometry,
              properties:{
                PARCEL_ID: feature.properties.PARCEL_ID
              }
            });
            if(feature.properties){
              if(feature.properties[thisLoad.config.key]){
                var id = feature.properties[thisLoad.config.key];
                num++;
                // thisLoad.addGeomData( 'f'+id, feature );
                // console.log(feature.properties[thisLoad.config.key]);
              }else{
                // console.log(Ojbect.keys(feature.properties));
              }
            }else{
              // console.log('no feature',feature);
            }
          }
        }else{
          // console.log(ob);
        }
        thisLoad.files[file] = 'yes';
      }catch(e){
        console.log('bad JSON:',e);
        delete thisLoad.files[file];
      }
      console.log('features saved:',num);
    });
  };
  this.loadCSV = function( file ){
    console.log('found CSV',file);
    var thisLoad = this;
    var stream = fs.createReadStream( thisLoad.config.dir+'/'+file );
    csv
      .fromStream( stream, {headers : true} )
      .on('data', function(data){
        thisLoad.handleCSVRow(data);
      })
      .on('end',function(){
        thisLoad.files[file] = 'yes';
      });
  };
  this.addGeomData  = function( id, data ){
    if(!this.geom[id]){
      this.geom[id] = data;
      return;
    }
    for(var d in data){
      // do not overwrite existing field
      if(!this.geom[id][d]){
        // console.log('writing feature',d);
        this.geom[id][d] = data[d];
      }
    }
  };
  this.addTableData = function( id, data ){
    if(!this.table[id]){
      this.table[id] = data;
      return;
    }
    for(var d in data){
      // do not overwrite existing field
      if(!this.table[id][d]){
        // console.log('writing row',d);
        this.table[id][d] = data[d];
      }
    }
  };
  this.handleCSVRow = function(data){
    var thisData = this;
    var keys = Object.keys(data);
    if( keys.indexOf( thisData.config.key ) ){
      var keyValue = data[thisData.config.key];
      if( thisData.config.ignore.indexOf( keyValue )){
        // console.log('---- skipping',keyValue);
      }
      // console.log('good row:',keyValue);
    }
    if(thisData.config && thisData.config.key && data[thisData.config.key]){
      thisData.addTableData( data[thisData.config.key], data );
    }else{
      // console.log('does not have '+thisData.config.key);
    }
  };
  this.handleDir = function(err,files,callback){
    var thisHandle = this;
    if(err)return console.log(err);
    for(var f in files){
      var file = files[f];
      var parts = file.split('.');
      var ext = parts.pop();
      switch(ext){
        case 'geojson':
          thisHandle.files[file] = 'no';
          thisHandle.loadGeojson( file );
          break;
        case 'csv':
          thisHandle.files[file] = 'no';
          thisHandle.loadCSV( file );
          break;
      }
    }
  };
  this.loadData = function( callback ){
    var thisLoad = this;
    fs.readdir( thisLoad.config.dir, function(err,files){
      thisLoad.handleDir(err,files,callback);
    });
  }
  return this;
};