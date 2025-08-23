import shortid from "shortid";
import mongoose from "mongoose";
const InviteStatusSchema = new mongoose.Schema({
  status: { type: Number, default: 0 },   // 0=pending,1=sent,2=opened,3=responded
  medium: { type: Number, default: 0 },   // 0=NA, 1=Email, 2=SMS, 3=WhatsApp, etc.
  sentAt: { type: Date }
}, { _id: false });

const GuestGroupRelationSchema = new mongoose.Schema({
  guest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  order_id: { type: String, required: true },

  uniqueUrl: { 
    type: String, 
    default: () => `https://klickinvite.com/invite/${shortid.generate()}`
  },

  inviteStatus: {
    preInvite: { type: InviteStatusSchema, default: () => ({}) },
    invite: { type: InviteStatusSchema, default: () => ({}) },
    reminder: { type: InviteStatusSchema, default: () => ({}) },
    thankyou: { type: InviteStatusSchema, default: () => ({}) }
  },

  views: { type: Number, default: 0 },
  maxViewsPerGuest: { type: Number, default: 40 },

  createdAt: { type: Date, default: Date.now }
});

// ✅ Ye index enable karo (unique relation per guest/group/order)
GuestGroupRelationSchema.index(
  { order_id: 1, group_id: 1, guest_id: 1 }, 
  { unique: true }
);

const GuestGroupRelation =
  mongoose.models.GuestGroupRelation || mongoose.model('GuestGroupRelation', GuestGroupRelationSchema);

export default GuestGroupRelation;

