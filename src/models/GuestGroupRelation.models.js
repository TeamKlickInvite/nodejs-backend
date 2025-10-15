import mongoose from "mongoose";
import shortid from "shortid";

const { Schema, model, models } = mongoose;

const InviteStatusSchema = new Schema(
  {
    status: { type: Number, default: 0 }, // 0=pending,1=sent,2=opened,3=responded
    medium: { type: Number, default: 0 }, // 0=NA, 1=Email, 2=SMS, 3=WhatsApp, etc.
    sentAt: { type: Date },
  },
  { _id: false }
);

const GuestGroupRelationSchema = new Schema({
  guest_id: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
  group_id: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  order_id: { type: String, required: true }, 
  uniqueCode: {
    type: String,
    unique: true,
    default: () =>shortid.generate(),
  },

  inviteStatus: {
    preInvite: { type: InviteStatusSchema, default: () => ({}) },
    invite: { type: InviteStatusSchema, default: () => ({}) },
    reminder: { type: InviteStatusSchema, default: () => ({}) },
    thankyou: { type: InviteStatusSchema, default: () => ({}) },
  },
  views: { type: Number, default: 0 },
  maxViewsPerGuest: { type: Number, default: 40 },
  createdAt: { type: Date, default: Date.now },
});

// unique per guest/group/order/event
GuestGroupRelationSchema.index(
  { order_id: 1, group_id: 1, guest_id: 1, event_id: 1 },
  { unique: true }
);

GuestGroupRelationSchema.virtual("inviteUrl").get(function () {
  return `https://klickinvite.com/invite/${this.uniqueCode}`;
});

export default models.GuestGroupRelation ||
  model("GuestGroupRelation", GuestGroupRelationSchema);
