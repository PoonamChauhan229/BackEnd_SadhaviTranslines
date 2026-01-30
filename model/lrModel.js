const mongoose = require('mongoose');

const lrSchema = new mongoose.Schema({
  lrNo: { type: String, required: true },
  lrDate: { type: String, required: true },
  lrVehicleNo: { type: String, required: true },
  startPoint: { type: String, required: true },
  destination: { type: String, required: true },
  weight: { type: String, required: true },
  consigneeName: { type: String, required: true },
  consigneeAddress: { type: String, required: true },
  description: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LR', lrSchema);
