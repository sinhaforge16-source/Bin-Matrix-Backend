const Route = require('../models/Route');
const RoutePlan = require('../models/RoutePlan');
const Notification = require('../models/Notification');

// Helper to normalize category
const normalizeCategory = (cat) => {
  if (!cat) return 'Organic Waste';
  const trimmed = cat.trim();
  if (trimmed.toLowerCase().includes('organic')) return 'Organic Waste';
  if (trimmed.toLowerCase().includes('paper')) return 'Paper';
  if (trimmed.toLowerCase().includes('plastic')) return 'Plastic';
  if (trimmed.toLowerCase().includes('chat')) return 'Chatbot';
  return trimmed;
};

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
      query.category = new RegExp(`^${category.trim()}$`, 'i');
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
        .populate('assignedTruck', 'truckNumber vehicleId category status isIdle')
        .populate('assignedDriver', 'name driverName driverId category isPresentToday isAllocated')
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

// @desc    Get optimized route plan with steps 01-05 & waypoints (Routes1.png & Routes2.png)
// @route   GET /api/routes/optimized
// @access  Public
const getOptimizedRoute = async (req, res, next) => {
  try {
    const rawCategory = req.query.category || 'Organic Waste';
    const category = normalizeCategory(rawCategory);

    let plan = await RoutePlan.findOne({
      category: new RegExp(`^${category}$`, 'i'),
    });

    if (!plan) {
      // Create default plan matching Routes2.png
      plan = await RoutePlan.create({
        category,
        routeName: category === 'Organic Waste' ? '2712-Ewa-01' : `2712-${category.substring(0, 3)}-01`,
        isOptimized: true,
        steps: [
          {
            stepNumber: 1,
            stepLabel: '01',
            status: 'Active',
            description: 'Dedigamuwa to Ranala Junction Road',
            coordinates: [
              { lat: 6.8851, lng: 80.0154, stopName: 'Dedigamuwa Stop A' },
              { lat: 6.8920, lng: 80.0180, stopName: 'Ranala Approach' },
            ],
          },
          {
            stepNumber: 2,
            stepLabel: '02',
            status: 'Pending',
            description: 'Ranala Main Collection Hub',
            coordinates: [
              { lat: 6.9152, lng: 80.0214, stopName: 'Ranala Central' },
              { lat: 6.9110, lng: 80.0380, stopName: 'River Connection' },
            ],
          },
          {
            stepNumber: 3,
            stepLabel: '03',
            status: 'Pending',
            description: 'Embulgama River Bank Waypoint',
            coordinates: [
              { lat: 6.8853, lng: 80.0542, stopName: 'Embulgama Central' },
              { lat: 6.8810, lng: 80.0510, stopName: 'Embulgama South' },
            ],
          },
          {
            stepNumber: 4,
            stepLabel: '04',
            status: 'Pending',
            description: 'Jalthara Crossway to Artigala',
            coordinates: [
              { lat: 6.8784, lng: 80.0451, stopName: 'Jalthara Crossing' },
              { lat: 6.8724, lng: 80.0381, stopName: 'Artigala Junction' },
            ],
          },
          {
            stepNumber: 5,
            stepLabel: '05',
            status: 'Pending',
            description: 'Hanwella Town & Bus Stand Terminal',
            coordinates: [
              { lat: 6.8925, lng: 80.0835, stopName: 'Hanwella Bus Stand' },
              { lat: 6.8912, lng: 80.0812, stopName: 'Hanwella Town Center' },
            ],
          },
        ],
      });
    }

    // Full route line path connecting the stops for map drawing
    const fullRoutePath = [
      { lat: 6.8851, lng: 80.0154, name: 'Dedigamuwa' },
      { lat: 6.9152, lng: 80.0214, name: 'Ranala' },
      { lat: 6.8853, lng: 80.0542, name: 'Embulgama' },
      { lat: 6.8724, lng: 80.0381, name: 'Artigala' },
      { lat: 6.8925, lng: 80.0835, name: 'Hanwella' },
    ];

    res.json({
      success: true,
      category,
      routeName: plan.routeName,
      isOptimized: plan.isOptimized,
      isConfirmed: plan.isConfirmed,
      confirmedAt: plan.confirmedAt,
      totalSteps: plan.steps.length,
      steps: plan.steps,
      fullRoutePath,
      data: {
        ...plan.toObject(),
        fullRoutePath,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm active route plan (Confirm button in Routes1.png & Routes2.png)
// @route   POST /api/routes/confirm
// @access  Public
const confirmRoute = async (req, res, next) => {
  try {
    const { category, routeName, steps } = req.body;
    const cat = normalizeCategory(category);
    const chosenRouteName = routeName || (cat === 'Organic Waste' ? '2712-Ewa-01' : `2712-${cat.substring(0, 3)}-01`);

    let plan = await RoutePlan.findOne({
      $or: [{ routeName: chosenRouteName }, { category: new RegExp(`^${cat}$`, 'i') }],
    });

    if (plan) {
      plan.isConfirmed = true;
      plan.confirmedAt = new Date();
      if (steps && steps.length > 0) {
        plan.steps = steps;
      }
      await plan.save();
    } else {
      plan = await RoutePlan.create({
        category: cat,
        routeName: chosenRouteName,
        isOptimized: true,
        isConfirmed: true,
        confirmedAt: new Date(),
        steps: steps || [],
      });
    }

    // Automatically trigger notification for route confirmation
    await Notification.create({
      category: 'Routes',
      message: `Route ${chosenRouteName} for ${cat} has been confirmed and scheduled for execution.`,
      actionType: 'Route',
      targetId: chosenRouteName,
      actionLabel: 'View Route',
      timeAgo: 'Just now',
    });

    res.json({
      success: true,
      message: `Route ${chosenRouteName} confirmed successfully`,
      data: plan,
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
      .populate('assignedTruck', 'truckNumber vehicleId category status isIdle')
      .populate('assignedDriver', 'name driverName driverId category isPresentToday isAllocated')
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
      .populate('assignedTruck', 'truckNumber vehicleId category status isIdle')
      .populate('assignedDriver', 'name driverName driverId category isPresentToday isAllocated')
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
      .populate('assignedTruck', 'truckNumber vehicleId category status isIdle')
      .populate('assignedDriver', 'name driverName driverId category isPresentToday isAllocated')
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
  getOptimizedRoute,
  confirmRoute,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
};
