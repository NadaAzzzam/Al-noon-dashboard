/**
 * Reports are computed from existing data (Orders, Products, Users, ProductFeedback, Settings).
 * No Report model or seeder needed — run the full seed (npm run seed) to populate report data.
 */
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { ProductFeedback } from "../models/ProductFeedback.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

/* ───────── helpers ───────── */

function parseDateRange(query: { startDate?: string; endDate?: string }) {
  const now = new Date();
  const end = query.endDate ? new Date(query.endDate + "T23:59:59.999Z") : now;
  const start = query.startDate
    ? new Date(query.startDate + "T00:00:00.000Z")
    : new Date(end.getFullYear(), end.getMonth(), end.getDate() - 30);
  return { start, end };
}

/* ───────── Sales ───────── */

async function getSalesReport(start: Date, end: Date) {
  const dateMatch = { createdAt: { $gte: start, $lte: end } };

  const [
    revenueAgg,
    totalOrdersCount,
    deliveryFeesAgg,
    revenueOverTime,
    ordersOverTime,
    revenueByPaymentMethod,
    revenueByCategory,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { ...dateMatch, status: "DELIVERED" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments({ ...dateMatch, status: { $ne: "CANCELLED" } }),
    Order.aggregate([
      { $match: { ...dateMatch, status: { $ne: "CANCELLED" } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$deliveryFee", 0] } } } },
    ]),
    Order.aggregate([
      { $match: { ...dateMatch, status: "DELIVERED" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { ...dateMatch, status: { $ne: "CANCELLED" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { ...dateMatch, status: "DELIVERED" } },
      {
        $group: {
          _id: { $ifNull: ["$paymentMethod", "UNKNOWN"] },
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { ...dateMatch, status: { $in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "prod",
        },
      },
      { $unwind: "$prod" },
      {
        $lookup: {
          from: "categories",
          localField: "prod.category",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$cat._id",
          categoryName: { $first: "$cat.name" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 15 },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total ?? 0;
  return {
    totalRevenue,
    totalOrders: totalOrdersCount,
    averageOrderValue: totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0,
    totalDeliveryFees: deliveryFeesAgg[0]?.total ?? 0,
    revenueOverTime,
    ordersOverTime,
    revenueByPaymentMethod,
    revenueByCategory,
  };
}

/* ───────── Orders ───────── */

async function getOrdersReport(
  start: Date,
  end: Date,
  filters: { status?: string; paymentMethod?: string }
) {
  const dateMatch: Record<string, unknown> = { createdAt: { $gte: start, $lte: end } };
  if (filters.status) dateMatch.status = filters.status;
  if (filters.paymentMethod) dateMatch.paymentMethod = filters.paymentMethod;

  const [
    totalOrdersCount,
    cancelledCount,
    avgProcessingAgg,
    statusBreakdown,
    ordersByPaymentMethod,
    topOrders,
  ] = await Promise.all([
    Order.countDocuments(dateMatch),
    Order.countDocuments({ ...dateMatch, status: "CANCELLED" }),
    Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: "DELIVERED" } },
      {
        $project: {
          processingDays: {
            $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 1000 * 60 * 60 * 24],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: "$processingDays" } } },
    ]),
    Order.aggregate([
      { $match: dateMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { $ifNull: ["$paymentMethod", "UNKNOWN"] },
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
    ]),
    Order.find(dateMatch)
      .sort({ total: -1 })
      .limit(10)
      .populate("user", "name email")
      .lean(),
  ]);

  const allCount = await Order.countDocuments({ createdAt: { $gte: start, $lte: end } });

  return {
    totalOrders: totalOrdersCount,
    cancellationRate: allCount > 0 ? (cancelledCount / allCount) * 100 : 0,
    avgProcessingDays: avgProcessingAgg[0]?.avg ?? 0,
    statusBreakdown: statusBreakdown.map((s: { _id: string; count: number }) => ({
      status: s._id,
      count: s.count,
    })),
    ordersByPaymentMethod,
    topOrders: topOrders.map((o: any) => ({
      _id: o._id,
      total: o.total,
      status: o.status,
      paymentMethod: o.paymentMethod,
      user: o.user,
      createdAt: o.createdAt,
    })),
  };
}

/* ───────── Products ───────── */

async function getProductsReport(
  start: Date,
  end: Date,
  filters: { category?: string }
) {
  const orderDateMatch: Record<string, unknown> = {
    createdAt: { $gte: start, $lte: end },
    status: { $in: ["CONFIRMED", "SHIPPED", "DELIVERED"] },
  };

  const settings = await Settings.findOne().lean();
  const threshold = settings?.lowStockThreshold ?? 5;

  const [
    bestSelling,
    worstSelling,
    productsByCategory,
    lowStockItems,
    topRated,
  ] = await Promise.all([
    Order.aggregate([
      { $match: orderDateMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 20 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      ...(filters.category
        ? [{ $match: { "product.category": new mongoose.Types.ObjectId(filters.category) } }]
        : []),
      {
        $project: {
          _id: 1,
          name: "$product.name",
          image: { $arrayElemAt: ["$product.images", 0] },
          price: "$product.price",
          totalQty: 1,
          totalRevenue: 1,
        },
      },
    ]),
    Order.aggregate([
      { $match: orderDateMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalQty: 1 } },
      { $limit: 10 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      {
        $project: {
          _id: 1,
          name: "$product.name",
          image: { $arrayElemAt: ["$product.images", 0] },
          totalQty: 1,
          totalRevenue: 1,
        },
      },
    ]),
    Product.aggregate([
      { $match: { deletedAt: null, status: "ACTIVE" } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$cat._id",
          categoryName: { $first: "$cat.name" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Product.find({ deletedAt: null, stock: { $gt: 0, $lte: threshold } })
      .select("name images stock price")
      .sort({ stock: 1 })
      .limit(20)
      .lean(),
    ProductFeedback.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1, ratingCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      {
        $project: {
          _id: 1,
          name: "$product.name",
          image: { $arrayElemAt: ["$product.images", 0] },
          avgRating: { $round: ["$avgRating", 1] },
          ratingCount: 1,
        },
      },
    ]),
  ]);

  return {
    bestSelling,
    worstSelling,
    productsByCategory,
    lowStockItems: lowStockItems.map((p: any) => ({
      _id: p._id,
      name: p.name,
      image: p.images?.[0],
      stock: p.stock,
      price: p.price,
    })),
    topRated,
  };
}

/* ───────── Customers ───────── */

async function getCustomersReport(start: Date, end: Date) {
  const dateMatch = { createdAt: { $gte: start, $lte: end } };

  const [
    newCustomersOverTime,
    topCustomers,
    orderFrequency,
    newCustomersCount,
    repeatInfo,
  ] = await Promise.all([
    User.aggregate([
      { $match: { ...dateMatch, role: "USER" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { ...dateMatch, status: { $ne: "CANCELLED" } } },
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 15 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          name: "$user.name",
          email: "$user.email",
          totalSpent: 1,
          orderCount: 1,
        },
      },
    ]),
    Order.aggregate([
      { $match: { ...dateMatch, status: { $ne: "CANCELLED" } } },
      { $group: { _id: "$user", orderCount: { $sum: 1 } } },
      {
        $group: {
          _id: "$orderCount",
          customers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.countDocuments({ ...dateMatch, role: "USER" }),
    // Repeat customers: users who ordered in this period AND had orders before this period
    Order.aggregate([
      { $match: { ...dateMatch, status: { $ne: "CANCELLED" } } },
      { $group: { _id: "$user" } },
      {
        $lookup: {
          from: "orders",
          let: { uid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$uid"] },
                    { $lt: ["$createdAt", start] },
                    { $ne: ["$status", "CANCELLED"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "prev",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          repeat: { $sum: { $cond: [{ $gt: [{ $size: "$prev" }, 0] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const totalCustomersInPeriod = repeatInfo[0]?.total ?? 0;
  const repeatCustomers = repeatInfo[0]?.repeat ?? 0;
  const avgLifetimeValue =
    topCustomers.length > 0
      ? topCustomers.reduce((sum: number, c: any) => sum + c.totalSpent, 0) / topCustomers.length
      : 0;

  return {
    newCustomersCount,
    repeatCustomers,
    newCustomersInPeriod: totalCustomersInPeriod - repeatCustomers,
    avgLifetimeValue,
    newCustomersOverTime,
    topCustomers,
    orderFrequency: orderFrequency.map((f: { _id: number; customers: number }) => ({
      orders: f._id,
      customers: f.customers,
    })),
  };
}

/* ───────── Main handler ───────── */

export const getReports = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: {} });
  }

  const tab = (req.query.tab as string) || "sales";
  const { start, end } = parseDateRange(req.query as { startDate?: string; endDate?: string });

  let data: unknown;

  switch (tab) {
    case "sales":
      data = await getSalesReport(start, end);
      break;
    case "orders":
      data = await getOrdersReport(start, end, {
        status: req.query.status as string | undefined,
        paymentMethod: req.query.paymentMethod as string | undefined,
      });
      break;
    case "products":
      data = await getProductsReport(start, end, {
        category: req.query.category as string | undefined,
      });
      break;
    case "customers":
      data = await getCustomersReport(start, end);
      break;
    default:
      data = await getSalesReport(start, end);
  }

  sendResponse(res, req.locale, { data });
});
