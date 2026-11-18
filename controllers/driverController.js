const Driver = require('../models/Driver');

// Helper to normalize category regex
const normalizeCategoryRegex = (cat) => {
  if (!cat) return null;
  const trimmed = cat.trim();
  if (trimmed.toLowerCase().includes('organic')) {
    return /^Organic\s+Waste$/i;
  }
  return new RegExp(`^${trimmed}$`, 'i');
};

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
      query.category = normalizeCategoryRegex(category);
    }

    if (isPresentToday !== undefined) {
      query.isPresentToday = isPresentToday === 'true' || isPresentToday === true;
    }

    if (isAllocated !== undefined) {
      query.isAllocated = isAllocated === 'true' || isAllocated === true;
    }

    if (search) {
      query.$or = [
        { driverName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { driverId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [drivers, total] = await Promise.all([
      Driver.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Driver.countDocuments(query),
    ]);

    // Format driver objects to match Driver1.png / Driver2.png table columns
    const formattedDrivers = drivers.map((d) => ({
      _id: d._id,
      driverId: d.driverId,
      driverName: d.driverName || d.name,
      name: d.name || d.driverName,
      category: d.category,
      mobileNumber: d.mobileNumber || d.phone,
      phone: d.phone || d.mobileNumber,
      email: d.email,
      password: '••••••••••',
      isPresentToday: d.isPresentToday,
      isAllocated: d.isAllocated,
      createdAt: d.createdAt,
    }));

    res.json({
      success: true,
      count: formattedDrivers.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: formattedDrivers,
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
      driver = await Driver.findOne({ driverId: new RegExp(`^${id}$`, 'i') });
    }

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: `Driver not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: {
        _id: driver._id,
        driverId: driver.driverId,
        driverName: driver.driverName || driver.name,
        name: driver.name || driver.driverName,
        category: driver.category,
        mobileNumber: driver.mobileNumber || driver.phone,
        phone: driver.phone || driver.mobileNumber,
        email: driver.email,
        password: '••••••••••',
        isPresentToday: driver.isPresentToday,
        isAllocated: driver.isAllocated,
        createdAt: driver.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new driver (Add Driver in Driver2.png)
// @route   POST /api/drivers
// @access  Public
const createDriver = async (req, res, next) => {
  try {
    const {
      name,
      driverName,
      driverId,
      category,
      isPresentToday,
      isAllocated,
      phone,
      mobileNumber,
      email,
      password,
    } = req.body;

    const chosenName = driverName || name;
    if (!chosenName) {
      return res.status(400).json({
        success: false,
        message: 'Driver name is required',
      });
    }

    // Auto-generate or format driverId (e.g. DRI-123)
    let chosenId = driverId;
    if (!chosenId) {
      const count = await Driver.countDocuments();
      chosenId = `DRI-${100 + count + 1}`;
    }

    const existingDriver = await Driver.findOne({ driverId: chosenId });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: `Driver with ID ${chosenId} already exists`,
      });
    }

    const driver = await Driver.create({
      driverId: chosenId,
      driverName: chosenName,
      name: chosenName,
      category: category || 'Organic Waste',
      mobileNumber: mobileNumber || phone || '+94 123 456 789',
      phone: phone || mobileNumber || '+94 123 456 789',
      email: email || 's@gmail.com',
      password: password || 'admin123',
      isPresentToday: isPresentToday !== undefined ? isPresentToday : true,
      isAllocated: isAllocated !== undefined ? isAllocated : false,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: driver._id,
        driverId: driver.driverId,
        driverName: driver.driverName,
        name: driver.name,
        category: driver.category,
        mobileNumber: driver.mobileNumber,
        email: driver.email,
        password: '••••••••••',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver (inline edits for name, mobile, email, password)
// @route   PUT /api/drivers/:id
// @access  Public
const updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    let driver;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      driver = await Driver.findById(id);
    }
    if (!driver) {
      driver = await Driver.findOne({ driverId: new RegExp(`^${id}$`, 'i') });
    }

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: `Driver not found with id ${id}`,
      });
    }

    // Apply updates
    if (req.body.driverName) {
      driver.driverName = req.body.driverName;
      driver.name = req.body.driverName;
    } else if (req.body.name) {
      driver.name = req.body.name;
      driver.driverName = req.body.name;
    }

    if (req.body.mobileNumber) {
      driver.mobileNumber = req.body.mobileNumber;
      driver.phone = req.body.mobileNumber;
    } else if (req.body.phone) {
      driver.phone = req.body.phone;
      driver.mobileNumber = req.body.phone;
    }

    if (req.body.email) driver.email = req.body.email;
    if (req.body.category) driver.category = req.body.category;
    if (req.body.isPresentToday !== undefined) driver.isPresentToday = req.body.isPresentToday;
    if (req.body.isAllocated !== undefined) driver.isAllocated = req.body.isAllocated;

    if (req.body.password && !req.body.password.includes('••')) {
      driver.password = req.body.password;
    }

    const updated = await driver.save();

    res.json({
      success: true,
      data: {
        _id: updated._id,
        driverId: updated.driverId,
        driverName: updated.driverName,
        name: updated.name,
        category: updated.category,
        mobileNumber: updated.mobileNumber,
        email: updated.email,
        password: '••••••••••',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Public
const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.driverId = new RegExp(`^${id}$`, 'i');
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
      message: `Driver ${driver.driverName || driver.name} (${driver.driverId}) deleted successfully`,
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
