const mongoose = require('mongoose');
require('./models/MonthlyRecap');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/RH_management');
  
  // Check total absence days
  var totalAD = await mongoose.model('MonthlyRecap').aggregate([
    { $group: { _id: null, total: { $sum: "$absenceDays" } } }
  ]);
  console.log('Total absenceDays:', totalAD[0]?.total || 0);
  
  // Check total overtime
  var totalOT = await mongoose.model('MonthlyRecap').aggregate([
    { $group: { _id: null, 
      ot25: { $sum: "$overtime25" },
      ot50: { $sum: "$overtime50" },
      ot100: { $sum: "$overtime100" }
    }}
  ]);
  if (totalOT[0]) {
    console.log('Total OT25:', totalOT[0].ot25, 'OT50:', totalOT[0].ot50, 'OT100:', totalOT[0].ot100);
    console.log('Total OT hours:', totalOT[0].ot25 + totalOT[0].ot50 + totalOT[0].ot100);
  }

  // Check how many have absence > 0
  var withAbs = await mongoose.model('MonthlyRecap').countDocuments({ absenceDays: { $gt: 0 } });
  console.log('Records with absence > 0:', withAbs);

  // Check how many have overtime > 0
  var withOT = await mongoose.model('MonthlyRecap').find({
    $or: [{ overtime25: { $gt: 0 } }, { overtime50: { $gt: 0 } }, { overtime100: { $gt: 0 } }]
  }).countDocuments();
  console.log('Records with overtime > 0:', withOT);

  // Check top 5 by absence days
  var topAbs = await mongoose.model('MonthlyRecap').find().sort({ absenceDays: -1 }).limit(5);
  console.log('\nTop 5 by absence:');
  topAbs.forEach(function(r) {
    console.log('  ', r.employeeName, '| Dept:', r.department, '| Absence:', r.absenceDays);
  });

  // Check top 5 by overtime
  var topOT = await mongoose.model('MonthlyRecap').find({
    $or: [{ overtime25: { $gt: 0 } }, { overtime50: { $gt: 0 } }, { overtime100: { $gt: 0 } }]
  }).sort({ overtime25: -1, overtime50: -1, overtime100: -1 }).limit(5);
  console.log('\nTop 5 by overtime:');
  topOT.forEach(function(r) {
    var total = (r.overtime25 || 0) + (r.overtime50 || 0) + (r.overtime100 || 0);
    console.log('  ', r.employeeName, '| Dept:', r.department, '| OT:', total, '(25:', r.overtime25, '50:', r.overtime50, '100:', r.overtime100, ')');
  });

  process.exit(0);
}

check().catch(function(err) {
  console.log('Error:', err.message);
  process.exit(1);
});