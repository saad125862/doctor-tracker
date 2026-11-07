import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    condition: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    nameLower: String,
    conditionLower: String,
  },
  { timestamps: true }
);

patientSchema.pre('validate', function (next) {
  this.nameLower = this.name?.toLowerCase();
  this.conditionLower = this.condition?.toLowerCase();
  next();
});

patientSchema.index({ doctor: 1, createdAt: -1 }); // a doctor's patients, newest first
patientSchema.index({ nameLower: 1 });
patientSchema.index({ conditionLower: 1, createdAt: -1 });
patientSchema.index({ gender: 1, createdAt: -1 });
patientSchema.index({ createdAt: -1 });

export const Patient = mongoose.model('Patient', patientSchema);
