const Review = require("../models/Review");
const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const { checkPermissions } = require("../utils");

const createReview = async (req, res) => {
  const { product: productId } = req.body;

  const isvalidProduct = await Product.findOne({ _id: productId });

  if (!isvalidProduct) {
    throw new CustomError.NotFoundError(`No product with ID: ${productId}`);
  }

  const alreadySubmittedReview = await Review.findOne({
    product: productId,
    user: req.user.userId,
  });

  if (alreadySubmittedReview) {
    throw new CustomError.BadRequestError(
      "Already Submitted review for this Product!"
    );
  }

  req.body.user = req.user.userId;
  const review = await Review.create(req.body);
  res.status(StatusCodes.CREATED).json({ review });
};

const getAllReviews = async (req, res) => {
  const reviews = await Review.find({}).populate({
    path: "product",
    select: "name company price",
  });

  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

const getSingleReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new CustomError.BadRequestError(
      `No review exists with ID: ${reviewId}`
    );
  }
  res.status(StatusCodes.OK).json({ review });
};

const updateReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const { rating, title, comment } = req.body;
  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new CustomError.BadRequestError(
      `No review exists with ID: ${reviewId}`
    );
  }
  checkPermissions(req.user, review.user);
  review.rating = rating;
  review.title = title;
  review.comment = comment;

  await review.save();
  res.status(StatusCodes.OK).json({ review });
};

const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new CustomError.BadRequestError(
      `No review exists with ID: ${reviewId}`
    );
  }
  checkPermissions(req.user, review.user);
  
  await review.remove();
  res
    .status(StatusCodes.OK)
    .json({ msg: `Succesfully removed the review with ID: ${reviewId}` });
};

const getSingleproductReviews = async (req, res) => {
  const { id: productId } = req.params;
  const reviews = await Review.find({ product: productId });
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleproductReviews,
};
