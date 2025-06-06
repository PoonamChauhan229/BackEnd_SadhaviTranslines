const express=require('express')
const router=new express.Router()
const Goods = require('../model/goodsModel')


router.get('/goods', async (req, res) => {
  // Extract the query parameter or default to an empty string
  const query = req.query.query || '';
 
  try {
    console.log(query)
    // Create a regular expression for a case-insensitive search
    const regex = new RegExp(query, 'i');
    
    // Find clients where either the name or address matches the regex
    const goods = await Goods.find({description_goods:regex}).limit(10);

    res.status(200).send(goods);
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
});

module.exports = router;