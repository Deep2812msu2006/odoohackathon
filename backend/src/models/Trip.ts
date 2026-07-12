import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  source: { type: String, required: true },
  destination: { type: String, required: true },
  vehicle_id: { type: String, required: true },
  driver_id: { type: String, required: true },
  cargo_weight: { type: Number, required: true },
  planned_distance: { type: Number, required: true },
  actual_distance: { type: Number },
  fuel_consumed: { type: Number },
  status: { type: String, required: true, default: 'DRAFT' },
  dispatched_at: { type: Date },
  completed_at: { type: Date },
}, { timestamps: true });

export const Trip = mongoose.model('Trip', tripSchema);
