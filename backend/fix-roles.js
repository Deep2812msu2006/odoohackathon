const mongoose = require('mongoose');

async function fixRoles() {
  await mongoose.connect('mongodb://127.0.0.1:27017/transitops');
  const db = mongoose.connection.db;
  
  await db.collection('users').updateMany({ role: 'FLEET MANAGER' }, { $set: { role: 'FLEET_MANAGER' } });
  await db.collection('users').updateMany({ role: 'SAFETY OFFICER' }, { $set: { role: 'SAFETY_OFFICER' } });
  await db.collection('users').updateMany({ role: 'FINANCIAL ANALYST' }, { $set: { role: 'FINANCIAL_ANALYST' } });
  
  console.log('Fixed DB roles');
  process.exit(0);
}

fixRoles();
