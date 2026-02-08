import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

export const getStats = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, {
      data: {
        totalOrders: 0,
        ordersToday: 0,
        revenue: 0,
        lowStockCount: 0,
        bestSelling: [],
        ordersPerDay: [],
        totalCustomers: 0,
        totalProducts: 0,
        averageOrderValue: 0,
        pendingOrdersCount: 0,
        outOfStockCount: 0,
        orderStatusBreakdown: [],
        revenueThisMonth: 0,
        revenueLastMonth: 0
      }
    });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));
  const startOfPeriod = new Date(startOfToday);
  startOfPeriod.setDate(startOfPeriod.getDate() - days);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const settings = await Settings.findOne().lean();
  const threshold = settings?.lowStockThreshold ?? 5;

  const [
    totalOrders,
    ordersToday,
    deliveredOrders,
    lowStockCount,
    ordersPerDayAgg,
    totalCustomers,
    totalProducts,
    pendingOrdersCount,
    outOfStockCount,
    orderStatusBreakdown,
    revenueThisMonthAgg,
    revenueLastMonthAgg
  ] = await Promise.all([
    Order.countDocuments({ status: { $ne: "CANCELLED" } }),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.aggregate([
      { $match: { status: "DELIVERED" } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]),
    Product.countDocuments({
      deletedAt: null,
      stock: { $gt: 0, $lte: threshold }
    }),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfPeriod }, status: { $ne: "CANCELLED" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    User.countDocuments({ role: "USER" }),
    Product.countDocuments({ deletedAt: null, status: "ACTIVE" }),
    Order.countDocuments({ status: "PENDING" }),
    Product.countDocuments({ deletedAt: null, stock: 0 }),
    Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: { status: "DELIVERED", createdAt: { $gte: startOfThisMonth } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]),
    Order.aggregate([
      { $match: { status: "DELIVERED", createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ])
  ]);

  const revenue = deliveredOrders[0]?.total ?? 0;
  const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  const bestSelling = await Order.aggregate([
    { $match: { status: { $in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        totalQty: { $sum: "$items.quantity" }
      }
    },
    { $sort: { totalQty: -1 } },
    { $limit: 10 },
    { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    {
      $project: {
        productId: "$_id",
        name: "$product.name",
        image: { $arrayElemAt: ["$product.images", 0] },
        totalQty: 1,
        _id: 0
      }
    }
  ]);

  sendResponse(res, req.locale, {
    data: {
      totalOrders,
      ordersToday,
      revenue,
      lowStockCount,
      bestSelling,
      ordersPerDay: ordersPerDayAgg,
      totalCustomers,
      totalProducts,
      averageOrderValue,
      pendingOrdersCount,
      outOfStockCount,
      orderStatusBreakdown: orderStatusBreakdown.map((s: { _id: string; count: number }) => ({ status: s._id, count: s.count })),
      revenueThisMonth: revenueThisMonthAgg[0]?.total ?? 0,
      revenueLastMonth: revenueLastMonthAgg[0]?.total ?? 0
    }
  });
});

/** GET /dashboard/top-selling – top selling products (for products page). */
export const getTopSelling = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { topSelling: [] } });
  }
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
  const topSelling = await Order.aggregate([
    { $match: { status: { $in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        totalQty: { $sum: "$items.quantity" }
      }
    },
    { $sort: { totalQty: -1 } },
    { $limit: limit },
    { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    {
      $project: {
        productId: "$_id",
        name: "$product.name",
        image: { $arrayElemAt: ["$product.images", 0] },
        totalQty: 1,
        _id: 0
      }
    }
  ]);
  sendResponse(res, req.locale, { data: { topSelling } });
});
