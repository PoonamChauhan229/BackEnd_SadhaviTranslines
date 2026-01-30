const express = require('express');
const router = express.Router();
const path = require('path');
const Jimp = require('jimp');
const LR = require('../model/lrModel'); // your mongoose LR model

// Template filenames
const templates = {
  whitelr: 'white.png',
  pinklr: 'pink.png',
  bluelr: 'blue.png',
};

// Helper function to generate LR image as Jimp object
async function generateLRJimp(lrData, templateFile) {
  const imagePath = path.join(process.cwd(), 'assets', templateFile);
  const image = await Jimp.read(imagePath);
  const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);

  /// Top-right LR info
image.print(font, 2800, 900, lrData.lrNo);
image.print(font, 900, 160, lrData.lrDate);
image.print(font, 900, 200, lrData.lrVehicleNo);
image.print(font, 900, 240, lrData.startPoint);
image.print(font, 900, 280, lrData.destination);

// Middle-left Consignee
image.print(font, 200, 350, lrData.consigneeName + ', ' + lrData.consigneeAddress);

// Table description / weight
image.print(font, 200, 400, lrData.description);
image.print(font, 800, 400, lrData.weight);

  return image;
}

// Helper function to get base64 of image
async function generateLRBase64(lrData, templateFile) {
  const image = await generateLRJimp(lrData, templateFile);
  return await image.getBase64Async(Jimp.MIME_PNG);
}

// ------------------ ROUTES ------------------

// 1️⃣ Create LR and return base64 images
router.post('/create-lr', async (req, res) => {
  try {
    const lrData = req.body;

    // Save LR metadata in DB
    const newLR = await LR.create(lrData);

    const generatedImages = {};

    // Generate base64 for all templates
    for (const [key, file] of Object.entries(templates)) {
      const base64 = await generateLRBase64(lrData, file);
      generatedImages[key] = base64;
    }

    res.json({
      status: 'success',
      message: 'LR created successfully',
      lrId: newLR._id,
      images: generatedImages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2️⃣ Get LR image as base64 (preview)
router.get('/get-lr-image/:lrId/:color', async (req, res) => {
  try {
    const { lrId, color } = req.params;

    const lr = await LR.findById(lrId);
    if (!lr) return res.status(404).json({ status: 'error', message: 'LR not found' });

    const templateFile = templates[color];
    if (!templateFile) return res.status(400).json({ status: 'error', message: 'Invalid color' });

    const base64 = await generateLRBase64(lr, templateFile);

    res.json({ status: 'success', base64 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3️⃣ Download LR image as PNG
router.get('/download-lr/:lrId/:color', async (req, res) => {
  try {
    const { lrId, color } = req.params;

    const lr = await LR.findById(lrId);
    if (!lr) return res.status(404).json({ status: 'error', message: 'LR not found' });

    const templateFile = templates[color];
    if (!templateFile) return res.status(400).json({ status: 'error', message: 'Invalid color' });

    const image = await generateLRJimp(lr, templateFile);
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

    res.setHeader('Content-Disposition', `attachment; filename=LR_${lr.lrNo}_${color}.png`);
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 4️⃣ Get all LRs
router.get('/get-lrs', async (req, res) => {
  try {
    const lrs = await LR.find();
    res.json({ status: 'success', lrs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch LRs' });
  }
});

module.exports = router;
