const port = 4000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

app.use(express.json());
app.use(cors());

//database connection with mongodb
const mongoURL=process.env.DB_URL;
mongoose.connect(mongoURL);


app.get('/', (req, res) => {
    res.send('Express is running');
})

// Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
});
//Schema Creating for User Model
const Users = mongoose.model('Users', {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    cartData: { type: Object },
    date: { type: Date, default: Date.now },
})

//Creating Endpoint for registering users
app.post('/signup', async (req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, message: "Email Already Exists" })
    }

    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }

    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    });

    await user.save();

    const data = {
        user: {
            id: user.id,
        }
    }

    const token = jwt.sign(data, 'secret_ecom')
    res.json({ success: true, token })
})  

//Creating endpoint for user login
app.post('/login',async (req,res)=>{
    let user =await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password ===user.password;
        if(passCompare){
            const data ={
                user:{
                  id:user.id 
                }
            }
            const token =jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false,errors:"wrong password"})
        }
    }
    else{
        res.json({success:false,errors:"Wrong Email id"})
    }
})
const upload = multer({ storage: storage })

// Createing Upload Endpoint for images
app.use('/images', express.static(path.join('upload/images')))
app.post('/upload', upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})
  
//schema for creating products
const Product = mongoose.model("product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    avilable:{
        type:Boolean,
        default:true,
    },
})

app.post('/addproduct',async (req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product =last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id=1;
    }
    const product = new Product({
        name:req.body.name,
        id:id,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("saved")
    res.json({
        success:true,
        name:req.body.name,
    })
})

//Creating API for deleting products
app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
       success:true,
       name:req.body.name,
    })
})

//Creating API for getting all products
app.get('/allproducts',async(req,res) =>{
    let products = await Product.find({});
    console.log("all products fetched");
    res.send(products);
})

//creating endpoint for newcollection data
app.get('/newcollections',async(req,res)=>{
    let products =await Product.find({});
    let newcollection =products.slice(1).slice(-8);
    console.log("newcollection Fetched");
    res.send(newcollection);
})

//create endpoint for popular in women section
app.get('/popularinwomen',async (req,res)=>{
    let products =await Product.find({category:"women"});
    let popular_in_women =products.slice(0,4);
    consolele.log("popular in women fetched")
    res.send(popular_in_women);
})


app.listen(port, (error) => {
    if (!error) {
        console.log(`Server is running on port ${port}`);
    } else {
        console.log(error);
    }
})