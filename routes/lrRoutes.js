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

// Helper function to print bold text
// function printBold(image, font, text, x, y) {
//   const offsets = [
//     [0,0],
//     [1,0],
//     [0,1],
//     [1,1],
//   ];
//   offsets.forEach(([dx, dy]) => {
//     image.print(font, x + dx, y + dy, text);
//   });
// }

// async function generateLRJimp(lrData, templateFile) {
//   const imagePath = path.join(process.cwd(), 'assets', templateFile);
//   const image = await Jimp.read(imagePath);
//   const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
//   const fontdate = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);

//   /// Top-right LR info
//   image.print(font, 2950, 880, lrData.lrNo);

//   // ✅ Fake bold for date and vehicle
//   printBold(image, fontdate, lrData.lrDate, 2800, 1100);
//   printBold(image, fontdate, lrData.lrVehicleNo, 2930, 1300);

//   image.print(fontdate, 2800, 1500, lrData.startPoint);
//   image.print(fontdate, 2800, 1650, lrData.destination);

//   // Middle-left Consignee
//   image.print(fontdate, 900, 1360, lrData.consigneeName );
//   image.print(fontdate, 200, 1460,  lrData.consigneeAddress.slice(0,70));
//   image.print(fontdate, 500, 1560,  lrData.consigneeAddress.slice(70));

//   // Table description / weight
//   image.print(fontdate, 1200, 2000, lrData.description);
//   image.print(fontdate, 2400, 2100, lrData.weight);

//   return image;
// }

// ------------------ JIMP HELPERS ------------------

// Print bold text (3x3 grid for extra bold)
function printExtraBold(image, font, text, x, y) {
  const offsets = [
    [0,0],[1,0],[2,0],
    [0,1],[1,1],[2,1],
    [0,2],[1,2],[2,2]
  ];
  offsets.forEach(([dx, dy]) => {
    image.print(font, x + dx, y + dy, text);
  });
}

// ------------------ GENERATE LR IMAGE ------------------
async function generateLRJimp(lrData, templateFile) {
  const imagePath = path.join(process.cwd(), 'assets', templateFile);
  const image = await Jimp.read(imagePath);

  const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);  // for LR number
  const fontdate = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK); // for other fields

  /// Top-right LR info
  // image.print(font, 2950, 880, lrData.lrNo); // LR number left normal
    printExtraBold(image, font, lrData.lrNo, 2950, 880);


  // Extra bold for key fields
  printExtraBold(image, fontdate, lrData.lrDate, 2800, 1100);
  printExtraBold(image, fontdate, lrData.lrVehicleNo, 2930, 1300);
  printExtraBold(image, fontdate, lrData.startPoint, 2800, 1500);
  printExtraBold(image, fontdate, lrData.destination, 2800, 1650);

  // Middle-left Consignee
  printExtraBold(image, fontdate, lrData.consigneeName, 900, 1360);
  printExtraBold(image, fontdate, lrData.consigneeAddress.slice(0,70), 200, 1460);
  printExtraBold(image, fontdate, lrData.consigneeAddress.slice(70), 500, 1560);

  // Table description / weight
  printExtraBold(image, fontdate, lrData.description, 1200, 2000);
  printExtraBold(image, fontdate, lrData.weight, 2400, 2100);
  image.quality(75);
  image.resize(image.bitmap.width * 0.9, Jimp.AUTO);
 

  return image;
}

// Generate base64 of image
async function generateLRBase64(lrData, templateFile) {
  const image = await generateLRJimp(lrData, templateFile);
  return await image.getBase64Async(Jimp.MIME_PNG);
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
