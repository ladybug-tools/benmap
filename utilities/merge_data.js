var fs = require('fs');

//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
 
//end_parsed will be emitted once parsing finished 
converter.on("end_parsed", function (jsonArray) {
   console.log(jsonArray); //here is your result jsonarray 
});
 
//read from file 
require("fs").createReadStream("./file.csv").pipe(converter);



module.exports = {
  
  fs.readdir('./data',function(err,files){
    if(err)return console.log(err);
    for(var f in files){
      var file = files[f];
      console.log('found file',file);
      fs.createReadStream().pipe(converter);
    }
  });

};