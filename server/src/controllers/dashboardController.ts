import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getStats = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return res.json({
      totalOrders: 0,
      ordersToday: 0,
      revenue: 0,
      lowStockCount: 0,
      bestSelling: [],
      ordersPerDay: []
    });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));
  const startOfPeriod = new Date(startOfToday);
  startOfPeriod.setDate(startOfPeriod.getDate() - days);

  const settings = await Settings.findOne().lean();
  const threshold = settings?.lowStockThreshold ?? 5;

  const [
    totalOrders,
    ordersToday,
    deliveredOrders,
    lowStockCount,
    ordersPerDayAgg
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
    ])
  ]);

  const revenue = deliveredOrders[0]?.total ?? 0;

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
        totalQty: 1,
        _id: 0
      }
    }
  ]);

  res.json({
    totalOrders,
    ordersToday,
    revenue,
    lowStockCount,
    bestSelling,
    ordersPerDay: ordersPerDayAgg
  });
});
