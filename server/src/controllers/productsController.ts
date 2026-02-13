import type { Request } from "express";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";
import { ProductFeedback } from "../models/ProductFeedback.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { productImagePath, productVideoPath } from "../middlewares/upload.js";
import { sendResponse } from "../utils/response.js";
import { withProductMedia } from "../types/productMedia.js";
import { parseRichText } from "../utils/richTextFormatter.js";

/** @deprecated Use withProductMedia from types/productMedia for full media structure. Kept for store home API compatibility. */
export const withViewHoverVideo = withProductMedia;

/** Options for E-commerce availability filter (value matches list products query). */
const AVAILABILITY_OPTIONS = [
  { value: "all", labelEn: "All", labelAr: "الكل" },
  { value: "inStock", labelEn: "In stock", labelAr: "متوفر" },
  { value: "outOfStock", labelEn: "Out of stock", labelAr: "غير متوفر" },
] as const;

/** Options for E-commerce sort (value matches list products query). */
const SORT_OPTIONS = [
  { value: "newest", labelEn: "Newest", labelAr: "الأحدث" },
  { value: "priceAsc", labelEn: "Price: Low to High", labelAr: "السعر: منخفض إلى عالي" },
  { value: "priceDesc", labelEn: "Price: High to Low", labelAr: "السعر: عالي إلى منخفض" },
  { value: "nameAsc", labelEn: "Name A–Z", labelAr: "الاسم أ–ي" },
  { value: "nameDesc", labelEn: "Name Z–A", labelAr: "الاسم ي–أ" },
  { value: "bestSelling", labelEn: "Best selling", labelAr: "الأكثر مبيعاً" },
  { value: "highestSelling", labelEn: "Highest selling", labelAr: "الأعلى مبيعاً" },
  { value: "lowSelling", labelEn: "Lowest selling", labelAr: "الأقل مبيعاً" },
] as const;

export const getAvailabilityFilters = asyncHandler(async (req, res) => {
  sendResponse(res, req.locale, { data: [...AVAILABILITY_OPTIONS] });
});

export const getSortFilters = asyncHandler(async (req, res) => {
  sendResponse(res, req.locale, { data: [...SORT_OPTIONS] });
});

