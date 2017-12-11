var MergeUtility = require('./utilities/merge_data');

merger = new MergeUtility({
  // key: 'Tax Parcel',
  key: 'PARCEL_ID',
  // key: 'Reported',
  ignore: [
    'Not Available'
  ],
  dir: './utilities/input',
  out: './utilities/output'
})

merger.mergeData( 'PARCEL_ID' );