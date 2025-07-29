const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js")
const ExpressError = require("../utils/ExpressError.js")
const Review = require("../models/review.js")
const { validateReview } = require("../middleware.js")
const Listing = require("../models/listing.js");
const {isLoggedIn} = require("../middleware.js")
const {isReviewAuthor} = require("../middleware.js")

const reviewController = require("../controller/reviews.js")

//reviews
//post route
router.post("/",isLoggedIn, validateReview, wrapAsync(reviewController.creatReview))

// Delete Review Route
router.delete("/:reviewId",isLoggedIn,isReviewAuthor,  wrapAsync(reviewController.destroyReview))

module.exports = router;