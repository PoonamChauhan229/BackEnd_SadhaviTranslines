const express = require("express");
const app = express();
const cors = require('cors');

const dotenv = require('dotenv');
const connection = require('./db/connection');

dotenv.config();
app.use(express.json());



// Enable CORS for all routes
app.use(cors({
    //origin: 'http://localhost:3000', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

// Router access
const clientRouter = require('./routes/clientsRoutes')
app.use(clientRouter)

const goodsRouter=require('./routes/goodsRoutes')
app.use(goodsRouter)

const invoiceRouter=require('./routes/invoiceRoutes')
app.use(invoiceRouter)

const PORT = process.env.PORT || 8000;

// Db connection
const mongoose = require('mongoose');
connection();

// Routes
app.get('/', (req, res) => {
    res.status(200).send("Welcome to the Sadhavi Translines");
});

app.listen(PORT, () => {
    console.log("Server started at PORT", PORT);
});