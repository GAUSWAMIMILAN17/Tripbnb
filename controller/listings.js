const Listing = require("../models/listing")


module.exports.index = async (req, res) => {
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
};

module.exports.randerNewForm = (req, res) => {
  res.render("listings/new.ejs");
}

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate({path: "reviews", populate: { path: "author"}}).populate("owner");
  if(!listing){
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings")
  }
  // console.log(listing)
  res.render("listings/show.ejs", { listing });
}

module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;
  // let category = req.body.listing;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url , filename}
  // newListing.category = { category }
  await newListing.save();
  req.flash("success", "New Listing Created !");
  res.redirect("/listings");
}

module.exports.editListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing){
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings")
  }
  res.render("listings/edit.ejs", { listing});
}

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  
  if(typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename}
    await listing.save();
}
  req.flash("success", "New Listing Updated !");
  res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted !");
  res.redirect("/listings");
}