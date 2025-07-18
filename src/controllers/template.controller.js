
import { Template } from "../models/Template.models.js";
import cloudinary from "../utils/cloudnary.js";
import * as fs from "fs/promises"; // Use promises for async file operations
import Joi from "joi"; // Import Joi for validation
import { unlink } from "fs/promises"; // For deleting temporary files
import * as cheerio from "cheerio"; 

export const uploadTemplate = async (req, res) => {
  try {
                             // Ensure user is authenticated
    // if (!req.user || !req.user.id) {
    //   return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    // }

    const { title, category, blockTypesAllowed } = req.body;
    const previewImageFile = req.files?.previewImage?.[0];
    const backgroundImageFile = req.files?.backgroundImage?.[0];
    const htmlFile = req.files?.html?.[0];

                            // Input validation schema using Joi
    const schema = Joi.object({
      title: Joi.string().trim().min(3).max(100).required().messages({
        "string.base": "Title must be a string",
        "string.empty": "Title is required",
        "string.min": "Title must be at least 3 characters long",
        "string.max": "Title must not exceed 100 characters",
      }),
      category: Joi.string().trim().min(3).max(50).required().messages({
        "string.base": "Category must be a string",
        "string.empty": "Category is required",
        "string.min": "Category must be at least 3 characters long",
        "string.max": "Category must not exceed 50 characters",
      }),
      blockTypesAllowed: Joi.string().required().messages({
        "string.base": "blockTypesAllowed must be a valid JSON string",
        "string.empty": "blockTypesAllowed is required",
      }),
    });

                              // Validate input
    const { error } = schema.validate({ title, category, blockTypesAllowed });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }


                          // Check required files
    if (!previewImageFile || !backgroundImageFile || !htmlFile) {
      return res.status(400).json({ success: false, message: "Missing required files (previewImage, backgroundImage, or html)" });
    }

                        // Parse blockTypesAllowed safely
    let parsedBlockTypesAllowed;
    try {
      parsedBlockTypesAllowed = JSON.parse(blockTypesAllowed);
                        // Optional: Validate parsed blockTypesAllowed (e.g., ensure it's an array of strings)
      if (!Array.isArray(parsedBlockTypesAllowed)) {
        return res.status(400).json({ success: false, message: "blockTypesAllowed must be an array" });
      }
    } catch (parseError) {
      return res.status(400).json({ success: false, message: "Invalid JSON in blockTypesAllowed" });
    }

                         // uploads file to cloudinary
    const [previewImageResult, backgroundImageResult] = await Promise.all([
      cloudinary.uploader.upload(previewImageFile.path),
      cloudinary.uploader.upload(backgroundImageFile.path),
    ]);

                      // Read HTML file asynchronously
    const baseHtml = await fs.readFile(htmlFile.path, "utf8");

                      // Create and save Template
    const newTemplate = new Template({
      title,
      category,
      previewImageUrl: previewImageResult.secure_url,
      baseHtml,
      backgroundImageUrl: backgroundImageResult.secure_url,
      blockTypesAllowed: parsedBlockTypesAllowed
    });

    await newTemplate.save();

                       // Clean up temporary files
    await Promise.all([
      unlink(previewImageFile.path).catch((err) => console.warn("Failed to delete previewImage file:", err.message)),
      unlink(backgroundImageFile.path).catch((err) => console.warn("Failed to delete backgroundImage file:", err.message)),
      unlink(htmlFile.path).catch((err) => console.warn("Failed to delete html file:", err.message)),
    ]);

    return res.status(201).json({ success: true, template: newTemplate });
  } catch (err) {
    console.error("❌ Template upload failed:", err);
    return res.status(500).json({ success: false, message: "Template upload failed", details: err.message });
  }
};
// GetAll templates
export const getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.find({})
      .select('title category previewImageUrl createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ templates });
  } catch (err) {
    console.error('❌ Error fetching templates:', err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};
// get templateby Filter
export const filterTemplates = async (req, res) => {
  try {
    const { category, title } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (title) filter.title = new RegExp(title, 'i'); // case-insensitive  
    const templates = await Template.find(filter)
      .select('title category previewImageUrl createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ templates });
  } catch (err) {
    console.error('❌ Error filtering templates:', err);
    res.status(500).json({ error: 'failed to filter all template' });
  }
};
