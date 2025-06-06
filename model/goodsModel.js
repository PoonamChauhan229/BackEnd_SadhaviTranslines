const mongoose=require('mongoose')

const goodsSchema=new mongoose.Schema({
    description_goods:{
        type:String,
        required:true,
    }
})


const Goods=mongoose.model('Goods',goodsSchema)
module.exports=Goods;