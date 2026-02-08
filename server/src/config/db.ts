import mongoose from "mongoose";
import { env } from "./env.js";

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });
  return mongoose.connection;
};
