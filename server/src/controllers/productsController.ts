import { Product } from "../models/Product.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find().populate("category", "name").sort({ createdAt: -1 });
  res.json({ products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name");
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json({ product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.status(204).send();
});
