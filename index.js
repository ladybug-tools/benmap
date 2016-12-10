var MergeUtility = require('./utilities/merge_data');

mergeData = new MergeUtility({
  key: 'Tax Parcel',
  // key: 'PARCEL_ID',
  // key: 'Reported',
  ignore: [
    'Not Available'
  ],
  dir: './resources'
})

mergeData.loadData( function(){
  console.log('load data done');
});