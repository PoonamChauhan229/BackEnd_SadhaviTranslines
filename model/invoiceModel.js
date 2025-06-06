const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true
    },
    amount_in_word: {
        type: String,
        required: true
    },
    bill_no: {
        type: String,
        required: true
    },
    date_lr: {
        type: Date,
        required: true
    },
    description_of_goods: {
        type: String,
        required: true
    },
    freight_amount: {
        type: Number,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    igst_amount: {
        type: String,
        required: true
    },
    lr_charges: {
        type: Number,
        required: true
    },
    lr_no: {
        type: String,
        required: true
    },
    rate: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    total_amount: {
        type: Number,
        required: true
    },
    vehicle_no: {
        type: String,
        required: true
    },
    weight: {
        type: String,
        required: true
    },
    downloadPath: {
        type: String,
        required: false
    },
    fileName: {
        type: String,
        required: false
    },
    clientName:{
        type:String,
        // required:true
    },
    payment_status:{
        type:String,
        default:"Unpaid"
    },
    date_payment:{
        type:Date
    },
    amt_recvd:{
        type:Number
    },
    balance_payment:{
        type:Number
    },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
