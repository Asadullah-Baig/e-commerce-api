const Order = require("../models/Order");
const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { checkPermissions } = require("../utils");

const fakeStripeAPI = async (amount, currency) => {
  const client_secret = "SomeRandomValue";
  return {
    client_secret,
    amount,
  };
};

const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body;

  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError("No Cart Items Provided!");
  }
  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError("No Tax Or Shippin Fee Provided!");
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const dbProduct = await Product.findOne({ _id: item.product });
    if (!dbProduct) {
      throw new CustomError.NotFoundError(
        `No product with Id: ${item.product}`
      );
    }
    const { name, price, image, _id } = dbProduct;
    const singleOrderItem = {
      amount: item.amount,
      name,
      price,
      image,
      product: _id,
    };
    //add Item to Order
    orderItems = [...orderItems, singleOrderItem];
    //calculate Subtotal
    subtotal += item.amount * price;
  }
  const total = tax + shippingFee + subtotal;
  //Get client secret
  const paymantIntent = await fakeStripeAPI({
    amount: total,
    currency: "PKR",
  });

  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    tax,
    shippingFee,
    clientSecret: paymantIntent.client_secret,
    user: req.user.userId,
  });

  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });
};

const getAllOrders = async (req, res) => {
  const orders = await Order.find({});
  if (!orders) {
    res.status(StatusCodes.NOT_FOUND).json("No Orders!");
  } else {
    res.status(StatusCodes.OK).json({ orders, count: orders.length });
  }
};

const getSingleOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id });
  if (!order) {
    throw new CustomError.NotFoundError(`No Order with ID: ${req.params.id}`);
  } else {
    checkPermissions(req.user, order.user);
    res.status(StatusCodes.OK).json({ order });
  }
};

const getCurrentUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId });
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const updateOrder = async (req, res) => {
  const { id: OrderId } = req.params;
  const { paymantIntentId } = req.body;

  const order = await Order.findOne({ _id: OrderId });
  if (!order) {
    throw new NotFoundError(`No Product with ${OrderId}`);
  }
  checkPermissions(req.user, order.user);

  order.paymantIntentId = paymantIntentId;
  order.status = "paid";
  await order.save();

  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllOrders,
  getCurrentUserOrders,
  getSingleOrder,
  createOrder,
  updateOrder,
};
