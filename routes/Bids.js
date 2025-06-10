// routes/bids.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const Bid = require('../models/Bid');
const Project = require('../models/Project');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation middleware for bid placement
const validateBid = [
  body('projectId')
    .isMongoId()
    .withMessage('Valid project ID is required'),
  body('bidAmount')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Bid amount must be a positive number'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters'),
  body('estimatedDelivery')
    .optional()
    .isISO8601()
    .withMessage('Estimated delivery must be a valid date')
];

// POST /bids/place - Developer places a bid on a project
router.post('/place', authenticateToken, requireRole(['developer']), validateBid, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId, bidAmount, message, estimatedDelivery } = req.body;

    // Check if project exists and is open
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Project is not open for bidding'
      });
    }

    // Check if developer has already placed a bid on this project
    const existingBid = await Bid.findOne({
      projectId,
      developerId: req.user._id
    });

    if (existingBid) {
      return res.status(409).json({
        success: false,
        message: 'You have already placed a bid on this project'
      });
    }

    // Create new bid
    const bid = new Bid({
      projectId,
      developerId: req.user._id,
      bidAmount,
      message,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined
    });

    await bid.save();

    // Populate bid with project and developer info
    await bid.populate([
      { path: 'projectId', select: 'title estimatedBudget status' },
      { path: 'developerId', select: 'name skills experience' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: bid
    });

  } catch (error) {
    console.error('Bid placement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place bid',
      error: error.message
    });
  }
});

// GET /bids/my - Get developer's own bids
router.get('/my', authenticateToken, requireRole(['developer']), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = { developerId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bids = await Bid.find(filter)
      .populate('projectId', 'title description estimatedBudget status createdBy')
      .populate({
        path: 'projectId',
        populate: {
          path: 'createdBy',
          select: 'name company'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Bid.countDocuments(filter);

    res.json({
      success: true,
      message: 'Your bids retrieved successfully',
      data: {
        bids,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBids: total,
          hasNext: skip + bids.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Fetch my bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your bids',
      error: error.message
    });
  }
});

// PUT /bids/:id/status - Update bid status (for project owners)
router.put('/:id/status', authenticateToken, requireRole(['user']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "accepted" or "rejected"'
      });
    }

    const bid = await Bid.findById(id).populate('projectId');
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Check if the user owns the project
    if (bid.projectId.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update bids for your own projects'
      });
    }

    // Update bid status
    bid.status = status;
    await bid.save();

    // If bid is accepted, update project status and assign developer
    if (status === 'accepted') {
      await Project.findByIdAndUpdate(bid.projectId._id, {
        status: 'in progress',
        assignedTo: bid.developerId
      });

      // Reject all other bids for this project
      await Bid.updateMany(
        { 
          projectId: bid.projectId._id, 
          _id: { $ne: bid._id },
          status: 'pending'
        },
        { status: 'rejected' }
      );
    }

    await bid.populate('developerId', 'name skills experience');

    res.json({
      success: true,
      message: `Bid ${status} successfully`,
      data: bid
    });

  } catch (error) {
    console.error('Update bid status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bid status',
      error: error.message
    });
  }
});

module.exports = router;