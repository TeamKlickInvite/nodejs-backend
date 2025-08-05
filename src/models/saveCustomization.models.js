// src/models/customizationModel.js
import mongoose from 'mongoose';

const customizationSchema = new mongoose.Schema({
  template_id: { type: mongoose.Schema.Types.ObjectId, ref: 'NewTemplate', required: true },
  user_id: { type: String, required: true }, // Could be a user email or ID
  user_inputs: {
    type: Map,
    of: String,
  }, // e.g., { "Names": "Emma & Liam", "Date": "July 25 2025" }
  generated_image_url: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

const Customization = mongoose.model('Customization', customizationSchema);
export default Customization;