const express = require("express") ;
const app = express();
const mongoose = require("mongoose") ;
const Listing = require ("../Major project/models/listing.js");
const path = require("path") ; 
const methodOverride =require ("method-override");
const ejsMate = require ("ejs-mate") ;
const { error, Console } = require("console");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js") ; 
const Review = require ("../Major project/models/review.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then( () => {
    console.log ("connected to DB");
}).catch((err) => {
    console.log(err) ; 
});

async function main () {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")) ) ; 

app.get("/", (req,res) =>{
     res.send("Hi, I am root") ; 
});

const validateListing =  (req , res, next) => {
  let {err} = listingSchema.validate(req.body) ;
  
  if (error) {
    let errMsg = error.details.map((el) => el.message).join (","); 
   throw new ExpressError(400, errMsg);
  } else { 
    next() ; 
  }
}

// Index route
app.get ("/listings", wrapAsync (async (req,res) => {
   const allListings = await Listing.find({})
   res.render("listings/index.ejs", {allListings});
}));

// New route 
app.get("/listings/new" , (req,res)=> {
  res.render("listings/new.ejs") ;
});

// Show route
app.get ("/listings/:id",  wrapAsync (async (req,res) => {
  let {id} = req.params ; 
   const  listing = await Listing.findById(id);
   res.render("listings/show.ejs", { listing}) ; 
}));

// Create route 
app.post("/listings",validateListing, wrapAsync ( async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
 
}));

// Edit route 
app.get("/listings/:id/edit", wrapAsync (async (req,res) => {
  let {id} = req.params ; 
  const  listing = await Listing.findById(id);
  res.render("listings/edit.ejs", {  listing});
})); 

// Update route 
app.put("/listings/:id", validateListing ,  wrapAsync (async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
}));

//Delete Route
app.delete("/listings/:id", wrapAsync (async (req, res) => {
  if (!req.body.listing) {
    throw new ExpressError (400, "Send valid data for listing") ;
  } 
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
}));

//Reviews
//Post route
app.post("/listings/:id/reviews", async (req,res) =>{
   let listing = await Listing.findById( req.params.id) ; 
   let newReview = new Review(req.body.review);

   listing.reviews.push(newReview);

    await newReview.save(); 
    await listing.save() ;  

    res.redirect(`/listings/${listing._id}`);
});

// app.get ("/testListing", async (req,res) => {
//    let sampleListing = new Listing ({
//      title: "My New Villa",
//      description: "Bt the beach",
//      price: 1200,
//      location: "London",
//      country: "United Kingdom"
//    });
//   await sampleListing.save();
//   console.log("sample was saved") ;
//   res.send("successful testing") ;
// });

app.all ("*", (req, res, next) => {
   next (new ExpressError ( 404, "Page Not Found! ")); 
});

app.use((err, req,res, next) => {
  let { statusCode = 500 , message = "Something went wrong!" } =  err ; 
  res.status (statusCode).render( "error.ejs", {message}) ;
 // res.status(statusCode).send(message) ; 
});

app.listen(3000, () => {
  console.log("server working") ; 
});