const Bin = require('../models/Bin');

// Helper to normalize category
const normalizeCategory = (cat) => {
  if (!cat || cat.toLowerCase() === 'all') return null;
  const lower = cat.trim().toLowerCase();
  if (lower === 'paper') return 'Paper';
  if (lower === 'organic waste' || lower === 'organic') return 'Organic waste';
  if (lower === 'plastic') return 'Plastic';
  return cat;
};

// @desc    Get all bins with advanced filtering, search, and pagination
// @route   GET /api/bins
// @access  Public
const getBins = async (req, res, next) => {
  try {
    const {
      category,
      status,
      capacityStatus,
      isPriority,
      search,
      fillLevelMin,
      fillLevelMax,
      sort = '-createdAt',
      page = 1,
      limit = 100,
    } = req.query;

    const query = {};

    const normalizedCat = normalizeCategory(category);
    if (normalizedCat) {
      query.category = normalizedCat;
    }

    if (status) {
      const cleanStatus = status.toLowerCase().includes('offline')
        ? 'Offline'
        : status.toLowerCase().includes('online')
        ? 'Online'
        : status;
      query.status = new RegExp(`^${cleanStatus}$`, 'i');
    }

    if (capacityStatus) {
      query.capacityStatus = capacityStatus;
    }

    if (isPriority !== undefined) {
      query.isPriority = isPriority === 'true' || isPriority === true;
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

// @desc    Get Bin Monitoring Summary (Normal, Almost Full, Overflowing, Priority + Map Pins)
// @route   GET /api/bins/monitoring-summary
// @access  Public
const getBinMonitoringSummary = async (req, res, next) => {
  try {
    const rawCategory = req.query.category || 'All';
    const normalizedCat = normalizeCategory(rawCategory);

    const matchFilter = {};
    if (normalizedCat) {
      matchFilter.category = normalizedCat;
    }

    // 1. Fetch map pins
    const mapPins = await Bin.find(matchFilter)
      .select('binId category status capacityStatus isPriority fillLevel batteryLevel location latitude longitude lastUpdated')
      .sort('-lastUpdated');

    // 2. Aggregate the 4 buckets: Normal, Almost Full, Overflowing, Priority
    const summaryAgg = await Bin.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          normal: [
            { $match: { capacityStatus: 'Normal' } },
            {
              $group: {
                _id: null,
                online: { $sum: { $cond: [{ $eq: ['$status', 'Online'] }, 1, 0] } },
                offline: { $sum: { $cond: [{ $eq: ['$status', 'Offline'] }, 1, 0] } },
                total: { $sum: 1 },
              },
            },
          ],
          almostFull: [
            { $match: { capacityStatus: 'Almost Full' } },
            {
              $group: {
                _id: null,
                online: { $sum: { $cond: [{ $eq: ['$status', 'Online'] }, 1, 0] } },
                offline: { $sum: { $cond: [{ $eq: ['$status', 'Offline'] }, 1, 0] } },
                total: { $sum: 1 },
              },
            },
          ],
          overflowing: [
            { $match: { capacityStatus: 'Overflowing' } },
            {
              $group: {
                _id: null,
                online: { $sum: { $cond: [{ $eq: ['$status', 'Online'] }, 1, 0] } },
                offline: { $sum: { $cond: [{ $eq: ['$status', 'Offline'] }, 1, 0] } },
                total: { $sum: 1 },
              },
            },
          ],
          priority: [
            { $match: { isPriority: true } },
            {
              $group: {
                _id: null,
                online: { $sum: { $cond: [{ $eq: ['$status', 'Online'] }, 1, 0] } },
                offline: { $sum: { $cond: [{ $eq: ['$status', 'Offline'] }, 1, 0] } },
                total: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const extractBucket = (facetArr, title, subtitle) => {
      const data = facetArr?.[0] || { online: 0, offline: 0, total: 0 };
      return {
        title,
        subtitle,
        online: data.online || 0,
        offline: data.offline || 0,
        total: data.total || 0,
      };
    };

    const result = summaryAgg[0] || {};

    const summary = {
      normal: extractBucket(result.normal, 'Normal', 'Within safe capacity'),
      almostFull: extractBucket(result.almostFull, 'Almost Full', 'Near Capacity'),
      overflowing: extractBucket(result.overflowing, 'Overflowing', 'Critical Bins'),
      priority: extractBucket(result.priority, 'Priority', 'Priority Bins'),
    };

    res.json({
      success: true,
      category: rawCategory,
      data: {
        summary,
        mapPins,
      },
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
    const {
      binId,
      category,
      status,
      fillLevel,
      batteryLevel,
      capacityStatus,
      isPriority,
      location,
      latitude,
      longitude,
    } = req.body;

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
      capacityStatus: capacityStatus || (fillLevel >= 90 ? 'Overflowing' : fillLevel >= 75 ? 'Almost Full' : 'Normal'),
      isPriority: isPriority !== undefined ? isPriority : false,
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

    // Auto-update capacityStatus if fillLevel changed without explicit capacityStatus
    const updateData = { ...req.body, lastUpdated: Date.now() };
    if (updateData.fillLevel !== undefined && !updateData.capacityStatus) {
      if (updateData.fillLevel >= 90) updateData.capacityStatus = 'Overflowing';
      else if (updateData.fillLevel >= 75) updateData.capacityStatus = 'Almost Full';
      else updateData.capacityStatus = 'Normal';
    }

    const bin = await Bin.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });

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
  getBinMonitoringSummary,
  getBinById,
  createBin,
  updateBin,
  deleteBin,
};
