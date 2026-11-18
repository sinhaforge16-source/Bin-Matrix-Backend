const Bin = require('../models/Bin');

// @desc    Get all bins with filtering, search, and pagination
// @route   GET /api/bins
// @access  Public
const getBins = async (req, res, next) => {
  try {
    const {
      category,
      status,
      search,
      fillLevelMin,
      fillLevelMax,
      sort = '-createdAt',
      page = 1,
      limit = 100,
    } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (fillLevelMin !== undefined || fillLevelMax !== undefined) {
      query.fillLevel = {};
      if (fillLevelMin !== undefined) query.fillLevel.$gte = Number(fillLevelMin);
      if (fillLevelMax !== undefined) query.fillLevel.$lte = Number(fillLevelMax);
    }

    if (search) {
      query.$or = [
        { binId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bins, total] = await Promise.all([
      Bin.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Bin.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: bins.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: bins,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single bin by MongoDB _id or binId
// @route   GET /api/bins/:id
// @access  Public
const getBinById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let bin;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      bin = await Bin.findById(id);
    }
    if (!bin) {
      bin = await Bin.findOne({ binId: id });
    }

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: `Bin not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: bin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new bin
// @route   POST /api/bins
// @access  Private
const createBin = async (req, res, next) => {
  try {
    const { binId, category, status, fillLevel, batteryLevel, location, latitude, longitude } =
      req.body;

    const existingBin = await Bin.findOne({ binId });
    if (existingBin) {
      return res.status(400).json({
        success: false,
        message: `Bin with ID ${binId} already exists`,
      });
    }

    const bin = await Bin.create({
      binId,
      category,
      status: status || 'Online',
      fillLevel: fillLevel !== undefined ? fillLevel : 0,
      batteryLevel: batteryLevel !== undefined ? batteryLevel : 100,
      location: location || 'Galle Rd, Dehiwala-Mount Lavinia',
      latitude,
      longitude,
    });

    res.status(201).json({
      success: true,
      data: bin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a bin
// @route   PUT /api/bins/:id
// @access  Private
const updateBin = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.binId = id;
    }

    const bin = await Bin.findOneAndUpdate(
      query,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: `Bin not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: bin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a bin
// @route   DELETE /api/bins/:id
// @access  Private
const deleteBin = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.binId = id;
    }

    const bin = await Bin.findOneAndDelete(query);

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: `Bin not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      message: `Bin ${bin.binId} removed successfully`,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBins,
  getBinById,
  createBin,
  updateBin,
  deleteBin,
};

