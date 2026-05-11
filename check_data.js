require('./backend/models/MonthlyRecap');
require('./backend/models/Employe');
require('./backend/models/Absence');
require('./backend/models/Workload');
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/RH_management')
  .then(async () => {
    const mrCount = await mongoose.model('MonthlyRecap').countDocuments();
    const empCount = await mongoose.model('Employe').countDocuments();
    const absCount = await mongoose.model('Absence').countDocuments();
    const wlCount = await mongoose.model('Workload').countDocuments();
    console.log('MonthlyRecap count:', mrCount);
    console.log('Employe count:', empCount);
    console.log('Absence count:', absCount);
    console.log('Workload count:', wlCount);

    if (mrCount > 0) {
      const sample = await mongoose.model('MonthlyRecap').findOne();
      console.log('Sample MonthlyRecap:', JSON.stringify(sample, null, 2));
    }
    if (empCount > 0) {
      const sample = await mongoose.model('Employe').findOne();
      console.log('Sample Employe:', JSON.stringify(sample, null, 2));
    }

    process.exit(0);
  })
  .catch(e => {
    console.log('MongoDB error:', e.message);
    process.exit(1);
  });