import mongoose from 'mongoose';

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

export const Driver = mongoose.model('Driver', driverSchema);
