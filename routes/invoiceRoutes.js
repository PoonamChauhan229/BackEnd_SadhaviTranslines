const express = require('express');
const router = new express.Router();
const Invoice = require('../model/invoiceModel');
const Client=require('../model/clientsModel')
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// Function to format the date as dd/mm/yyyy
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Function to generate the invoice document
const generateInvoice = (invoiceData) => {
  // Format the date and add it to the invoice data
  if (invoiceData.date_lr) {
    invoiceData.formattedDate = formatDate(invoiceData.date_lr);
    // console.log("Formatted Date:", invoiceData.formattedDate);
  }

  // console.log("Invoice Data being passed to the template:", invoiceData);

  // Load the docx file as binary
  const content = fs.readFileSync(path.resolve(__dirname, 'invoice_template.docx'), 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Set the template variables
  doc.setData(invoiceData);

  try {
    // Render the document (replace all occurrences of {placeholders})
    doc.render();
  } catch (error) {
    // Handle error (errors are related to the rendering of the document)
    console.error(error);
    throw error;
  }

  const buf = doc.getZip().generate({ type: 'nodebuffer' });

  // Write the generated document to a file
  const outputPath = path.resolve(__dirname, 'output_invoice.docx');
  fs.writeFileSync(outputPath, buf);
  return outputPath;
};

// Route to add a new invoice
router.post('/addinvoice', async (req, res) => {
  try {
    const {lr_no,bill_no,date_lr}=req.body
    const newInvoice = new Invoice(req.body);
    await newInvoice.save();

    // Generate the invoice
    const outputPath = generateInvoice(req.body);

    // Update the invoice with the download path
    newInvoice.downloadPath = `/download/${newInvoice._id}`;
    
    // newInvoice.address
    const clientAddress=await Client.find({},{name:1,_id:0})
    const AllClients=clientAddress.map((element)=>element.name.toLowerCase())
    console.log(AllClients)

    console.log((newInvoice.address.substring(0,5).toLowerCase()))

    let clientName=AllClients.filter(
      (element=>element.includes(newInvoice.address.substring(0,5).toLowerCase())))

    newInvoice.clientName=clientName[0].split(" ").map((element)=>element.charAt(0).toUpperCase() + element.substring(1).toLowerCase()).join(" ")
    console.log(newInvoice.clientName)
    
    // Format the date for the file name
    const formattedDate = formatDate(date_lr);
    console.log("Formatted Date:", formattedDate);

    // Construct the file name and replace slashes with dashes
    const fileName = `Invoice_${bill_no}_${lr_no}_${formattedDate.replace(/\//g, '-')}.docx`;
    console.log("File Name:", fileName);
    newInvoice.fileName=fileName
    await newInvoice.save();

    // Respond with the saved invoice and a message
    res.status(201).send({ invoice: newInvoice, message: 'Invoice created successfully', downloadPath: `/download/${newInvoice._id}` });
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
});

// Route to download an invoice
router.get('/download/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).send({ message: 'Invoice not found' });
    }

    // Generate the invoice
    const outputPath = generateInvoice(invoice.toObject());

    // Format the date for the file name
    const formattedDate = formatDate(invoice.date_lr);
    console.log("Formatted Date:", formattedDate);

    // Construct the file name and replace slashes with dashes
    const fileName = `Invoice_${invoice.bill_no}_${invoice.lr_no}_${formattedDate.replace(/\//g, '-')}.docx`;
    console.log("File Name:", fileName);

    // Send the file as a response
    res.download(outputPath, fileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send({ message: 'Error generating invoice file' });
      } else {
        // Optionally, you could delete the file after sending it
        fs.unlinkSync(outputPath);
      }
    });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});


// Route to view all invoices
router.get('/viewinvoices', async (req, res) => {
  try {
    const viewinvoices = await Invoice.find();    
    res.status(200).send(viewinvoices)
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
});

// fetch with Id
router.get('/editinvoice/:id', async (req, res) => {
  try {
    const invoice = await Invoice.find({_id:req.params.id});
    res.status(200).send(invoice);
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
});

// update with Id

router.put('/updateinvoice/:id', async (req, res) => {
  try {
    const { address } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).send({ message: "Invoice not found" });
    }

    /* -------- Auto-update clientName ONLY -------- */

    if (address) {
      const clients = await Client.find({}, { name: 1, _id: 0 });
      const names = clients.map(c => c.name.toLowerCase());

      const match = names.find(name =>
        name.includes(address.substring(0, 5).toLowerCase())
      );

      if (match) {
        invoice.clientName = match
          .split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
    }

    /* -------- Update remaining fields -------- */

    Object.keys(req.body).forEach(key => {
      invoice[key] = req.body[key];
    });

    await invoice.save();
    res.send(invoice);

  } catch (e) {
    res.status(400).send({ message: e.message });
  }
});


// delete 
router.delete('/deleteInvoice/:id',async(req,res)=>{
    console.log("deleteInvoice")
    try{
    const deleteInvoice=await Invoice.findByIdAndDelete({_id:req.params.id})
    console.log(deleteInvoice)
   res.send(deleteInvoice)
  }catch(e){
    console.log(e)
  }



})
module.exports = router;
