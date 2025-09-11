// models/CustomMsgFormat.js
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const CustomMsgFormatSchema = new Schema(
  {
    // 👇 String because order_id & event_id come from Frappe
    order_id: { type: String, required: true },
    event_id: { type: String, required: true }, 

    msg_medium: { type: Number, enum: [0, 1], required: true }, 
    // 0 = SMS, 1 = Email

    invite_type: { type: Number, enum: [0, 1, 2, 3], required: true }, 
    // 0 = preinvite, 1 = invite, 2 = reminder, 3 = thank_you_msg

    msg_text: { type: String, required: true }, 
    // e.g. "Hi [guest_name]! Join [event_name] at [starts_at]! Link: [unique_base_url]"
  },
  { timestamps: true } // auto createdAt & updatedAt
);

// ✅ Prevent duplicate msg format for same order + event + medium + type
CustomMsgFormatSchema.index(
  { order_id: 1, event_id: 1, msg_medium: 1, invite_type: 1 },
  { unique: true }
);

export default models.CustomMsgFormat || model("CustomMsgFormat", CustomMsgFormatSchema);
