const Truck = require('../models/Truck');

// @desc    Get all trucks with filtering and pagination
// @route   GET /api/trucks
// @access  Public
const getTrucks = async (req, res, next) => {
  try {
    const {
      category,
      status,
      isIdle,
      search,
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

    if (isIdle !== undefined) {
      query.isIdle = isIdle === 'true';
    }

    if (search) {
      query.truckNumber = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [trucks, total] = await Promise.all([
      Truck.find(query)
        .populate('currentDriver', 'name driverId phone')
        .populate('currentRoute', 'routeName area status')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Truck.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: trucks.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: trucks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single truck by id or truckNumber
// @route   GET /api/trucks/:id
// @access  Public
const getTruckById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let truck;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      truck = await Truck.findById(id)
        .populate('currentDriver', 'name driverId phone')
        .populate('currentRoute', 'routeName area status');
    }
    if (!truck) {
      truck = await Truck.findOne({ truckNumber: id })
        .populate('currentDriver', 'name driverId phone')
        .populate('currentRoute', 'routeName area status');
    }

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: `Truck not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: truck,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new truck
// @route   POST /api/trucks
// @access  Private
const createTruck = async (req, res, next) => {
  try {
    const {
      truckNumber,
      category,
      status,
      isIdle,
      totalDistanceKm,
      fuelConsumption,
      currentDriver,
      currentRoute,
    } = req.body;

    const existingTruck = await Truck.findOne({ truckNumber });
    if (existingTruck) {
      return res.status(400).json({
        success: false,
        message: `Truck with number ${truckNumber} already exists`,
      });
    }

    const truck = await Truck.create({
      truckNumber,
      category,
      status: status || 'Online',
      isIdle: isIdle !== undefined ? isIdle : false,
      totalDistanceKm: totalDistanceKm !== undefined ? totalDistanceKm : 0,
      fuelConsumption: fuelConsumption !== undefined ? fuelConsumption : 0,
      currentDriver: currentDriver || null,
      currentRoute: currentRoute || null,
    });

    res.status(201).json({
      success: true,
      data: truck,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a truck
// @route   PUT /api/trucks/:id
// @access  Private
const updateTruck = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.truckNumber = id;
    }

    const truck = await Truck.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('currentDriver', 'name driverId phone')
      .populate('currentRoute', 'routeName area status');

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: `Truck not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: truck,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a truck
// @route   DELETE /api/trucks/:id
// @access  Private
const deleteTruck = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.truckNumber = id;
    }

    const truck = await Truck.findOneAndDelete(query);

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: `Truck not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      message: `Truck ${truck.truckNumber} deleted successfully`,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  deleteTruck,
};

