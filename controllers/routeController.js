const Route = require('../models/Route');

// @desc    Get all routes with filtering and pagination
// @route   GET /api/routes
// @access  Public
const getRoutes = async (req, res, next) => {
  try {
    const {
      category,
      status,
      area,
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

    if (area) {
      query.area = { $regex: area, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [routes, total] = await Promise.all([
      Route.find(query)
        .populate('assignedTruck', 'truckNumber category status isIdle')
        .populate('assignedDriver', 'name driverId category isPresentToday isAllocated')
        .populate('bins', 'binId category status fillLevel location')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Route.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: routes.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: routes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single route by id
// @route   GET /api/routes/:id
// @access  Public
const getRouteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id)
      .populate('assignedTruck', 'truckNumber category status isIdle')
      .populate('assignedDriver', 'name driverId category isPresentToday isAllocated')
      .populate('bins', 'binId category status fillLevel location batteryLevel');

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new route
// @route   POST /api/routes
// @access  Private
const createRoute = async (req, res, next) => {
  try {
    const {
      routeName,
      area,
      category,
      assignedTruck,
      assignedDriver,
      status,
      bins,
      waypoints,
    } = req.body;

    const route = await Route.create({
      routeName,
      area,
      category: category || 'Plastic',
      assignedTruck: assignedTruck || null,
      assignedDriver: assignedDriver || null,
      status: status || 'Pending',
      bins: bins || [],
      waypoints: waypoints || [],
    });

    const populatedRoute = await Route.findById(route._id)
      .populate('assignedTruck', 'truckNumber category status isIdle')
      .populate('assignedDriver', 'name driverId category isPresentToday isAllocated')
      .populate('bins', 'binId category status fillLevel location');

    res.status(201).json({
      success: true,
      data: populatedRoute,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a route
// @route   PUT /api/routes/:id
// @access  Private
const updateRoute = async (req, res, next) => {
  try {
    const { id } = req.params;

    const route = await Route.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTruck', 'truckNumber category status isIdle')
      .populate('assignedDriver', 'name driverId category isPresentToday isAllocated')
      .populate('bins', 'binId category status fillLevel location');

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a route
// @route   DELETE /api/routes/:id
// @access  Private
const deleteRoute = async (req, res, next) => {
  try {
    const { id } = req.params;

    const route = await Route.findByIdAndDelete(id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      message: `Route '${route.routeName}' deleted successfully`,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
};

