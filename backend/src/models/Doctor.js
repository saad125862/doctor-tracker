import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    // values for admin-defined custom fields, keyed by CustomField.key
    custom: { type: mongoose.Schema.Types.Mixed, default: {} },
    // lowercase copies power fast, index-backed, case-insensitive prefix search
    nameLower: String,
    specializationLower: String,
    hospitalLower: String,
  },
  { timestamps: true }
);

doctorSchema.pre('validate', function (next) {
  this.nameLower = this.name?.toLowerCase();
  this.specializationLower = this.specialization?.toLowerCase();
  this.hospitalLower = this.hospital?.toLowerCase();
  next();
});

doctorSchema.index({ email: 1 }, { unique: true });
doctorSchema.index({ nameLower: 1 });
doctorSchema.index({ specializationLower: 1, createdAt: -1 });
doctorSchema.index({ hospitalLower: 1, createdAt: -1 });
doctorSchema.index({ createdAt: -1 });

export const Doctor = mongoose.model('Doctor', doctorSchema);
