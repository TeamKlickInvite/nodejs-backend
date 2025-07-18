// File: models/Card.js
import mongoose from 'mongoose';
const cardSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  // userId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User'
  // },
  isDraft: {
    type: Boolean,
    default: true
  },
  layoutData: {
    type: Object,
    required: true
  },
  renderedHtml: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Card = mongoose.model('Card', cardSchema);
