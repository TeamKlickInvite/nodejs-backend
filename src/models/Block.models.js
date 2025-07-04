import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'chart', 'table', 'rsvp'], required: true },// Ask from sir
  html: { type: String, required: true },
  css: { type: String },
  defaultContent: { type:
  mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export const Block = mongoose.model('Block', blockSchema);
