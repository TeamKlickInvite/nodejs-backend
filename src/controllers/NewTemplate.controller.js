import NewTemplate from "../models/NewTemplate.models.js";
import cloudinary from "../utils/cloudnary.js";
import path from 'path';
import Customization from "../models/saveCustomization.models.js";


// const crateTemplate = async(req,res) =>{
//   try {
//     if(!raw.files || req.files.prewImage || !req.files.backgrounImage){
//       return res.status(404).json({message:"both previewImage and backgroundImage are required"})
//     }
//     const {previewImage, backgroundImage} = req.files;
//     const{tittle, category, text_fields} = req.body;
//     console

//     // Validate required field:
//      if(!tittle || !category || !text_fields){
//       return res.status(404).json({message:"all fields must be required"})
//      }

//      // Uploading previewImage and background to the cloudinary:
//      const pimageUpload = await cloudinary.uploader.upload(previewImage[0].path,{
//        public_id:' 
//      })

    
//   } catch (error) {
    
//   }
// }

const createTemplate = async (req, res) => {
  try {
    // Check if files are uploaded
    if (!req.files || !req.files.previewImage || !req.files.backgroundImage) {
      return res.status(400).json({ message: 'Both preview and background images are required!' });
    }
    const { previewImage, backgroundImage } = req.files;
    const { title, category, text_fields } = req.body;
    console.log(previewImage);
    console.log(backgroundImage)

    // Validate required fields
    if (!title || !category || !text_fields) {
      return res.status(400).json({ message: 'Title, category, and text fields are required!' });
    }  
     
    // Upload preview image to Cloudinary
    const pimageUpload = await cloudinary.uploader.upload(previewImage[0].path, {
      public_id: `templates/${path.parse(previewImage[0].filename).name}`,
    });
    console.log(pimageUpload)

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
    console.log('Received files:', req.files); // debug line

    // check file present
    const saveFiles = req.files?.SaveImage;
    if (!saveFiles || saveFiles.length === 0) {
      return res.status(400).json({ message: 'SaveImage file is required (field name: SaveImage).' });
    }

    const saveFile = saveFiles[0];
    const { template_id } = req.body;
    if (!template_id) {
      return res.status(400).json({ message: 'Template ID is required!' });
    }

    // upload to cloudinary
    const uploadResult = await cloudinary.uploader.upload(saveFile.path, {
      public_id: `templates/${path.parse(saveFile.filename).name}`,
    });

    const savecard = uploadResult.secure_url;

    // Save to DB
    const customization = new Customization({
      template_id,
      savecard,
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
      error: error.message,
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