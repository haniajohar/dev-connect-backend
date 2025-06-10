// routes/projects.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Bid = require('../models/Bid');
const { authenticateToken, requireRole } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Validation middleware for project creation
const validateProject = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('techStack')
    .isArray({ min: 1 })
    .withMessage('At least one technology is required'),
  body('estimatedBudget')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number')
];

// POST /projects/create - User creates project
router.post('/create', authenticateToken, requireRole(['user']), validateProject, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, techStack, estimatedBudget, deadline } = req.body;

    const project = new Project({
      title,
      description,
      techStack: Array.isArray(techStack) ? techStack : [techStack],
      estimatedBudget,
      createdBy: req.user._id,
      deadline: deadline ? new Date(deadline) : undefined
    });

    await project.save();

    // Populate creator information
    await project.populate('createdBy', 'name email company');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });

  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// GET /projects/open - Developer views open projects
router.get('/open', authenticateToken, requireRole(['developer']), async (req, res) => {
  try {
    const { page = 1, limit = 10, techStack, minBudget, maxBudget } = req.query;
    
    // Build query filter
    let filter = { status: 'open' };
    
    if (techStack) {
      filter.techStack = { $in: Array.isArray(techStack) ? techStack : [techStack] };
    }
    
    if (minBudget || maxBudget) {
      filter.estimatedBudget = {};
      if (minBudget) filter.estimatedBudget.$gte = parseFloat(minBudget);
      if (maxBudget) filter.estimatedBudget.$lte = parseFloat(maxBudget);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.find(filter)
      .populate('createdBy', 'name company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      message: 'Open projects retrieved successfully',
      data: {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProjects: total,
          hasNext: skip + projects.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// GET /projects/:id/bids - Fetch all bids for a project (Bonus feature)
router.get('/:id/bids', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has permission to view bids
    // Only project owner or admin can view all bids
    if (req.user.role === 'user' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view bids for your own projects'
      });
    }

    const bids = await Bid.find({ projectId: id })
      .populate('developerId', 'name skills experience portfolio')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Project bids retrieved successfully',
      data: {
        project: {
          id: project._id,
          title: project.title,
          status: project.status
        },
        bids,
        totalBids: bids.length
      }
    });

  } catch (error) {
    console.error('Fetch bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bids',
      error: error.message
    });
  }
});

// GET /projects/export - Export all projects to JSON (Bonus feature)
router.get('/export', authenticateToken, requireRole(['user']), async (req, res) => {
  try {
    // Get all projects created by the authenticated user
    const projects = await Project.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email company')
      .populate('assignedTo', 'name email skills');

    // Create export data
    const exportData = {
      exportDate: new Date().toISOString(),
      totalProjects: projects.length,
      projects: projects.map(project => ({
        id: project._id,
        title: project.title,
        description: project.description,
        techStack: project.techStack,
        estimatedBudget: project.estimatedBudget,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        createdBy: project.createdBy,
        assignedTo: project.assignedTo,
        deadline: project.deadline
      }))
    };

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="projects-export-${Date.now()}.json"`);

    res.json(exportData);

  } catch (error) {
    console.error('Export projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export projects',
      error: error.message
    });
  }
});

module.exports = router;