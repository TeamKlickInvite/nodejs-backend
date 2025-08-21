const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const validator = require('validator');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/klickinvite', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Twilio and Nodemailer Setup
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const transporter = nodemailer.createTransport({
  service: 'SES',
  auth: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

// Mongoose Schemas
const { Schema } = mongoose;

const hostSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, validate: validator.isEmail },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const guestSchema = new Schema({//
  hostId: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
  name: { type: String, required: true },
  displayName: String,
  contacts: [{
    type: { type: String, enum: ['email', 'mobile'], required: true },
    value: { type: String, required: true },
    isDomestic: { type: Boolean, default: true }
  }],
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new Schema({
  code: { type: String, unique: true, sparse: true }, // Optional for UI (e.g., ORDER001)
  hostId: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
  eventCategory: Number,
  theme: Number,
  status: { type: String, default: 'active' },
  domainSubdomainName: String,
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  sendInviteAllowed: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const groupSchema = new Schema({//
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  name: { type: String, required: true },
  category: { type: Number, enum: [1, 2, 3] }, // 1: family, 2: friends, 3: coworker
  settings: {
    askRsvp: { type: Boolean, default: false },
    showGallery: { type: Number, enum: [0, 1, 2], default: 0 },
    allowComments: { type: Boolean, default: false },
    onlineShagun: { type: Boolean, default: false },
    flipbookHash: String,
    ecard: { pics: [String], config: String },
    audio: { isStock: Boolean, id: String, autoplay: Boolean, playInLoop: Boolean }
  },
  createdAt: { type: Date, default: Date.now }
});

const guestGroupRelationSchema = new Schema({//
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  uniqueUrl: { type: String, unique: true, default: () => `https://klickinvite.com/invite/${shortid.generate()}` },
  urlEnabled: { type: Boolean, default: true },
  inviteStatus: {
    preInvite: { status: { type: Number, default: 0 }, medium: Number, sentAt: Date },
    invite: { status: { type: Number, default: 0 }, medium: Number, sentAt: Date },
    reminder: { status: { type: Number, default: 0 }, medium: Number, sentAt: Date },
    thankyou: { status: { type: Number, default: 0 }, medium: Number, sentAt: Date }
  },
  views: { type: Number, default: 0 },
  maxViewsPerGuest: { type: Number, default: 40 },
  createdAt: { type: Date, default: Date.now }
});

const inviteLogSchema = new Schema({
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  transactionId: String,
  medium: { type: String, enum: ['sms', 'email', 'whatsapp'], required: true },
  type: { type: String, enum: ['preinvite', 'invite', 'reminder', 'thankyou'], required: true },
  content: { type: String, required: true },
  receiverAddress: String,
  senderAddress: String,
  serviceUsed: String,
  status: String,
  response: String,
  createdAt: { type: Date, default: Date.now }
});

const inviteOpenLogSchema = new Schema({
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  medium: { type: String, enum: ['sms', 'email', 'whatsapp'], required: true },
  type: { type: String, enum: ['preinvite', 'invite', 'reminder', 'thankyou'], required: true },
  allowedViewing: { type: Number, default: 1 },
  browser: String,
  deviceType: String,
  os: String,
  ip: String,
  pageViews: {
    wishes: { type: Number, default: 0 },
    gallery: { type: Number, default: 0 },
    invite: { type: Number, default: 0 },
    home: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

const rsvpResponseSchema = new Schema({
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  eventId: Number,
  responses: {
    attendance: { type: Number, enum: [0, 1, 2] },
    accompanyingPersons: Number,  
    foodPreference: { type: Number, enum: [1, 2] },
    arrivalDateTime: Date
  },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for Performance
guestGroupRelationSchema.index({ uniqueUrl: 1 });
inviteLogSchema.index({ guestId: 1, orderId: 1, medium: 1, type: 1 });
inviteOpenLogSchema.index({ guestId: 1, orderId: 1 });
guestSchema.index({ hostId: 1 }); 
orderSchema.index({ hostId: 1 });
groupSchema.index({ orderId: 1 });

// Models
const Host = mongoose.model('Host', hostSchema);
const Guest = mongoose.model('Guest', guestSchema);
const Order = mongoose.model('Order', orderSchema);
const Group = mongoose.model('Group', groupSchema);
const GuestGroupRelation = mongoose.model('GuestGroupRelation', guestGroupRelationSchema);
const InviteLog = mongoose.model('InviteLog', inviteLogSchema);
const InviteOpenLog = mongoose.model('InviteOpenLog', inviteOpenLogSchema);
const RSVPResponse = mongoose.model('RSVPResponse', rsvpResponseSchema);

// Optional Counter for Order Code
const counterSchema = new Schema({ _id: String, seq: Number });
const Counter = mongoose.model('Counter', counterSchema);

orderSchema.pre('save', async function (next) {
  if (!this.code) {
    const counter = await Counter.findByIdAndUpdate(
      'order',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.code = `ORDER${String(counter.seq).padStart(3, '0')}`;
  }
  next();
});

// API Endpoints
// Add Guest
app.post('/hosts/:hostId/guests', async (req, res) => {
  const { name, displayName, contacts } = req.body;
  const { hostId } = req.params;
  try {
    if (!contacts.every(c => validator.isEmail(c.value) || validator.isMobilePhone(c.value))) {
      return res.status(400).json({ error: 'Invalid contact details' });
    }
    const guest = await Guest.create({ hostId, name, displayName, contacts, enabled: true });
    res.status(201).json(guest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Order
app.post('/hosts/:hostId/orders', async (req, res) => {
  const { eventCategory, theme, domainSubdomainName } = req.body;
  const { hostId } = req.params;
  try {
    const order = await Order.create({ hostId, eventCategory, theme, domainSubdomainName });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Group
app.post('/orders/:orderId/groups', async (req, res) => {
  const { name, category, settings } = req.body;
  const { orderId } = req.params;
  try {
    const group = await Group.create({ orderId, name, category, settings });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign Guests to Group
app.post('/orders/:orderId/groups/:groupId/guests', async (req, res) => {
  const { guestIds } = req.body;
  const { groupId } = req.params;
  try {
    const relations = await Promise.all(
      guestIds.map(guestId =>
        GuestGroupRelation.create({ guestId, groupId })
      )
    );
    res.status(201).json(relations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send Invitations
app.post('/orders/:orderId/invites', async (req, res) => {
  const { groupId, guestIds, medium, type, content } = req.body;
  const { orderId } = req.params;
  try {
    const relations = await GuestGroupRelation.find({ groupId, guestId: { $in: guestIds } })
      .populate('guest')
      .populate({ path: 'group', populate: { path: 'order' } });
    
    for (const relation of relations) {
      if (!relation.group.order.sendInviteAllowed) continue;
      const contact = relation.guest.contacts.find(c => c.type === medium);
      if (!contact) continue;

      let response;
      if (medium === 'sms') {
        response = await twilioClient.messages.create({
          body: `${content} ${relation.uniqueUrl}`,
          from: process.env.TWILIO_NUMBER,
          to: contact.value
        });
      } else if (medium === 'whatsapp') {
        response = await twilioClient.messages.create({
          body: `${content} ${relation.uniqueUrl}`,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${contact.value}`
        });
      } else if (medium === 'email') {
        response = await transporter.sendMail({
          from: 'no-reply@klickinvite.com',
          to: contact.value,
          subject: `Invitation: ${relation.group.name}`,
          html: `${content} <a href="${relation.uniqueUrl}">View Invite</a>`
        });
      }

      await InviteLog.create({
        guestId: relation.guestId,
        orderId,
        transactionId: response?.sid,
        medium,
        type,
        content: `${content} ${relation.uniqueUrl}`,
        receiverAddress: contact.value,
        senderAddress: medium === 'email' ? 'no-reply@klickinvite.com' : process.env.TWILIO_NUMBER,
        serviceUsed: medium === 'email' ? 'AWS-SES' : 'Twilio',
        status: response?.status || 'sent',
        response: JSON.stringify(response)
      });

      await GuestGroupRelation.updateOne(
        { _id: relation._id },
        { $set: { [`inviteStatus.${type}`]: { status: 1, medium, sentAt: new Date() } } }
      );
    }
    res.status(200).json({ message: 'Invitations sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track Invitation Opens
app.get('/invites/:uniqueUrl', async (req, res) => {
  const { uniqueUrl } = req.params;
  try {
    const relation = await GuestGroupRelation.findOne({ uniqueUrl })
      .populate('guest')
      .populate({ path: 'group', populate: { path: 'order' } });
    if (!relation || !relation.urlEnabled) {
      return res.status(404).json({ error: 'Invite not found or disabled' });
    }
    if (relation.views >= relation.maxViewsPerGuest) {
      await InviteOpenLog.create({
        guestId: relation.guestId,
        orderId: relation.group.orderId,
        medium: 'unknown',
        type: 'invite',
        allowedViewing: -1,
        browser: req.headers['user-agent'],
        ip: req.ip
      });
      return res.status(403).json({ error: 'View limit exceeded' });
    }

    await GuestGroupRelation.updateOne(
      { _id: relation._id },
      { $inc: { views: 1 } }
    );

    await InviteOpenLog.create({
      guestId: relation.guestId,
      orderId: relation.group.orderId,
      medium: 'unknown',
      type: 'invite',
      allowedViewing: 1,
      browser: req.headers['user-agent'],
      deviceType: 'unknown',
      os: 'unknown',
      ip: req.ip,
      pageViews: { invite: 1 }
    });

    res.json({ message: 'Invitation page', guest: relation.guest.name, group: relation.group.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit RSVP
app.post('/invites/:uniqueUrl/rsvp', async (req, res) => {
  const { uniqueUrl } = req.params;
  const { responses } = req.body;
  try {
    const relation = await GuestGroupRelation.findOne({ uniqueUrl }).populate('group');
    if (!relation) return res.status(404).json({ error: 'Invite not found' });

    await RSVPResponse.create({
      guestId: relation.guestId,
      orderId: relation.group.orderId,
      eventId: relation.group.orderId, // Adjust if separate eventId
      responses
    });
    res.status(201).json({ message: 'RSVP submitted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics Endpoint
app.get('/orders/:orderId/analytics', async (req, res) => {
  const { orderId } = req.params;
  try {
    const stats = await InviteOpenLog.aggregate([
      { $match: { orderId: new mongoose.Types.ObjectId(orderId) } },
      {
        $group: {
          _id: '$medium',
          totalViews: { $sum: '$pageViews.invite' },
          uniqueGuests: { $addToSet: '$guestId' }
        }
      },
      { $project: { medium: '$_id', totalViews: 1, uniqueGuests: { $size: '$uniqueGuests' } } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));