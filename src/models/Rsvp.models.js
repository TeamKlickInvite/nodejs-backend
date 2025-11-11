// models/Rsvp.js
import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const RsvpSchema = new Schema(
  {
    // 1️⃣ One RSVP per GuestGroupRelation
    relation_id: {
      type: Schema.Types.ObjectId,
      ref: "GuestGroupRelation",
      required: true,
      unique: true,
    },

    // 2️⃣ RSVP core status
    rsvp_status: {
      type: String,
      enum: ["pending", "yes", "no", "maybe"],
      default: "pending",
    },

    // 3️⃣ Dynamic RSVP answers
    customAnswers: {
      type: Map,
      of: String, // Example: {"food_choice": "Veg", "plus_one_name": "Ravi"}
    },

    // 4️⃣ Guests and comments
    numberOfGuests: { type: Number, default: 1 },
    comments: { type: String, trim: true },

    // 5️⃣ Attending event list (like “Reception”, “Ceremony”)
    attending_events: [{ type: String }],

    // 6️⃣ Timestamp when RSVP submitted
    responded_at: { type: Date },
  },
  { timestamps: true }
);

// 🔍 Optional: useful for analytics and faster lookup
//  RsvpSchema.index({ relation_id: 1 });

export default models.Rsvp || model("Rsvp", RsvpSchema);
 