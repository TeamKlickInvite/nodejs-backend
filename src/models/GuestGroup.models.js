import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  order_id: {
    type: String,
    ref: "Order",
    required: true
  }, // Reference to Order

  name: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: String, // 1: family, 2: friends, 3: coworker
    required: true
  },

  // settings: {
  //   askRsvp: { type: Boolean, default: false },
  //   showGallery: {
  //     type: Number,
  //     enum: [0, 1, 2], // 0: disabled, 1: view, 2: view/upload
  //     default: 0
  //   },
  //   allowComments: { type: Boolean, default: false },
  //   onlineShagun: { type: Boolean, default: false },
  //   flipbookHash: { type: String },

  //   ecard: {
  //     pics: [String], // Array of image URLs
  //     config: { type: String }
  //   },

  //   audio: {
  //     isStock: { type: Boolean, default: false },
  //     id: { type: String },
  //     autoplay: { type: Boolean, default: false },
  //     playInLoop: { type: Boolean, default: false }
  //   }
  // },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware: auto-update updatedAt
GroupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Group = mongoose.model("Group", GroupSchema);
export default Group;
