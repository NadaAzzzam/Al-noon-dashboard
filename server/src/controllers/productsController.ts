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
import { toStorefrontProduct } from "../utils/toStorefrontProduct.js";
import { parseRichText } from "../utils/richTextFormatter.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { getDefaultLocale } from "../i18n.js";

/** @deprecated Use withProductMedia from types/productMedia for full media structure. Kept for store home API compatibility. */
export const withViewHoverVideo = withProductMedia;

/** Shopify-style sort keys for collection/product list (ProductCollectionSortKeys + direction). */
const SORT_FILTERS_SHOPIFY: { value: string; labelEn: string; labelAr: string }[] = [
  { value: "BEST_SELLING", labelEn: "Best selling", labelAr: "الأكثر مبيعاً" },
  { value: "CREATED_DESC", labelEn: "Newest", labelAr: "الأحدث" },
  { value: "PRICE_ASC", labelEn: "Price: Low to High", labelAr: "السعر: منخفض إلى عالي" },
  { value: "PRICE_DESC", labelEn: "Price: High to Low", labelAr: "السعر: عالي إلى منخفض" },
  { value: "TITLE_ASC", labelEn: "Name A–Z", labelAr: "الاسم أ–ي" },
  { value: "TITLE_DESC", labelEn: "Name Z–A", labelAr: "الاسم ي–أ" },
];

/** GET /api/products/filters/sort — returns sort options in Shopify format (ProductCollectionSortKeys-style). */
export const getSortFilters = asyncHandler(async (req, res) => {
  sendResponse(res, req.locale ?? getDefaultLocale(), {
    data: SORT_FILTERS_SHOPIFY,
  });
});

/** Map Shopify-style or legacy sort param to internal sort key. */
function normalizeSort(sort: string): string {
  const map: Record<string, string> = {
    CREATED_DESC: "newest",
    CREATED_ASC: "oldest",
    PRICE_ASC: "priceAsc",
    PRICE_DESC: "priceDesc",
    TITLE_ASC: "nameAsc",
    TITLE_DESC: "nameDesc",
    BEST_SELLING: "bestSelling",
    MANUAL: "newest",
    // Legacy
    newest: "newest",
    priceAsc: "priceAsc",
    priceDesc: "priceDesc",
    nameAsc: "nameAsc",
    nameDesc: "nameDesc",
    bestSelling: "bestSelling",
    leastSelling: "leastSelling",
  };
  return map[sort] ?? "newest";
}

