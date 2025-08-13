import NewTemplate from "../models/NewTemplate.models.js";
import cloudinary from "../utils/cloudnary.js";
import path from 'path';
import Customization from "../models/saveCustomization.models.js";

const createTemplate = async (req, res) => {
  try {
    // Check if files are uploaded
    if (!req.files || !req.files.previewImage || !req.files.backgroundImage) {
      return res.status(400).json({ message: 'Both preview and background images are required!' });
    }
    const { previewImage, backgroundImage } = req.files;
    const { title, category, text_fields } = req.body;

    // Validate required fields
    if (!title || !category || !text_fields) {
      return res.status(400).json({ message: 'Title, category, and text fields are required!' });
    }
    // Upload preview image to Cloudinary
    const pimageUpload = await cloudinary.uploader.upload(previewImage[0].path, {
      public_id: `templates/${path.parse(previewImage[0].filename).name}`,
    });

    const pimage_url = pimageUpload.secure_url;
    // Upload background image to Cloudinary
    const bimageUpload = await cloudinary.uploader.upload(backgroundImage[0].path, {
      public_id: `templates/${path.parse(backgroundImage[0].filename).name}`,
    });
    const bimage_url = bimageUpload.secure_url;
    // Create new template
    const template = new NewTemplate({
      // template_id: `${title.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`, // Generate unique ID
      title,
      category,
      pimage_url,
      bimage_url,
      text_fields: JSON.parse(text_fields), // Parse text_fields from request body
    });
    // Save to database
    const savedTemplate = await template.save();
    res.status(201).json({
      message: 'Template created successfully',
      template: savedTemplate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating template', error: error.message });
  }
};


export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({ message: 'Template ID is required!' });
    }

    // Fetch template from DB
    const template = await NewTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Return template data
    res.status(200).json({
      templateId: template._id,
      backgroundUrl: template.bimage_url, // background image URL
      thumbnailUrl: template.pimage_url,  // preview/thumbnail image URL
      fields: template.text_fields        // array of text fields
    });

  } catch (error) {
    console.error('Error in getTemplateById:', error);
    res.status(500).json({
      message: 'Error retrieving template',
      error: error.message
    });
  }
};



export const saveCustomization = async (req, res) => {
  try {
    const { template_id, user_id, user_inputs } = req.body;

    // Validation
    if (!template_id || !user_id || !user_inputs) {
      return res.status(400).json({ message: 'Template ID, user ID, and user inputs are required!' });
    }

    // Fetch template
    const template = await NewTemplate.findById(template_id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Generate Cloudinary transformation overlays
    const transformations = template.text_fields.map(field => {
      const text = encodeURIComponent(user_inputs[field.label] || field.default_text || '');
      const font = field.font || 'Arial';
      const size = field.size || 20;
      const style = field.style || ''; // e.g., bold
      const x = field.x || 0;
      const y = field.y || 0;
      const color = (field.color || '000000').replace(/^#/, ''); // remove "#" if present
      return `l_text:${font}_${size}_${style}:${text},co_rgb:${color},x_${x},y_${y},g_north_west,fl_layer_apply`;
    }).join('/');

    // Build Cloudinary URL
    const [baseUrl, afterUpload] = template.bimage_url.split('/upload/');
    const generated_image_url = `${baseUrl}/upload/${transformations}/${afterUpload}`;

    // Save customization to DB
    const customization = new Customization({
      template_id,
      user_id,
      user_inputs,
      generated_image_url,
    });
    const savedCustomization = await customization.save();

    res.status(201).json({
      message: 'Customization saved successfully',
      customization: savedCustomization,
    });

  } catch (error) {
    console.error('Error in saveCustomization:', error);
    res.status(500).json({
      message: 'Error saving customization',
      error: error.message
    });
  }
};
export const getUserCustomizations = async (req, res) => {
  try {
    const { user_id } = req.params;
    const customizations = await Customization.find({ user_id }).populate('template_id');
    res.status(200).json({
      message: 'Customizations retrieved successfully',
      customizations,
    });
  } catch (error) {
    console.error('Error in getUserCustomizations:', error);
    res.status(500).json({ message: 'Error retrieving customizations', error: error.message });
  }
};
export default createTemplate;