import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  previewImageUrl: { type: String, required: true },
  category: { type: String, required: true },
  baseHtml: { type: String, required: true },
  backgroundImageUrl:{type:String, required:true},
  blockTypesAllowed: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Template = mongoose.model('Template', templateSchema);