export const listProducts = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale ?? getDefaultLocale(), {
      data: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
    });
  }
  const query = req.query ?? {};
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const status = query.status as string | undefined;
  const category = query.category as string | undefined;
  const newArrival = query.newArrival as string | undefined;
  const availability = query.availability as string | undefined;
  const color = typeof query.color === "string" ? query.color.trim() : "";
  const minPrice = query.minPrice != null ? Number(query.minPrice) : undefined;
  const maxPrice = query.maxPrice != null ? Number(query.maxPrice) : undefined;
  const sort = normalizeSort((query.sort as string) || "newest");
  const minRating = query.minRating != null ? Number(query.minRating) : undefined;
  const tagsParam = typeof query.tags === "string" ? query.tags.trim() : "";
  const vendorParam = typeof query.vendor === "string" ? query.vendor.trim() : "";
  const hasDiscount = query.hasDiscount as string | undefined;
  const slugParam = typeof query.slug === "string" ? query.slug.trim().toLowerCase() : "";

  const filter: Record<string, unknown> = { deletedAt: null };
  if (status === "ACTIVE" || status === "INACTIVE" || status === "DRAFT") filter.status = status;
  if (category) filter.category = category;
  if (slugParam && slugParam !== "*") filter.slug = slugParam;
  if (newArrival === "true") filter.isNewArrival = true;
  if (availability === "inStock") filter.stock = { $gt: 0 };
  if (availability === "outOfStock") filter.stock = 0;
  if (color) filter.colors = { $in: [new RegExp(escapeRegex(color), "i")] };

  // Tags filter: comma-separated, matches products with ANY of the tags
  if (tagsParam) {
    const tagsArr = tagsParam.split(",").map(t => t.trim()).filter(Boolean);
    if (tagsArr.length > 0) {
      filter.tags = { $in: tagsArr.map(t => new RegExp(`^${escapeRegex(t)}$`, "i")) };
    }
  }

  // Vendor filter: case-insensitive partial match
  if (vendorParam) {
    filter.vendor = new RegExp(escapeRegex(vendorParam), "i");
  }

  // Has discount filter
  if (hasDiscount === "true") {
    filter.discountPrice = { $ne: null, $gt: 0 };
  } else if (hasDiscount === "false") {
    filter.$or = filter.$or || [];
    (filter.$or as unknown[]).push(
      { discountPrice: null },
      { discountPrice: { $exists: false } },
      { discountPrice: 0 }
    );
  }

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
    const re = new RegExp(escapeRegex(search), "i");
    const searchOr: unknown[] = [
      { "name.en": re },
      { "name.ar": re },
      { "description.en": re },
      { "description.ar": re },
      { tags: { $in: [re] } },
      { vendor: re }
    ];
    // If there's already an $or from hasDiscount, wrap both in $and
    if (filter.$or) {
      filter.$and = filter.$and || [];
      (filter.$and as unknown[]).push({ $or: filter.$or });
      delete filter.$or;
      (filter.$and as unknown[]).push({ $or: searchOr });
    } else {
      filter.$or = searchOr;
    }
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
      return sendResponse(res, req.locale ?? getDefaultLocale(), {
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
    let categoryName: { en: string; ar: string } | null = null;
    if (mongoose.Types.ObjectId.isValid(category)) {
      const categoryDoc = await Category.findOne({ _id: new mongoose.Types.ObjectId(category) })
        .select("name")
        .lean();
      categoryName = categoryDoc?.name ?? null;
    }
    appliedFilters.categoryName = categoryName;
  }
  if (search) appliedFilters.search = search;
  if (status === "ACTIVE" || status === "INACTIVE" || status === "DRAFT") appliedFilters.status = status;
  if (newArrival === "true") appliedFilters.newArrival = true;
  if (minPrice != null && !Number.isNaN(minPrice)) appliedFilters.minPrice = minPrice;
  if (maxPrice != null && !Number.isNaN(maxPrice)) appliedFilters.maxPrice = maxPrice;
  if (color) appliedFilters.color = color;
  if (minRating != null && !Number.isNaN(minRating) && minRating >= 1 && minRating <= 5) appliedFilters.minRating = minRating;
  if (tagsParam) appliedFilters.tags = tagsParam;
  if (vendorParam) appliedFilters.vendor = vendorParam;
  if (hasDiscount === "true" || hasDiscount === "false") appliedFilters.hasDiscount = hasDiscount;

  const usediscountPriceSort = sort === "priceAsc" || sort === "priceDesc";
  const useSalesSort = sort === "bestSelling" || sort === "leastSelling";
  let products: unknown[];

  if (usediscountPriceSort) {
    const discountPriceSort = sort === "priceAsc" ? 1 : -1;
    products = await Product.aggregate([
      { $match: filter },
      { $addFields: { discountPrice: { $ifNull: ["$discountPrice", "$price"] } } },
      { $sort: { discountPrice: discountPriceSort as 1 | -1 } },
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
      { $project: { categoryDoc: 0 } }
    ]);
  } else if (useSalesSort) {
    const soldSort = sort === "bestSelling" ? -1 : 1;
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
          sort === "oldest" ? { createdAt: 1 } :
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

  // Add inStock, discountPercent to each product for the list response
  products = (products as Record<string, unknown>[]).map((p) => {
    const price = typeof p.price === "number" ? p.price : 0;
    const discountPrice = typeof p.discountPrice === "number" ? p.discountPrice : undefined;
    const stock = typeof p.stock === "number" ? p.stock : 0;
    const discountPercent =
      discountPrice != null && price > 0 && discountPrice < price
        ? Math.round((1 - discountPrice / price) * 100)
        : undefined;
    return {
      ...p,
      inStock: stock > 0,
      ...(discountPercent != null ? { discountPercent } : {})
    };
  });

  let data: Record<string, unknown>[] = (products as Record<string, unknown>[]).map((p) => withProductMedia(p as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }, { forList: true }) as Record<string, unknown>);
  if (query.for === "storefront") {
    data = data.map((p) => toStorefrontProduct(p));
  }
  sendResponse(res, req.locale ?? getDefaultLocale(), {
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    appliedFilters
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const productId = req.params?.id;
  const product = await Product.findOne({ _id: productId, deletedAt: null }).populate(
    "category",
    "name status"
  );
  if (!product) {
    throw new ApiError(404, "Product not found", { code: "errors.product.not_found" });
  }

  // Get color parameter from query string for color-specific images
  const query = req.query ?? {};
  const requestedColor = typeof query.color === "string" ? query.color.trim() : undefined;

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

  // When product has no variant records, synthesize variants from global stock so clients
  // always get a stock number per color/size (estimated distribution).
  const totalStock = typeof (productObj as { stock?: number }).stock === "number"
    ? Math.max(0, (productObj as { stock: number }).stock)
    : 0;
  const hasRealVariants = variants.length > 0;
  const variantList: Array<{ color: string; size: string; stock: number; outOfStock: boolean }> = hasRealVariants
    ? (variants as { color?: string; size?: string; stock?: number; outOfStock?: boolean }[]).map(v => ({
      color: v.color ?? "",
      size: v.size ?? "",
      stock: v.stock ?? 0,
      outOfStock: v.outOfStock ?? false
    }))
    : (() => {
      const n = colors.length * sizes.length;
      if (n === 0) return [];
      const base = Math.floor(totalStock / n);
      let remainder = totalStock - base * n;
      const out: Array<{ color: string; size: string; stock: number; outOfStock: boolean }> = [];
      for (const color of colors) {
        for (const size of sizes) {
          const extra = remainder > 0 ? 1 : 0;
          if (remainder > 0) remainder--;
          out.push({ color, size, stock: base + extra, outOfStock: false });
        }
      }
      return out;
    })();

  // Calculate availability for each color and size
  const availability = {
    /** "exact" when variants come from DB; "estimated" when synthesized from global stock. */
    variantsSource: hasRealVariants ? ("exact" as const) : ("estimated" as const),
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
    variants: variantList
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

  // Compute discountPercent
  const price = typeof (productObj as { price?: number }).price === "number" ? (productObj as { price: number }).price : 0;
  const discountPrice = typeof (productObj as { discountPrice?: number }).discountPrice === "number" ? (productObj as { discountPrice: number }).discountPrice : undefined;
  const discountPercent =
    discountPrice != null && price > 0 && discountPrice < price
      ? Math.round((1 - discountPrice / price) * 100)
      : undefined;

  let payload = {
    ...productWithMedia,
    availability,
    inStock: totalStock > 0,
    ...(discountPercent != null ? { discountPercent } : {}),
    ...(formattedDetails ? { formattedDetails } : {})
  };
  if (query.for === "storefront") {
    payload = toStorefrontProduct(payload as Record<string, unknown>) as typeof payload;
  }
  sendResponse(res, req.locale ?? getDefaultLocale(), {
    data: { product: payload }
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
    return sendResponse(res, req.locale ?? getDefaultLocale(), { data: [] });
  }
  const params = req.params ?? {};
  const query = req.query ?? {};
  const productId = params.id;
  const limit = Math.min(Math.max(1, Number(query.limit) || 4), 20);
  const product = await Product.findOne({ _id: productId, deletedAt: null }).select("category").lean();
  if (!product || !product.category) {
    return sendResponse(res, req.locale ?? getDefaultLocale(), { data: [] });
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
  let data: Record<string, unknown>[] = (products as Record<string, unknown>[]).map((p) => {
    const price = typeof p.price === "number" ? p.price : 0;
    const discountPrice = typeof p.discountPrice === "number" ? p.discountPrice : undefined;
    const stock = typeof p.stock === "number" ? p.stock : 0;
    const discountPercent =
      discountPrice != null && price > 0 && discountPrice < price
        ? Math.round((1 - discountPrice / price) * 100)
        : undefined;
    const withMedia = withProductMedia(p as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }, { forList: true }) as Record<string, unknown>;
    return {
      ...withMedia,
      inStock: stock > 0,
      ...(discountPercent != null ? { discountPercent } : {})
    };
  });
  if (query.for === "storefront") {
    data = data.map((p) => toStorefrontProduct(p));
  }
  sendResponse(res, req.locale ?? getDefaultLocale(), { data });
});

function mapBodyToProduct(body: Record<string, unknown>) {
  const {
    nameEn, nameAr, descriptionEn, descriptionAr, detailsEn, detailsAr, stylingTipEn, stylingTipAr,
    metaTitleEn, metaTitleAr, metaDescriptionEn, metaDescriptionAr,
    sizes, sizeDescriptions, colors, images, imageColors, videos, isNewArrival,
    tags, vendor, slug, costPerItem, weight, weightUnit,
    ...rest
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
  if (metaTitleEn !== undefined || metaTitleAr !== undefined) {
    payload.metaTitle = { en: String(metaTitleEn ?? "").trim(), ar: String(metaTitleAr ?? "").trim() };
  }
  if (metaDescriptionEn !== undefined || metaDescriptionAr !== undefined) {
    payload.metaDescription = { en: String(metaDescriptionEn ?? "").trim(), ar: String(metaDescriptionAr ?? "").trim() };
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
  if (tags !== undefined) {
    payload.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
  }
  if (vendor !== undefined) {
    payload.vendor = String(vendor ?? "").trim();
  }
  if (slug !== undefined) {
    payload.slug = String(slug ?? "").trim().toLowerCase();
  }
  if (costPerItem !== undefined) {
    payload.costPerItem = costPerItem;
  }
  if (weight !== undefined) {
    payload.weight = weight;
  }
  if (weightUnit !== undefined) {
    payload.weightUnit = weightUnit;
  }
  return payload;
}

export const createProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const mapped = mapBodyToProduct((req.body ?? {}) as Record<string, unknown>);
  const product = new Product(mapped);
  await product.save(); // pre-save hook generates slug if missing
  const productObj = product.toObject ? product.toObject() : (product as unknown as Record<string, unknown>);
  sendResponse(res, req.locale ?? getDefaultLocale(), { status: 201, message: "success.product.created", data: { product: withProductMedia(productObj as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }) } });
});

export const updateProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const params = req.params ?? {};
  const product = await Product.findOneAndUpdate(
    { _id: params.id, deletedAt: null },
    mapBodyToProduct((req.body ?? {}) as Record<string, unknown>),
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found", { code: "errors.product.not_found" });
  }
  const productObj = product.toObject ? product.toObject() : (product as unknown as Record<string, unknown>);
  sendResponse(res, req.locale ?? getDefaultLocale(), { message: "success.product.updated", data: { product: withProductMedia(productObj as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }) } });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const params = req.params ?? {};
  const product = await Product.findOneAndUpdate(
    { _id: params.id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found", { code: "errors.product.not_found" });
  }
  const productObj = product.toObject ? product.toObject() : (product as unknown as Record<string, unknown>);
  sendResponse(res, req.locale ?? getDefaultLocale(), { message: "success.product.deleted", data: { product: withProductMedia(productObj as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }) } });
});

