// models/Guest.js
import mongoose from "mongoose";
const contactSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["email", "mobile"],
      required: [true, "Contact type is required"],
    },
    value: {
      type: String,
      required: [true, "Contact value is required"],
      trim: true,
    },
    isDomestic: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false } // ✅ don’t generate separate _id for each contact
);

const guestSchema = new mongoose.Schema(
  {
    host_id: {
      type: String,
      ref: "Host",
      required: [true, "Host reference is required"],
      index: true, // ✅ faster queries by host
    },
    name: {
      type: String,
      required: [true, "Guest name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, "Display name cannot exceed 50 characters"],
    },
    contacts: {
      type: [contactSchema],
      validate: {
        validator: function (contacts) {
          // ✅ Require at least one email and one mobile
        //   const hasEmail = contacts.some((c) => c.type === "email");
          const hasMobile = contacts.some((c) => c.type === "mobile");
          return  hasMobile;
        },
        message: "Guest must have at least  one mobile contact.",
      },
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true } // ✅ auto adds createdAt & updatedAt
);

// ✅ Unique constraint: A host cannot have two guests with same email
guestSchema.index(
  { host_id: 1, "contacts.value": 1 },
  { unique: true, partialFilterExpression: { "contacts.type": "email" } }
);

export const Guest = mongoose.model("Guest", guestSchema);
