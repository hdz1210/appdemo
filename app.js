var express = require('express')
var app = express()

const session = require('express-session');

app.use(session({
    resave: true, 
    saveUninitialized: true, 
    secret: 'some122$$%*$##!!#$%@#$%', 
    cookie: { maxAge: 60000 }}));


var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var hbs = require('hbs')
app.set('view engine','hbs')


var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/login',(req,res)=>{
    res.render('login')
})
app.get('/register',(req,res)=>{
    res.render('register')
})
app.post('/new',async (req,res)=>{
    var nameInput = req.body.txtName;
    var passInput = req.body.txtPassword;
    var roleInput = req.body.role;
    var newUser = {name: nameInput, password:passInput,role:roleInput};

    let client= await MongoClient.connect(url);
    let dbo = client.db("LoginDemo");
    await dbo.collection("users").insertOne(newUser);
    res.redirect('/login')
})
app.post('/doLogin',async (req,res)=>{
    var nameInput = req.body.txtName;
    var passInput = req.body.txtPassword;
    let client= await MongoClient.connect(url);
    let dbo = client.db("LoginDemo");
    const cursor  = dbo.collection("users").
        find({$and: [{name:nameInput},{password:passInput}]});
    
    const count = await cursor.count();
    
    if (count== 0){
        res.render('login',{message: 'Invalid user!'})
    }else{
        let name ='';
        let role = ''
        await cursor.forEach(doc=>{      
            name = doc.name;
            role = doc.role;           
        })
        req.session.User = {
            name : name,
            role : role
        }
        res.redirect('/')
    }    

})

app.post('/update',async (req,res)=>{
    let id = req.body.txtId;
    let nameInput = req.body.txtName;
    let priceInput = req.body.txtPrice;
    let newValues ={$set : {name: nameInput,price:priceInput}};
    var ObjectID = require('mongodb').ObjectID;
    let condition = {"_id" : ObjectID(id)};
    
    let client= await MongoClient.connect(url);
    let dbo = client.db("LoginDemo");
    await dbo.collection("product").updateOne(condition,newValues);
    res.redirect('/');
})

app.get('/edit',async (req,res)=>{
    let id = req.query.id;
    var ObjectID = require('mongodb').ObjectID;
    let condition = {"_id" : ObjectID(id)};

    let client= await MongoClient.connect(url);
    let dbo = client.db("LoginDemo");
    let productToEdit = await dbo.collection("product").findOne(condition);
    res.render('edit',{product:productToEdit})
})

app.get('/delete',async (req,res)=>{
    let id = req.query.id;
    var ObjectID = require('mongodb').ObjectID;
    let condition = {"_id" : ObjectID(id)};

    let client= await MongoClient.connect(url);
    let dbo = client.db("LoginDemo");
    await dbo.collection("product").deleteOne(condition);
    res.redirect('/')
})

app.post('/search',async (req,res)=>{
    let client= await MongoClient.connect(url);
    let dbo = client.db("LoginDemo");
    let nameInput = req.body.txtName;
    let searchCondition = new RegExp(nameInput,'i')
    let results = await dbo.collection("product").find({name:searchCondition}).toArray();
    res.render('index',{model:results})
})
app.get('/',async (req,res)=>{
    let client= await MongoClient.connect(url);
    let dbo = client.db("LoginDemo");
    let results = await dbo.collection("product").find({}).toArray();
    var user = req.session.User;
    if(!user  || user.name == ''){
        res.render('notLogin',{message:'user chua dang nhap'})
    }else{
        res.render('index',{name: user.name,role:user.role, model:results})
    }
  
})

app.get('/insert',(req,res)=>{
    res.render('newProduct')
})
app.post('/doInsert', async (req,res)=>{
    var nameInput = req.body.txtName;
    var priceInput = req.body.txtPrice;
    var newProduct = {name:nameInput, price:priceInput};

    let client= await MongoClient.connect(url);
    let dbo = client.db("LoginDemo");
    await dbo.collection("product").insertOne(newProduct);
    res.redirect('/')
})

const PORT = process.env.PORT || 5000
app.listen(PORT);
console.log('Server is running at 5000')