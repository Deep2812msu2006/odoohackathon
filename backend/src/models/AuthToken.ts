import mongoose from 'mongoose';

const authTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// TTL index to automatically delete expired tokens
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthToken = mongoose.model('AuthToken', authTokenSchema);
