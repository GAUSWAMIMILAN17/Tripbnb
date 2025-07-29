if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate")
const ExpressError = require("./utils/ExpressError.js")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");


const listingsRouter = require("./routes/listings.js");
const reviewsRouter = require("./routes/reviews.js")
const userRouter = require("./routes/user.js")

 
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.engine("ejs", ejsMate)
app.use(express.static(path.join(__dirname, "public")))
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));


const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secrete: process.env.SECRET
  },
  touchAfter: 24 * 3600
});

store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE", err)
})

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
    maxAge: 1000 * 60 * 60 * 24 * 3,
    httpOnly: true
  }

}


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
  res.locals.success = req.flash("success")
  res.locals.error = req.flash("error")
  res.locals.currUser = req.user;
  next() 
})

app.get("/", async(req,res)=>{
  let { category, search } = req.query;
  let queryObj = {};

  if (search && search.trim() !== "") {
    if (!req.isAuthenticated()) {
      req.session.redirectUrl = req.originalUrl;
      req.flash("error", "You must be logged in to search by category!");
      return res.redirect("/login");
    }
    search = search.trim();
    queryObj.$or = [                                            //OR logic for location OR country
      { location: { $regex: search, $options: "i" } },          //$options: "i"	Ignore capital/small letter difference
      { country: { $regex: search, $options: "i" } }            //$regex (regular expression) is used in MongoDB to find partial or pattern-based matches in string fields.
    ];
  }

  if (category && category !== "All") {
    if (!req.isAuthenticated()) {
      req.session.redirectUrl = req.originalUrl;
      req.flash("error", "You must be logged in to filter by category!");
      return res.redirect("/login");
    }
    queryObj.category = category;
  }

  const allListings = await Listing.find(queryObj);
  res.render("listings/index.ejs", { allListings, category: category || "All" });
})


app.use("/listings" , listingsRouter)
app.use("/listings/:id/reviews" , reviewsRouter)
app.use("/", userRouter)


app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"))
})

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "SOMETHING WENT WRONG" } = err;
  res.status(statusCode).render("listings/error.ejs", { err })
  // res.status(statusCode).send(message);
})

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
