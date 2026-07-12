import mongoose from 'mongoose';

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

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
