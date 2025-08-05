import mongoose from "mongoose";

const templateSchema = new mongoose.Schema({
   title: { 
    type: String,
    required: true 
   },
   category: { 
    type: String, 
    required: true 
   },
  pimage_url: {
    type: String,
    required: true // URL of the preview image from Cloudinary
  },
  bimage_url: {
    type: String,
    required: true // URL of the background image from Cloudinary
  },
  text_fields: [
    {
      label: { type: String, required: true }, // e.g., "Names"
      default_text: { type: String, required: true }, // e.g., "Bride & Groom"
      x: { type: Number, required: true }, // x-coordinate from tap
      y: { type: Number, required: true }, // y-coordinate from tap
      font: { type: String, required: true }, // e.g., "Cursive"
      size: { type: Number, required: true }, // e.g., 24
      color: { type: String, required: true }, // e.g., "brown"
      style: { type: String } // Optional, e.g., "bold"
    }
  ]
});

const NewTemplate = mongoose.model('NewTemplate', templateSchema);
export default NewTemplate