export const listProducts = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, {
      data: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
    });
  }
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status = req.query.status as string | undefined;
  const category = req.query.category as string | undefined;
  const newArrival = req.query.newArrival as string | undefined;
  const availability = req.query.availability as string | undefined;
  const color = typeof req.query.color === "string" ? req.query.color.trim() : "";
  const minPrice = req.query.minPrice != null ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : undefined;
  const sort = (req.query.sort as string) || "newest";
  const minRating = req.query.minRating != null ? Number(req.query.minRating) : undefined;

  const filter: Record<string, unknown> = { deletedAt: null };
  if (status === "ACTIVE" || status === "INACTIVE") filter.status = status;
  if (category) filter.category = category;
  if (newArrival === "true") filter.isNewArrival = true;
  if (availability === "inStock") filter.stock = { $gt: 0 };
  if (availability === "outOfStock") filter.stock = 0;
  if (color) filter.colors = { $in: [new RegExp(color, "i")] };
  if (minPrice != null && !Number.isNaN(minPrice)) {
    filter.$and = filter.$and || [];
    (filter.$and as unknown[]).push({
      $or: [
        { discountPrice: { $ne: null, $gte: minPrice } },
        { discountPrice: null, price: { $gte: minPrice } }
      ]
    });
  }
  if (maxPrice != null && !Number.isNaN(maxPrice)) {
    filter.$and = filter.$and || [];
    (filter.$and as unknown[]).push({
      $or: [
        { discountPrice: { $ne: null, $lte: maxPrice } },
        { discountPrice: null, price: { $lte: maxPrice } }
      ]
    });
  }
  if (search) {
    const re = new RegExp(search, "i");
    filter.$or = [
      { "name.en": re },
      { "name.ar": re },
      { "description.en": re },
      { "description.ar": re }
    ];
  }

  if (minRating != null && !Number.isNaN(minRating) && minRating >= 1 && minRating <= 5) {
    const ratingAgg = await ProductFeedback.aggregate<{ _id: mongoose.Types.ObjectId }>([
      { $match: { approved: true } },
      { $group: { _id: "$product", avgRating: { $avg: "$rating" } } },
      { $match: { avgRating: { $gte: minRating } } },
      { $project: { _id: 1 } }
    ]);
    const ratedProductIds = ratingAgg.map((r) => r._id);
    filter._id = { $in: ratedProductIds };
    if (ratedProductIds.length === 0) {
      return sendResponse(res, req.locale, {
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 }
      });
    }
  }

  const total = await Product.countDocuments(filter);

  const appliedFilters: Record<string, unknown> = {
    sort: sort || "newest",
    availability: availability === "inStock" || availability === "outOfStock" ? availability : "all"
  };
  if (category) {
    appliedFilters.categoryId = category;
    const categoryDoc = await Category.findById(category).select("name").lean();
    if (categoryDoc?.name) {
      appliedFilters.categoryName = categoryDoc.name;
    }
  }
  if (search) appliedFilters.search = search;
  if (status === "ACTIVE" || status === "INACTIVE") appliedFilters.status = status;
  if (newArrival === "true") appliedFilters.newArrival = true;
  if (minPrice != null && !Number.isNaN(minPrice)) appliedFilters.minPrice = minPrice;
  if (maxPrice != null && !Number.isNaN(maxPrice)) appliedFilters.maxPrice = maxPrice;
  if (color) appliedFilters.color = color;
  if (minRating != null && !Number.isNaN(minRating) && minRating >= 1 && minRating <= 5) appliedFilters.minRating = minRating;

  const useEffectivePriceSort = sort === "priceAsc" || sort === "priceDesc";
  const useSalesSort = sort === "bestSelling" || sort === "highestSelling" || sort === "lowSelling";
  let products: unknown[];

  if (useEffectivePriceSort) {
    const effectivePriceSort = sort === "priceAsc" ? 1 : -1;
    products = await Product.aggregate([
      { $match: filter },
      { $addFields: { effectivePrice: { $ifNull: ["$discountPrice", "$price"] } } },
      { $sort: { effectivePrice: effectivePriceSort as 1 | -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "categoryDoc" } },
      { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          category: {
            _id: "$categoryDoc._id",
            name: "$categoryDoc.name",
            status: "$categoryDoc.status"
          }
        }
      },
      { $project: { categoryDoc: 0, effectivePrice: 0 } }
    ]);
  } else if (useSalesSort) {
    const soldSort = (sort === "highestSelling" || sort === "bestSelling") ? -1 : 1;
    products = await Product.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "orders",
          let: { pid: "$_id" },
          pipeline: [
            { $match: { status: { $in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } } },
            { $unwind: "$items" },
            { $match: { $expr: { $eq: ["$items.product", "$$pid"] } } },
            { $group: { _id: null, totalQty: { $sum: "$items.quantity" } } }
          ],
          as: "soldResult"
        }
      },
      {
        $addFields: {
          soldQty: { $ifNull: [{ $arrayElemAt: ["$soldResult.totalQty", 0] }, 0] }
        }
      },
      { $sort: { soldQty: soldSort as 1 | -1, createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "categoryDoc" } },
      { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          category: {
            _id: "$categoryDoc._id",
            name: "$categoryDoc.name",
            status: "$categoryDoc.status"
          }
        }
      },
      { $project: { categoryDoc: 0, soldResult: 0 } }
    ]);
  } else {
    const sortOption: Record<string, 1 | -1> =
      sort === "nameAsc" ? { "name.en": 1 } :
        sort === "nameDesc" ? { "name.en": -1 } :
          { createdAt: -1 };
    products = await Product.find(filter)
      .populate("category", "name status")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }

  const productIds = (products as { _id: unknown }[]).map((p) => p._id);
  if (productIds.length > 0) {
    const soldAgg = await Order.aggregate([
      { $match: { status: { $in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } } },
      { $unwind: "$items" },
      { $match: { "items.product": { $in: productIds.map((id) => (typeof id === "string" ? new mongoose.Types.ObjectId(id) : id)) } } },
      { $group: { _id: "$items.product", totalQty: { $sum: "$items.quantity" } } }
    ]);
    const soldMap: Record<string, number> = {};
    for (const row of soldAgg) {
      soldMap[String(row._id)] = row.totalQty;
    }
    products = (products as Record<string, unknown>[]).map((p) => ({
      ...p,
      soldQty: soldMap[String((p as { _id: unknown })._id)] ?? 0
    }));
  }

  if (productIds.length > 0) {
    const ratingAgg = await ProductFeedback.aggregate<{ _id: mongoose.Types.ObjectId; avgRating: number; count: number }>([
      { $match: { product: { $in: productIds.map((id) => (typeof id === "string" ? new mongoose.Types.ObjectId(id) : id)) }, approved: true } },
      { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const ratingMap: Record<string, { avgRating: number; ratingCount: number }> = {};
    for (const row of ratingAgg) {
      ratingMap[String(row._id)] = { avgRating: Math.round(row.avgRating * 10) / 10, ratingCount: row.count };
    }
    products = (products as Record<string, unknown>[]).map((p) => {
      const r = ratingMap[String((p as { _id: unknown })._id)];
      return {
        ...p,
        averageRating: r?.avgRating,
        ratingCount: r?.ratingCount ?? 0
      };
    });
  }

  const data = (products as Record<string, unknown>[]).map((p) => withProductMedia(p as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }, { forList: true }));
  sendResponse(res, req.locale, {
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    appliedFilters
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const product = await Product.findOne({ _id: req.params.id, deletedAt: null }).populate(
    "category",
    "name status"
  );
  if (!product) {
    throw new ApiError(404, "Product not found", { code: "errors.product.not_found" });
  }

  // Get color parameter from query string for color-specific images
  const requestedColor = typeof req.query.color === "string" ? req.query.color.trim() : undefined;

  const productObj = product.toObject ? product.toObject() : (product as unknown as Record<string, unknown>);

  // Build variant availability information
  const variants = Array.isArray((productObj as { variants?: unknown[] }).variants)
    ? (productObj as { variants: unknown[] }).variants
    : [];
  const colors = Array.isArray((productObj as { colors?: string[] }).colors)
    ? (productObj as { colors: string[] }).colors
    : [];
  const sizes = Array.isArray((productObj as { sizes?: string[] }).sizes)
    ? (productObj as { sizes: string[] }).sizes
    : [];

  const images = Array.isArray((productObj as { images?: string[] }).images)
    ? (productObj as { images: string[] }).images
    : [];
  const imageColors = Array.isArray((productObj as { imageColors?: string[] }).imageColors)
    ? (productObj as { imageColors: string[] }).imageColors
    : [];

  /** For each color: whether it has a dedicated image and the first image URL for that color. */
  const colorImageInfo = getColorImageInfo(colors, images, imageColors);

  // Build sizes array with available/outOfStock
  const sizesAvailability = sizes.map(size => ({
    size,
    available: isSizeAvailable(size, variants, colors),
    outOfStock: isSizeOutOfStock(size, variants, colors)
  }));

  // Calculate availability for each color and size
  const availability = {
    colors: colors.map(color => {
      const info = colorImageInfo.get(color.toLowerCase().trim());
      return {
        color,
        available: isColorAvailable(color, variants, sizes),
        outOfStock: isColorOutOfStock(color, variants, sizes),
        hasImage: info?.hasImage ?? false,
        ...(info?.imageUrl != null ? { imageUrl: info.imageUrl } : {})
      };
    }),
    sizes: sizesAvailability,
    variants: variants.map((v: unknown) => {
      const vv = v as { color?: string; size?: string; stock?: number; outOfStock?: boolean };
      return {
        color: vv.color,
        size: vv.size,
        stock: vv.stock ?? 0,
        outOfStock: vv.outOfStock ?? false
      };
    })
  };

  const productWithMedia = withProductMedia(
    productObj as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[]; imageColors?: string[] },
    { color: requestedColor }
  );

  // Parse rich text details if present
  const details = (productObj as { details?: { en?: string; ar?: string } }).details;
  const formattedDetails = details
    ? {
      en: parseRichText(details.en ?? ""),
      ar: parseRichText(details.ar ?? "")
    }
    : undefined;

  sendResponse(res, req.locale, {
    data: {
      product: {
        ...productWithMedia,
        availability,
        ...(formattedDetails ? { formattedDetails } : {})
      }
    }
  });
});

/**
 * For each product color, determine if there is a dedicated image (imageColors[i] matches)
 * and the first image URL for that color. Returns a Map keyed by normalized color (lowercase).
 */
function getColorImageInfo(
  colors: string[],
  images: string[],
  imageColors: string[]
): Map<string, { hasImage: boolean; imageUrl?: string }> {
  const map = new Map<string, { hasImage: boolean; imageUrl?: string }>();
  if (!Array.isArray(images) || images.length === 0) {
    colors.forEach(c => map.set(c.toLowerCase().trim(), { hasImage: false }));
    return map;
  }
  const colorArr = Array.isArray(imageColors) ? imageColors : [];
  for (const color of colors) {
    const normalized = color.toLowerCase().trim();
    const idx = images.findIndex((_, i) => (colorArr[i] ?? "").toLowerCase().trim() === normalized);
    if (idx >= 0 && images[idx]) {
      map.set(normalized, { hasImage: true, imageUrl: images[idx] });
    } else {
      map.set(normalized, { hasImage: false });
    }
  }
  return map;
}

/** Check if a color has any available stock (at least one size in stock). */
function isColorAvailable(color: string, variants: unknown[], sizes: string[]): boolean {
  const variantsArray = variants as { color?: string; size?: string; stock?: number; outOfStock?: boolean }[];

  // If no variants, assume color is available based on global stock
  if (variantsArray.length === 0) return true;

  // Check if any variant with this color has stock
  const colorVariants = variantsArray.filter(v =>
    (v.color ?? "").toLowerCase().trim() === color.toLowerCase().trim()
  );

  if (colorVariants.length === 0) return true; // No specific variant info means available

  return colorVariants.some(v => !v.outOfStock && (v.stock ?? 0) > 0);
}

/** Check if a color is completely out of stock (all sizes out of stock). */
function isColorOutOfStock(color: string, variants: unknown[], sizes: string[]): boolean {
  const variantsArray = variants as { color?: string; size?: string; stock?: number; outOfStock?: boolean }[];

  if (variantsArray.length === 0) return false;

  const colorVariants = variantsArray.filter(v =>
    (v.color ?? "").toLowerCase().trim() === color.toLowerCase().trim()
  );

  if (colorVariants.length === 0) return false;

  return colorVariants.every(v => v.outOfStock || (v.stock ?? 0) === 0);
}

/** Check if a size has any available stock (at least one color in stock). */
function isSizeAvailable(size: string, variants: unknown[], colors: string[]): boolean {
  const variantsArray = variants as { color?: string; size?: string; stock?: number; outOfStock?: boolean }[];

  if (variantsArray.length === 0) return true;

  const sizeVariants = variantsArray.filter(v =>
    (v.size ?? "").toLowerCase().trim() === size.toLowerCase().trim()
  );

  if (sizeVariants.length === 0) return true;

  return sizeVariants.some(v => !v.outOfStock && (v.stock ?? 0) > 0);
}

/** Check if a size is completely out of stock (all colors out of stock). */
function isSizeOutOfStock(size: string, variants: unknown[], colors: string[]): boolean {
  const variantsArray = variants as { color?: string; size?: string; stock?: number; outOfStock?: boolean }[];

  if (variantsArray.length === 0) return false;

  const sizeVariants = variantsArray.filter(v =>
    (v.size ?? "").toLowerCase().trim() === size.toLowerCase().trim()
  );

  if (sizeVariants.length === 0) return false;

  return sizeVariants.every(v => v.outOfStock || (v.stock ?? 0) === 0);
}

export const getRelatedProducts = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: [] });
  }
  const productId = req.params.id;
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 4), 20);
  const product = await Product.findOne({ _id: productId, deletedAt: null }).select("category").lean();
  if (!product || !product.category) {
    return sendResponse(res, req.locale, { data: [] });
  }
  const categoryId = typeof product.category === "object" && product.category && "_id" in product.category
    ? (product.category as { _id: unknown })._id
    : product.category;
  const products = await Product.find({
    _id: { $ne: productId },
    category: categoryId,
    status: "ACTIVE",
    deletedAt: null
  })
    .populate("category", "name status")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const data = (products as Record<string, unknown>[]).map((p) => withProductMedia(p as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }, { forList: true }));
  sendResponse(res, req.locale, { data });
});

