const VehicleAssignment = require('../models/VehicleAssignment');
const Driver = require('../models/Driver');
const Truck = require('../models/Truck');
const Route = require('../models/Route');

// Helper to escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all vehicle assignments with optional filtering and dropdown options
// @route   GET /api/vehicle-assignments
// @access  Public
const getVehicleAssignments = async (req, res, next) => {
  try {
    const { wasteType, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (wasteType && wasteType.trim() !== '' && wasteType.toLowerCase() !== 'all') {
      const trimmed = wasteType.trim();
      query.wasteType = new RegExp(`^${escapeRegex(trimmed)}$`, 'i');
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { vehicleId: searchRegex },
        { driverId: searchRegex },
        { driverName: searchRegex },
        { route: searchRegex },
        { wasteType: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [assignments, total, drivers, trucks, routes] = await Promise.all([
      VehicleAssignment.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      VehicleAssignment.countDocuments(query),
      Driver.find({}).select('driverId driverName name category mobileNumber').sort('driverName').limit(100),
      Truck.find({}).select('vehicleId truckNumber category status').sort('vehicleId').limit(100),
      Route.find({}).select('routeName category area').sort('routeName').limit(100),
    ]);

    // Format dropdown options for frontend convenience (Vehicles1.png)
    const availableOptions = {
      wasteTypes: ['Plastic', 'Paper', 'Organic Waste', 'E-waste', 'Chatbot'],
      drivers: drivers.map((d) => ({
        driverId: d.driverId,
        driverName: d.driverName || d.name,
        category: d.category,
      })),
      vehicles: trucks.map((t) => ({
        vehicleId: t.vehicleId,
        truckNumber: t.truckNumber,
        category: t.category,
        status: t.status,
      })),
      routes: [
        'Pla 1',
        'Pla 2',
        'Pap 1',
        'Pap 2',
        'Owa 1',
        'Owa 2',
        'Ewa 1',
        'Ewa 2',
        'Ewa 3',
        'bot 1',
        ...routes.map((r) => r.routeName),
      ].filter((v, i, a) => a.indexOf(v) === i),
    };

    res.json({
      success: true,
      count: assignments.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      availableOptions,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle assignment by ID
// @route   GET /api/vehicle-assignments/:id
// @access  Public
const getVehicleAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let assignment;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      assignment = await VehicleAssignment.findById(id);
    } else {
      assignment = await VehicleAssignment.findOne({ vehicleId: new RegExp(`^${id}$`, 'i') });
    }

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: `Vehicle assignment not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Save a new vehicle assignment (Vehicles1.png 'DONE' action)
// @route   POST /api/vehicle-assignments
// @access  Public
const createVehicleAssignment = async (req, res, next) => {
  try {
    const { vehicleId, driverId, driverName, route, wasteType, status } = req.body;

    if (!vehicleId || !driverId || !driverName || !route || !wasteType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide vehicleId, driverId, driverName, route, and wasteType',
      });
    }

    const assignment = await VehicleAssignment.create({
      vehicleId: vehicleId.trim(),
      driverId: driverId.trim(),
      driverName: driverName.trim(),
      route: route.trim(),
      wasteType: wasteType.trim(),
      status: status || 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle assignment created successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing vehicle assignment (Vehicles2.png row edit)
// @route   PUT /api/vehicle-assignments/:id
// @access  Public
const updateVehicleAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.vehicleId = new RegExp(`^${id}$`, 'i');
    }

    const assignment = await VehicleAssignment.findOneAndUpdate(
      query,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: `Vehicle assignment not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      message: 'Vehicle assignment updated successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a vehicle assignment (Vehicles2.png trash icon)
// @route   DELETE /api/vehicle-assignments/:id
// @access  Public
const deleteVehicleAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.vehicleId = new RegExp(`^${id}$`, 'i');
    }

    const assignment = await VehicleAssignment.findOneAndDelete(query);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: `Vehicle assignment not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      message: 'Vehicle assignment deleted successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicleAssignments,
  getVehicleAssignmentById,
  createVehicleAssignment,
  updateVehicleAssignment,
  deleteVehicleAssignment,
};
