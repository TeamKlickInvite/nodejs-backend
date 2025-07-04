// File: models/Card.js
import mongoose from 'mongoose';

const blockContentSchema = new mongoose.Schema({
  blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  type: { type: String, enum: ['text', 'image', 'chart'], required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true }, // varies by block type
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  size: {
    width: { type: Number },
    height: { type: Number }
  }
}, { _id: false });

const layoutDataSchema = new mongoose.Schema({
  data: { type: mongoose.Schema.Types.Mixed }, // global values like {{eventName}}, etc.
  blocks: [blockContentSchema]
}, { _id: false });

const cardSchema = new mongoose.Schema({
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
  layoutData: { type: layoutDataSchema, required: true },
  finalHtml: { type: String },
  isDraft: { type: Boolean, default: true }
}, { timestamps: true });

export const Card = mongoose.model('Card', cardSchema);
