const mongoose = require('mongoose');
require('./models/MonthlyRecap');
require('./models/Employe');
require('./models/Absence');
require('./models/Workload');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/RH_management');
  
  var mrCount = await mongoose.model('MonthlyRecap').countDocuments();
  var empCount = await mongoose.model('Employe').countDocuments();
  var absCount = await mongoose.model('Absence').countDocuments();
  var wlCount = await mongoose.model('Workload').countDocuments();
  
  console.log('MonthlyRecap count:', mrCount);
  console.log('Employe count:', empCount);
  console.log('Absence count:', absCount);
  console.log('Workload count:', wlCount);
  
  if (mrCount > 0) {
    var sample = await mongoose.model('MonthlyRecap').find().limit(3);
    console.log('\nSample MonthlyRecap records:');
    sample.forEach(function(r) {
      console.log('  Name:', r.employeeName, '| Dept:', r.department, '| AD:', r.absenceDays, '| OT25:', r.overtime25, '| OT50:', r.overtime50, '| OT100:', r.overtime100);
    });
  }
  
  if (empCount > 0) {
    var sample = await mongoose.model('Employe').find().limit(3);
    console.log('\nSample Employe records:');
    sample.forEach(function(r) {
      console.log('  Name:', r.prenom, r.nom, '| Dept:', r.departement, '| AD:', r.absenceDays, '| OT25:', r.overtime25, '| OT50:', r.overtime50, '| OT100:', r.overtime100);
    });
  }

  // Check departments
  var depts = await mongoose.model('MonthlyRecap').aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]);
  console.log('\nDepartments in MonthlyRecap:', JSON.stringify(depts));
  
  var depts2 = await mongoose.model('Employe').aggregate([{ $group: { _id: "$departement", count: { $sum: 1 } } }]);
  console.log('Departments in Employe:', JSON.stringify(depts2));
  
  process.exit(0);
}

check().catch(function(err) {
  console.log('Error:', err.message);
  process.exit(1);
});