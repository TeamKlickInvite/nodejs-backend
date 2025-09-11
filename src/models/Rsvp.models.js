// models/RSVP.js
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const RSVPSchema = new Schema(
  {
    guest_id: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
    group_id: { type: Schema.Types.ObjectId, ref: "Group", required: true },

    // ❌ Old (ObjectId): order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true }
    // ✅ New (String - because Frappe manages it)
    order_id: { type: String, required: true },

    // ❌ Old: event_id: { type: Schema.Types.ObjectId, required: true }
    // ✅ New (String)
    event_id: { type: String, required: true },

    response: {
      type: String,
      enum: ["attending", "not_attending", "maybe"],
      required: true,
    },

    details: { type: Object },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // this auto-handles createdAt & updatedAt
  }
);

// Unique RSVP per guest per event + order
RSVPSchema.index({ order_id: 1, guest_id: 1, event_id: 1 }, { unique: true });

export default models.RSVP || model("RSVP", RSVPSchema);
