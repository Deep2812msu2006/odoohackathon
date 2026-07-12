const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const vehicleSchema = new mongoose.Schema({
  registration_no: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  max_load_capacity: Number,
  odometer: { type: Number, default: 0 },
  acquisition_cost: Number,
  status: { type: String, default: 'Active' },
  region: String,
}, { timestamps: true });

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  license_number: { type: String, required: true, unique: true },
  license_category: String,
  license_expiry_date: { type: Date, required: true },
  contact_number: String,
  safety_score: { type: Number, default: 100 },
  status: { type: String, default: 'Available' },
  notes: String,
}, { timestamps: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Driver = mongoose.model('Driver', driverSchema);

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops';
    console.log('Connecting to', mongoUri);
    await mongoose.connect(mongoUri);
    
    console.log('Clearing old data...');
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    
    console.log('Inserting seed data...');
    
    const vehicles = await Vehicle.insertMany([
      { registration_no: 'TRK-1001', name: 'Volvo FH16', type: 'Heavy Truck', max_load_capacity: 40000, odometer: 125000, acquisition_cost: 150000, status: 'Active', region: 'North' },
      { registration_no: 'TRK-1002', name: 'Scania R500', type: 'Heavy Truck', max_load_capacity: 38000, odometer: 89000, acquisition_cost: 140000, status: 'In Maintenance', region: 'South' },
      { registration_no: 'VAN-2001', name: 'Mercedes Sprinter', type: 'Delivery Van', max_load_capacity: 3500, odometer: 45000, acquisition_cost: 45000, status: 'Active', region: 'East' }
    ]);
    
    const drivers = await Driver.insertMany([
      { name: 'John Smith', license_number: 'DL-987654', license_category: 'Class A', license_expiry_date: new Date('2028-05-15'), contact_number: '+1-555-0101', safety_score: 98, status: 'Available' },
      { name: 'Sarah Johnson', license_number: 'DL-123456', license_category: 'Class A', license_expiry_date: new Date('2027-11-22'), contact_number: '+1-555-0102', safety_score: 100, status: 'On Trip' }
    ]);

    console.log(`Successfully inserted ${vehicles.length} vehicles and ${drivers.length} drivers!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