export const setProductStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const params = req.params ?? {};
  const body = (req.body ?? {}) as Record<string, unknown>;
  const product = await Product.findOneAndUpdate(
    { _id: params.id, deletedAt: null },
    { status: body.status },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found", { code: "errors.product.not_found" });
  }
  const productObj = product.toObject ? product.toObject() : (product as unknown as Record<string, unknown>);
  sendResponse(res, req.locale ?? getDefaultLocale(), { message: "success.product.status_updated", data: { product: withProductMedia(productObj as { images?: string[]; viewImage?: string; hoverImage?: string; videos?: string[] }) } });
});

export const uploadProductImages = asyncHandler(async (req: Request, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new ApiError(400, "No images uploaded", { code: "errors.upload.no_image" });
  const paths = files.map((f) => productImagePath(f.filename));
  sendResponse(res, req.locale ?? getDefaultLocale(), { message: "success.product.images_uploaded", data: { paths } });
});

export const uploadProductVideos = asyncHandler(async (req: Request, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new ApiError(400, "No videos uploaded", { code: "errors.upload.no_video" });
  const paths = files.map((f) => productVideoPath(f.filename));
  sendResponse(res, req.locale ?? getDefaultLocale(), { message: "success.product.videos_uploaded", data: { paths } });
});
