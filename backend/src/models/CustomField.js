import mongoose from 'mongoose';

export const FIELD_TYPES = ['text', 'longtext', 'number', 'date', 'dropdown', 'boolean'];
export const ENTITIES = ['doctor', 'patient'];

/** Admin-defined extra field for the doctor or patient forms. Values live on the record under `custom[key]`. */
const customFieldSchema = new mongoose.Schema(
  {
    entity: { type: String, enum: ENTITIES, required: true },
    key: { type: String, required: true }, // stable slug used as the storage key; never changes after creation
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: FIELD_TYPES, required: true },
    options: { type: [String], default: [] }, // dropdown choices
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    archived: { type: Boolean, default: false }, // "deleted": hidden everywhere but saved values are kept
  },
  { timestamps: true }
);

customFieldSchema.index({ entity: 1, key: 1 }, { unique: true });
customFieldSchema.index({ entity: 1, archived: 1, order: 1 });

export const CustomField = mongoose.model('CustomField', customFieldSchema);
