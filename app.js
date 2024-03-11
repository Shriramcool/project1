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
const {listingSchema , reviewSchema } = require("./schema.js") ; 
const Review = require ("../Major project/models/review.js");

const listings = require("./routes/listing.js") ;

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
app.use(express.json()) 
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")) ) ; 

app.get("/", (req,res) =>{
     res.send("Hi, I am root") ; 
});



const validateReview =  (req , res, next) => {
  let {err} = reviewSchema.validate(req.body) ;
  
  if (error) {
    let errMsg = error.details.map((el) => el.message).join (","); 
   throw new ExpressError(400, errMsg);
  } else { 
    next() ; 
  }
}

app.use("/listings", listings) ;


//Reviews
//Post Review Route
app.post("/listings/:id/reviews",  wrapAsync (async (req,res) =>{
   let listing = await Listing.findById( req.params.id) ; 
   let newReview = new Review(req.body.review);

   listing.reviews.push(newReview);

    await newReview.save(); 
    await listing.save() ;  

    res.redirect(`/listings/${listing._id}`);
}));


//Delete Review Route

app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
  let { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { review: reviewId } });
  let deletedReview = await Review.findByIdAndDelete(reviewId);
  console.log(deletedReview);
  res.redirect(`/listings/${id}`);
}));

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