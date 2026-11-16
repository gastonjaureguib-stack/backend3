import mongoose from "mongoose";
import { DOCUMENT_TYPES } from "../constants/index.js";

const fileMetadataSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: {
    type: String,
    enum: ["application/pdf", "image/jpeg", "image/png"],
    required: true,
  },
  size: { type: Number, required: true, min: 1, max: 5 * 1024 * 1024 },
  documentType: { type: String, enum: DOCUMENT_TYPES },
  uploadedAt: { type: Date, required: true, default: Date.now },
});

export default fileMetadataSchema;