function mapBodyToProduct(body: Record<string, unknown>) {
  const {
    nameEn, nameAr, descriptionEn, descriptionAr, detailsEn, detailsAr, stylingTipEn, stylingTipAr,
    sizes, sizeDescriptions, colors, images, imageColors, videos, isNewArrival, ...rest
  } = body;
  const payload: Record<string, unknown> = { ...rest };
  if (isNewArrival !== undefined) payload.isNewArrival = Boolean(isNewArrival);
  if (nameEn !== undefined || nameAr !== undefined) {
    payload.name = { en: String(nameEn ?? "").trim(), ar: String(nameAr ?? "").trim() };
  }
  if (descriptionEn !== undefined || descriptionAr !== undefined) {
    payload.description = { en: String(descriptionEn ?? "").trim(), ar: String(descriptionAr ?? "").trim() };
  }
  if (detailsEn !== undefined || detailsAr !== undefined) {
    payload.details = { en: String(detailsEn ?? "").trim(), ar: String(detailsAr ?? "").trim() };
  }
  if (stylingTipEn !== undefined || stylingTipAr !== undefined) {
    payload.stylingTip = { en: String(stylingTipEn ?? "").trim(), ar: String(stylingTipAr ?? "").trim() };
  }
  if (sizes !== undefined) {
    const sizeArr = Array.isArray(sizes) ? sizes.map((s) => String(s).trim()).filter(Boolean) : [];
    payload.sizes = sizeArr;
    const descArr = Array.isArray(sizeDescriptions) ? sizeDescriptions.map((d) => String(d ?? "").trim()) : [];
    payload.sizeDescriptions = sizeArr.map((_: string, i: number) => descArr[i] ?? "");
  }
  if (colors !== undefined) {
    payload.colors = Array.isArray(colors) ? colors.map((c) => String(c).trim()).filter(Boolean) : [];
  }
  if (images !== undefined && Array.isArray(images)) {
    payload.images = images.map((p) => String(p));
    const colorArr = Array.isArray(imageColors) ? imageColors.map((c) => String(c ?? "").trim()) : [];
    payload.imageColors = (payload.images as string[]).map((_: string, i: number) => colorArr[i] ?? "");
  }
  if (body.viewImage !== undefined) payload.viewImage = String(body.viewImage ?? "").trim() || undefined;
  if (body.hoverImage !== undefined) payload.hoverImage = String(body.hoverImage ?? "").trim() || undefined;
  if (videos !== undefined && Array.isArray(videos)) {
    payload.videos = videos.map((v) => String(v).trim()).filter(Boolean);
  }
  return payload;
}

