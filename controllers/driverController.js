const Driver = require('../models/Driver');

// @desc    Get all drivers with filtering and pagination
// @route   GET /api/drivers
// @access  Public
const getDrivers = async (req, res, next) => {
  try {
    const {
      category,
      isPresentToday,
      isAllocated,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 100,
    } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (isPresentToday !== undefined) {
      query.isPresentToday = isPresentToday === 'true';
    }

    if (isAllocated !== undefined) {
      query.isAllocated = isAllocated === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { driverId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [drivers, total] = await Promise.all([
      Driver.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Driver.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: drivers.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: drivers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single driver by id or driverId
// @route   GET /api/drivers/:id
// @access  Public
const getDriverById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let driver;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      driver = await Driver.findById(id);
    }
    if (!driver) {
      driver = await Driver.findOne({ driverId: id });
    }

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: `Driver not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new driver
// @route   POST /api/drivers
// @access  Private
const createDriver = async (req, res, next) => {
  try {
    const { name, driverId, category, isPresentToday, isAllocated, phone, email } =
      req.body;

    const existingDriver = await Driver.findOne({ driverId });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: `Driver with ID ${driverId} already exists`,
      });
    }

    const driver = await Driver.create({
      name,
      driverId,
      category,
      isPresentToday: isPresentToday !== undefined ? isPresentToday : true,
      isAllocated: isAllocated !== undefined ? isAllocated : false,
      phone,
      email,
    });

    res.status(201).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private
const updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.driverId = id;
    }

    const driver = await Driver.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: `Driver not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private
const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.driverId = id;
    }

    const driver = await Driver.findOneAndDelete(query);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: `Driver not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      message: `Driver ${driver.name} (${driver.driverId}) deleted successfully`,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
};

