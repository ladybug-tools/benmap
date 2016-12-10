var csv = require('fast-csv');
var fs  = require('fs');

module.exports = function( config ){
  this.config = config;
  this.table   = {}; // master object here
  this.geom   = {};
  this.files  = {};
  this.writeOut = function(){
    fs.writeFile();
  };
  this.loadGeojson = function( file ){
    var thisLoad = this;
    var stream = fs.readFile( thisLoad.config.dir+'/'+file, function(err,data){
      if(err)return err;
      try{
        var ob = JSON.parse(data);
        console.log(Object.keys(ob));
        thisLoad.files[file] = 'yes';
      }catch(e){
        console.log('bad JSON:',e);
        delete thisLoad.files[file];
      }
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
  this.addData = function( id, data ){
    if(!this.table[id]){
      this.table[id] = data;
      return;
    }
    for(var d in data){
      // do not overwrite existing field
      if(!this.table[id][d]){
        console.log('writing row',d);
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
    if(thisData.config && thisData.config.key && thisData.data[thisData.config.key]){
      // console.log('has key!');
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