export const createProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const product = await Product.create(mapBodyToProduct(req.body));
  const productObj = product.toObject ? product.toObject() : (product as unknown as Record<string, unknown>);
  sendResponse(res, req.locale, { status: 201, message: "success.product.created", data: { product: withProductMedia(productObj as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }) } });
});

export const updateProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    mapBodyToProduct(req.body),
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found", { code: "errors.product.not_found" });
  }
  const productObj = product.toObject ? product.toObject() : (product as unknown as Record<string, unknown>);
  sendResponse(res, req.locale, { message: "success.product.updated", data: { product: withProductMedia(productObj as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }) } });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found", { code: "errors.product.not_found" });
  }
  const productObj = product.toObject ? product.toObject() : (product as unknown as Record<string, unknown>);
  sendResponse(res, req.locale, { message: "success.product.deleted", data: { product: withProductMedia(productObj as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }) } });
});

export const setProductStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { status: req.body.status },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found", { code: "errors.product.not_found" });
  }
  const productObj = product.toObject ? product.toObject() : (product as unknown as Record<string, unknown>);
  sendResponse(res, req.locale, { message: "success.product.status_updated", data: { product: withProductMedia(productObj as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }) } });
});

export const uploadProductImages = asyncHandler(async (req: Request, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new ApiError(400, "No images uploaded", { code: "errors.upload.no_image" });
  const paths = files.map((f) => productImagePath(f.filename));
  sendResponse(res, req.locale, { message: "success.product.images_uploaded", data: { paths } });
});

export const uploadProductVideos = asyncHandler(async (req: Request, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new ApiError(400, "No videos uploaded", { code: "errors.upload.no_video" });
  const paths = files.map((f) => productVideoPath(f.filename));
  sendResponse(res, req.locale, { message: "success.product.videos_uploaded", data: { paths } });
});
