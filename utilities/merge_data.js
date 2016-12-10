var csv = require('fast-csv');
var fs  = require('fs');

module.exports = function( config ){
  this.config = config;
  this.data   = {}; // master object here
  this.addData = function( id, data ){
    if(!this.data[id]){
      this.data[id] = data;
      return;
    }
    for(var d in data){
      // do not overwrite existing field
      if(!this.data[id][d]){
        console.log('writing row',d);
        this.data[id][d] = data[d];
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
          console.log('found geojson');
          break;
        case 'csv':
          console.log('found CSV',file);
          var stream = fs.createReadStream( thisHandle.config.dir+'/'+file );
          csv
            .fromStream( stream, {headers : true} )
            .on('data', function(data){
              thisHandle.handleCSVRow(data);
            })
            .on('end',function(){
              console.log('CSV loaded');
            });
          break;
      }
    }
    callback();
  };
  this.loadData = function( callback ){
    var thisLoad = this;
    fs.readdir( thisLoad.config.dir, function(err,files){
      thisLoad.handleDir(err,files,callback);
    });
  }
  return this;
};