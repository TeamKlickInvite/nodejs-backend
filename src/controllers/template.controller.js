
import { Template } from "../models/Template.models.js"
import cloudinary from "../utils/cloudnary.js";
// Code for updating the template
export const uploadTemplate = async (req, res) => {
  try {
    const { title, category, blockTypesAllowed } = req.body;

    const previewImageFile = req.files.previewImage?.[0];
    const backgroundImageFile = req.files.backgroundImage?.[0];
    const htmlFile = req.files.html?.[0];
    console.log(title)
    console.log(category)
    console.log(blockTypesAllowed)
    console.log(previewImageFile)
    console.log(backgroundImageFile)
    console.log(htmlFile)

    if (!previewImageFile || !backgroundImageFile || !htmlFile) {
      return res.status(400).json({ message: 'Missing required files' });
    }

    // Upload images to cloudinary
    const previewImageResult = await cloudinary.uploader.upload(previewImageFile.path);
    const backgroundImageResult = await cloudinary.uploader.upload(backgroundImageFile.path);

    const baseHtml = fs.readFileSync(htmlFile.path, 'utf8');

    const newTemplate = new Template({
      title,
      category,
      blockTypesAllowed: JSON.parse(blockTypesAllowed),
      previewImageUrl: previewImageResult.secure_url,
      backgroundImageUrl: backgroundImageResult.secure_url,
      baseHtml,
    });

    await newTemplate.save();

    res.status(201).json({ success: true, template: newTemplate });
  } catch (err) {
    console.error('Template upload failed:', err);
    res.status(500).json({ success: false, error: 'Template upload failed' });
  }
};

// Code for reusable block
export const createBlock = async (req, res) => {
  try {
    const { name, type, html, css, defaultContent } = req.body;

    const newBlock = new Block({
      name,
      type,
      html,
      css,
      defaultContent: defaultContent || {}
    });

    await newBlock.save();
    res.status(201).json({ message: 'Block created successfully', block: newBlock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create block' });
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



























































