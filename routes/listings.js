const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js")
const ExpressError = require("../utils/ExpressError.js")
const Listing = require("../models/listing.js");
const {isLoggedIn} = require("../middleware.js")
const {isOwner} = require("../middleware.js")
const {validateListing} = require("../middleware.js")
const multer = require("multer")
const {storage} = require("../cloudconfig.js")
const upload = multer({ storage })

const listingController = require("../controller/listings.js")

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn,upload.single("listing[image]"), validateListing, wrapAsync(listingController.createListing))

//New Route
router.get("/new", isLoggedIn, listingController.randerNewForm);

router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner,upload.single("listing[image]"), validateListing, wrapAsync(listingController.updateListing))
    .delete( isLoggedIn,isOwner, wrapAsync(listingController.destroyListing));

//Edit Route
router.get("/:id/edit", isOwner, isLoggedIn, wrapAsync(listingController.editListing));



module.exports = router;