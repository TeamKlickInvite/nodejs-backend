// models/Rsvp.js
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const RsvpSchema = new Schema(
  {
    // Link to the exact invitation the guest received
    relation_id: {
      type: Schema.Types.ObjectId,
      ref: "GuestGroupRelation",
      required: true,
      unique: true,               // one RSVP per invitation
    },

    // Core RSVP fields (mirrors old MySQL)
    rsvp_status: {
      type: String,
      enum: ["pending", "yes", "no", "maybe"],
      default: "pending",
    },

    // plus_one: { type: Boolean, default: false },
    plus_one_name: { type: String, trim: true },

    comments: { type: String, trim: true },

    // Which events of the group the guest is attending
    attending_events: [{ type: String}],

    // Timestamps
    responded_at: { type: Date },
  },
  { timestamps: true }
);

// Index for fast lookup by relation_id
// RsvpSchema.index({ relation_id: 1 });

export default models.Rsvp || model("Rsvp", RsvpSchema);