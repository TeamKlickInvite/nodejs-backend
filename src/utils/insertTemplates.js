import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config(); // ✅ Must be at the very top

import Template from '../models/card.models.js';
import connectDB from '../db/db.js';
import TemplateHtml from '../models/TemplateHtml.models.js';

connectDB()
  .then(async () => {
    const html1 = await TemplateHtml.create({
      htmlCode: "<div><h1>{{name}}</h1><p>{{message}}</p></div>",
    });

    const html2 = await TemplateHtml.create({
      htmlCode: "<div><h2>i loveehrfu  e{{chand}}</h2>   h2;dsf;</div>",
    });

    const templates = [
      {
        name: "Golden Wedding Card",
        type: "wedding",
        previewImage: "https://cdn.klickinvite.com/images/wedding1.png",
        fields: ["name", "date", "venue", "message"],
        htmlRef: html1._id,
        price: {
          S: 49,
          M: 99,
          L: 149
        }
      },
      {
        name: "Birthday Blast",
        type: "birthday",
        previewImage: "https://cdn.klickinvite.com/images/birthday1.png",
        fields: ["name", "date", "venue"],
        htmlRef: html2._id,
        price: {
          S: 39,
          M: 79,
          L: 119
        }
      }
    ];

    await Template.insertMany(templates);
    console.log("Templates with prices inserted ✅");

    mongoose.disconnect();
  })
  .catch(err => console.error("❌ Error inserting templates:", err));
