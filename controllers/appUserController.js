const AppUser = require('../models/AppUser');
const Bin = require('../models/Bin');

// Helper to normalize category regex
const normalizeCategoryRegex = (cat) => {
  if (!cat) return null;
  const trimmed = cat.trim();
  if (trimmed.toLowerCase().includes('organic')) {
    return /^Organic\s+Waste$/i;
  }
  return new RegExp(`^${trimmed}$`, 'i');
};

// @desc    Get all app users for user management table (Users.png)
// @route   GET /api/app-users
// @access  Public
const getAppUsers = async (req, res, next) => {
  try {
    const { category, status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (category) {
      query.category = normalizeCategoryRegex(category);
    }

    if (status) {
      query.status = new RegExp(`^${status.trim()}$`, 'i');
    }

    if (search) {
      query.$or = [
        { userId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { assignedBinId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total, availableBins] = await Promise.all([
      AppUser.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      AppUser.countDocuments(query),
      Bin.find({}).select('binId category status location fillLevel').sort('binId').limit(100),
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      availableBins: availableBins.map((b) => ({
        binId: b.binId,
        category: b.category,
        status: b.status,
        location: b.location,
        fillLevel: b.fillLevel,
      })),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single app user
// @route   GET /api/app-users/:id
// @access  Public
const getAppUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await AppUser.findById(id);
    }
    if (!user) {
      user = await AppUser.findOne({ userId: new RegExp(`^${id}$`, 'i') });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `App User not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create app user
// @route   POST /api/app-users
// @access  Public
const createAppUser = async (req, res, next) => {
  try {
    const {
      userId,
      email,
      assignedBinId,
      category,
      status,
      percentage,
      location,
      lastUpdated,
    } = req.body;

    const existingUser = await AppUser.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User with ID ${userId} already exists`,
      });
    }

    const user = await AppUser.create({
      userId,
      email: email || 's@gmail.com',
      assignedBinId: assignedBinId || '',
      category: category || 'Organic Waste',
      status: status || 'Online',
      percentage: percentage !== undefined ? percentage : 100,
      location: location || 'Galle Rd',
      lastUpdated: lastUpdated || 'Just now',
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update app user (e.g. assigned bin dropdown or status)
// @route   PUT /api/app-users/:id
// @access  Public
const updateAppUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.userId = new RegExp(`^${id}$`, 'i');
    }

    const user = await AppUser.findOneAndUpdate(
      query,
      { ...req.body, lastUpdated: 'Just now' },
      { returnDocument: 'after', runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `App User not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete app user
// @route   DELETE /api/app-users/:id
// @access  Public
const deleteAppUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.userId = new RegExp(`^${id}$`, 'i');
    }

    const user = await AppUser.findOneAndDelete(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `App User not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      message: `User ${user.userId} deleted successfully`,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppUsers,
  getAppUserById,
  createAppUser,
  updateAppUser,
  deleteAppUser,
};
