// models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  techStack: [{
    type: String,
    required: true,
    trim: true
  }],
  estimatedBudget: {
    type: Number,
    required: [true, 'Estimated budget is required'],
    min: [0, 'Budget cannot be negative']
  },
  status: {
    type: String,
    enum: ['open', 'in progress', 'completed'],
    default: 'open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deadline: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Project', projectSchema);