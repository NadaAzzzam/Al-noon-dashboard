import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getStats = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    res.json({
      totalOrders: 0,
      ordersToday: 0,
      revenue: 0,
      lowStockCount: 0,
      bestSellingProducts: [],
      ordersPerDay: []
    });
    return;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const settings = await Settings.findOne().lean();
  const lowStockThreshold = settings?.lowStockThreshold ?? 5;

  const [
    totalOrders,
    ordersToday,
    deliveredOrders,
    lowStockCount,
    ordersPerDayAgg,
    bestSellingAgg
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.find({ status: "DELIVERED" }).select("total").lean(),
    Product.countDocuments({ deletedAt: null, stock: { $gt: 0, $lte: lowStockThreshold } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.product", totalQty: { $sum: "$items.quantity" } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $project: { name: "$product.name", totalQty: 1, _id: 0 } }
    ])
  ]);

  const revenue = deliveredOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  res.json({
    totalOrders,
    ordersToday,
    revenue,
    lowStockCount,
    bestSellingProducts: bestSellingAgg,
    ordersPerDay: ordersPerDayAgg.map((d: { _id: string; count: number }) => ({ date: d._id, count: d.count }))
  });
});
