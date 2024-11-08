var express = require('express')
var app = express()
var bodyParser=require("body-parser");
var session = require("express-session")
const {v4:uuidv4} = require('uuid')
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');

var serviceAccount = require("./keyfirst.json")

initializeApp({
    credential: cert(serviceAccount)
})

const db = getFirestore();
const PORT = process.env.PORT||3000
app.set("view engine","ejs")
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/views'));
app.use(session({
    secret:uuidv4(),
    resave:false,
    saveUninitialized:true
}))

app.get("/",(req,res)=>{
    res.render()
})

//sign up routes
app.get('/signup',(req,res)=>{
    res.render('signup',{validate:false});
})

app.post('/signup',(req,res)=>{
    const first_name = (req.body.firstname).trim();
    const user_name = (req.body.Username).trim();
    const email = (req.body.email).trim();
    const password = (req.body.password).trim();
    db.collection("users")
            .where("email", "==",email)
            .get()
            .then((docs) => {
                if (docs.size > 0) {
                    res.render('signup',{registered:"already registered"});
                }
                else {
                    db.collection("users")
                        .where("userName","==",user_name)
                        .get()
                        .then((docs)=>{
                            if(docs.size>0){
                                res.render('signup',{useregistered:"username exists"});
                            }
                            else{
                                db.collection("users").add({
                                    "name": first_name,
                                    "userName": user_name,
                                    "email": email,
                                    "password": password
                                }).then(() => {
                                    res.render("signin");
                                });
                            }
                        })
                }
        });
})

//sign in routes
app.get('/signin',(req,res)=>{
    res.render("signin")
})

app.post('/signin',(req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    db.collection("users")
     .where("email","==",email)
     .where("password","==",password)
     .get()
     .then((docs)=>{
        if(docs.size>0){
            docs.forEach(doc=>{
                req.session.user =doc._fieldsProto.userName.stringValue;
                res.redirect("/home")
            })
        }
        else{
            res.end("Invalid username")
        }
    })
})

app.get("/home",(req,res)=>{
    if(req.session.user){
        db.collection("users")
        .where("userName","==",req.session.user)
        .get()
        .then((docs)=>{
            docs.forEach(doc=>{
                res.render("home",{user:req.session.user,welcomename:doc._fieldsProto.name.stringValue})  
            })
        })   
    }
    else{
        res.render('home')
    }
});




//logout route
app.get('/logout',(req, res)=>{
        req.session.destroy((function (err) {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                res.render("signin", {logout:"logout Successful"});
            }
        }));
})

//profile

app.get("/profile",(req,res)=>{
    console.log(req)
})

//about
app.get("/about",(req,res)=>{
    res.render("about")
})

//contact form

app.get("/contact",(req,res)=>{
    res.render("contact")

})



app.listen(PORT,()=>{
    console.log("Hey I am working")
})