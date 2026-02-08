import mongoose, { Schema } from "mongoose";

export interface ProductCardInMessage {
  id: string;
  name: { en: string; ar: string };
  image: string;
  productUrl: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** For assistant messages: product cards (image + link) shown with this reply. */
  productCards?: ProductCardInMessage[];
}

export interface ChatSessionDocument {
  sessionId: string;
  messages: ChatMessage[];
  customerName?: string;
  customerEmail?: string;
  status: "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const productCardInMessageSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { en: String, ar: String },
    image: { type: String, default: "" },
    productUrl: { type: String, required: true }
  },
  { _id: false }
);

const chatMessageSchema = new Schema<ChatMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    productCards: { type: [productCardInMessageSchema], default: undefined }
  },
  { _id: false }
);

const chatSessionSchema = new Schema<ChatSessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true },
    messages: { type: [chatMessageSchema], default: [] },
    customerName: { type: String },
    customerEmail: { type: String },
    status: { type: String, enum: ["active", "closed"], default: "active" }
  },
  { timestamps: true }
);

chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ createdAt: -1 });
chatSessionSchema.index({ status: 1 });

export const ChatSession = mongoose.model<ChatSessionDocument>("ChatSession", chatSessionSchema);
