// models/Bid.js
const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  developerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Developer ID is required']
  },
  bidAmount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount cannot be negative']
  },
  message: {
    type: String,
    required: [true, 'Bid message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  estimatedDelivery: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure one bid per developer per project
bidSchema.index({ projectId: 1, developerId: 1 }, { unique: true });

// Index for better query performance
bidSchema.index({ projectId: 1, createdAt: -1 });
bidSchema.index({ developerId: 1, createdAt: -1 });

module.exports = mongoose.model('Bid', bidSchema);