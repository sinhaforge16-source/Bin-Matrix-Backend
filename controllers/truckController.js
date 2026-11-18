const Truck = require('../models/Truck');
const VehicleHistory = require('../models/VehicleHistory');

// Helper to normalize category
const normalizeCategoryRegex = (cat) => {
  if (!cat) return null;
  const trimmed = cat.trim();
  if (trimmed.toLowerCase().includes('organic')) {
    return /^Organic\s+Waste$/i;
  }
  return new RegExp(`^${trimmed}$`, 'i');
};

// Helper to parse dates formatted as YYYY-MM-DD or DD/MM/YYYY
const parseDateString = (str) => {
  if (!str) return null;
  const trimmed = str.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      // Assuming DD/MM/YYYY
      return new Date(Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])));
    }
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateISO = (d) => {
  return d.toISOString().split('T')[0];
};

const formatDateDisplay = (d) => {
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

// @desc    Get all trucks / fleet vehicles with filtering and pagination
// @route   GET /api/trucks
// @access  Public
const getTrucks = async (req, res, next) => {
  try {
    const {
      category,
      status,
      isIdle,
      search,
      sort = '-lastUpdated',
      page = 1,
      limit = 100,
    } = req.query;

    const query = {};

    if (category) {
      query.category = normalizeCategoryRegex(category);
    }

    if (status) {
      query.status = new RegExp(`^${status.trim()}$`, 'i');
    }

    if (isIdle !== undefined) {
      query.isIdle = isIdle === 'true' || isIdle === true;
    }

    if (search) {
      query.$or = [
        { vehicleId: { $regex: search, $options: 'i' } },
        { truckNumber: { $regex: search, $options: 'i' } },
        { 'driver.name': { $regex: search, $options: 'i' } },
        { routeCode: { $regex: search, $options: 'i' } },
        { currentLocation: { $regex: search, $options: 'i' } },
      ];
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

// @desc    Get single vehicle details (Vehicle Information, Driver, Status, Today's Summary & Route Progress)
// @route   GET /api/trucks/:id
// @access  Public
const getTruckById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let truck;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      truck = await Truck.findById(id)
        .populate('currentDriver', 'name driverId phone email')
        .populate('currentRoute', 'routeName area status');
    }

    if (!truck) {
      truck = await Truck.findOne({
        $or: [{ vehicleId: new RegExp(`^${id}$`, 'i') }, { truckNumber: new RegExp(`^${id}$`, 'i') }],
      })
        .populate('currentDriver', 'name driverId phone email')
        .populate('currentRoute', 'routeName area status');
    }

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: `Vehicle not found with identifier ${id}`,
      });
    }

    // Format clean response matching Vehicle Monitoring4.png & 11.png
    const responseData = {
      _id: truck._id,
      vehicleId: truck.vehicleId || truck.truckNumber,
      vehicleNumber: truck.truckNumber || truck.vehicleId,
      gpsDeviceId: truck.gpsDeviceId || 'FG-009',
      category: truck.category,
      wasteType: truck.category,
      driver: {
        driverId: truck.driver?.driverId || truck.currentDriver?.driverId || 'DeGK-4576',
        name: truck.driver?.name || truck.currentDriver?.name || 'G.Kamal',
        contactNumber: truck.driver?.contactNumber || truck.currentDriver?.phone || '+94 123 456 789',
      },
      currentStatus: {
        status: truck.status,
        currentSpeed: `${truck.speedKmh} km/h`,
        speedKmh: truck.speedKmh,
        lastUpdatedTime: truck.lastUpdated,
        ignitionStatus: truck.ignitionStatus,
      },
      liveLocation: {
        currentLocation: truck.currentLocation,
        latitude: truck.latitude,
        longitude: truck.longitude,
        lastUpdatedTime: truck.lastUpdated,
      },
      todaySummary: {
        totalDistance: `${truck.todaySummary?.totalDistanceKm || truck.totalDistanceKm || 0} Km`,
        totalDistanceKm: truck.todaySummary?.totalDistanceKm || truck.totalDistanceKm || 0,
        activeTime: `${truck.todaySummary?.activeTimeMinutes || 0} minutes`,
        activeTimeMinutes: truck.todaySummary?.activeTimeMinutes || 0,
        idleTime: `${truck.todaySummary?.idleTimeMinutes || 0} minutes`,
        idleTimeMinutes: truck.todaySummary?.idleTimeMinutes || 0,
        offlineTime: `${truck.todaySummary?.offlineTimeMinutes || 0} minutes`,
        offlineTimeMinutes: truck.todaySummary?.offlineTimeMinutes || 0,
      },
      routeProgress: truck.routeProgress || {
        completedBins: 0,
        pendingBins: 0,
        missedBins: 0,
        completionPercentage: 0,
        routeCoordinates: [],
      },
      raw: truck,
    };

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vehicle activity history across a date range (supporting empty date gap)
// @route   GET /api/trucks/:vehicleId/history
// @access  Public
const getVehicleHistory = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { fromDate, toDate } = req.query;

    // Verify vehicle exists or get canonical vehicleId
    const vehicle = await Truck.findOne({
      $or: [{ vehicleId: new RegExp(`^${vehicleId}$`, 'i') }, { truckNumber: new RegExp(`^${vehicleId}$`, 'i') }],
    });

    const canonicalVehicleId = vehicle ? (vehicle.vehicleId || vehicle.truckNumber) : vehicleId;
    const wasteType = vehicle ? vehicle.category : 'Organic Waste';

    // Parse date bounds
    const defaultDate = new Date(Date.UTC(2025, 11, 27)); // 2025-12-27 default from mockup
    const start = parseDateString(fromDate) || (parseDateString(toDate) ? parseDateString(toDate) : defaultDate);
    const end = parseDateString(toDate) || start;

    // Ensure start <= end
    const [fromTime, toTime] = start.getTime() <= end.getTime() ? [start, end] : [end, start];

    // Generate list of all calendar dates between fromTime and toTime
    const dateList = [];
    const curr = new Date(fromTime.getTime());
    while (curr.getTime() <= toTime.getTime()) {
      dateList.push(new Date(curr.getTime()));
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    // Fetch all existing history records for this vehicle in this date span
    const isoStrings = dateList.map((d) => formatDateISO(d));
    const displayStrings = dateList.map((d) => formatDateDisplay(d));

    const existingHistories = await VehicleHistory.find({
      vehicleId: canonicalVehicleId,
      date: { $in: [...isoStrings, ...displayStrings] },
    });

    const historyMap = {};
    existingHistories.forEach((h) => {
      historyMap[h.date] = h;
    });

    // Build day-by-day response array
    const results = dateList.map((dateObj) => {
      const iso = formatDateISO(dateObj);
      const display = formatDateDisplay(dateObj);
      const record = historyMap[iso] || historyMap[display];

      if (record && record.logs && record.logs.length > 0) {
        return {
          date: display,
          isoDate: iso,
          hasData: true,
          wasteType: record.wasteType || wasteType,
          logs: record.logs,
          dailyTotals: record.dailyTotals || {
            distanceKm: 0,
            fuelLiters: 0,
            activeTime: '0 min',
            idleTime: '0 min',
            offlineTime: '0 min',
          },
        };
      } else {
        // Explicitly return empty entry for dates without activity (matching Vehicle Monitoring10.png)
        return {
          date: display,
          isoDate: iso,
          hasData: false,
          message: 'No vehicle history available for the selected date.',
          wasteType: wasteType,
          logs: [],
          dailyTotals: null,
        };
      }
    });

    res.json({
      success: true,
      vehicleId: canonicalVehicleId,
      wasteType,
      fromDate: formatDateDisplay(new Date(fromTime)),
      toDate: formatDateDisplay(new Date(toTime)),
      daysCount: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new vehicle/truck
// @route   POST /api/trucks
// @access  Private
const createTruck = async (req, res, next) => {
  try {
    const {
      vehicleId,
      truckNumber,
      gpsDeviceId,
      category,
      driver,
      routeCode,
      startTime,
      status,
      speedKmh,
      ignitionStatus,
      currentLocation,
      latitude,
      longitude,
      todaySummary,
      routeProgress,
      totalDistanceKm,
      fuelConsumption,
    } = req.body;

    const idToUse = vehicleId || truckNumber;
    if (!idToUse) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID or Truck Number is required',
      });
    }

    const existingTruck = await Truck.findOne({
      $or: [{ vehicleId: idToUse }, { truckNumber: idToUse }],
    });
    if (existingTruck) {
      return res.status(400).json({
        success: false,
        message: `Vehicle with identifier ${idToUse} already exists`,
      });
    }

    const truck = await Truck.create({
      vehicleId: idToUse,
      truckNumber: truckNumber || idToUse,
      gpsDeviceId: gpsDeviceId || 'FG-001',
      category: category || 'Organic Waste',
      driver: driver || {},
      routeCode: routeCode || '2712-Owa-01',
      startTime: startTime || '8.00 am',
      status: status || 'Online',
      speedKmh: speedKmh !== undefined ? speedKmh : 0,
      ignitionStatus: ignitionStatus || 'Off',
      currentLocation: currentLocation || 'Dehiwala-Mount Lavinia, Sri Lanka',
      latitude,
      longitude,
      todaySummary: todaySummary || {},
      routeProgress: routeProgress || {},
      totalDistanceKm: totalDistanceKm || 0,
      fuelConsumption: fuelConsumption || 0,
    });

    res.status(201).json({
      success: true,
      data: truck,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a vehicle
// @route   PUT /api/trucks/:id
// @access  Private
const updateTruck = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.$or = [{ vehicleId: id }, { truckNumber: id }];
    }

    const truck = await Truck.findOneAndUpdate(
      query,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: `Vehicle not found with id ${id}`,
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

// @desc    Delete a vehicle
// @route   DELETE /api/trucks/:id
// @access  Private
const deleteTruck = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.$or = [{ vehicleId: id }, { truckNumber: id }];
    }

    const truck = await Truck.findOneAndDelete(query);

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: `Vehicle not found with id ${id}`,
      });
    }

    res.json({
      success: true,
      message: `Vehicle ${truck.vehicleId || truck.truckNumber} deleted successfully`,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a vehicle history record
// @route   POST /api/trucks/:vehicleId/history
// @access  Private
const createVehicleHistory = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { date, wasteType, logs, dailyTotals } = req.body;

    const history = await VehicleHistory.create({
      vehicleId,
      date,
      wasteType: wasteType || 'Organic Waste',
      logs: logs || [],
      dailyTotals: dailyTotals || {},
    });

    res.status(201).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vehicle history telemetry
// @route   GET /api/trucks/:id/history
// @access  Public
const getTruckHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fromDate, toDate } = req.query;

    const sampleHistory = [
      {
        date: '27/12/2025',
        totalDistance: '20km',
        totalFuel: '5.2 L',
        activeTime: '42 min',
        idleTime: '10 min',
        offlineTime: '20 min',
        records: [
          { timePeriod: '08:00-08:30', status: 'Online', speed: '50 km/h', countedAs: 'Running Time (30 min)', wasteType: 'Organic Waste' },
          { timePeriod: '08:30-08:40', status: 'Idle', speed: '0 km/h', countedAs: 'Idle Time (10 min)', wasteType: 'Organic Waste' },
          { timePeriod: '08:40-09:15', status: 'Online', speed: '10 km/h', countedAs: 'Running Time (35 min)', wasteType: 'Organic Waste' },
          { timePeriod: '09:15-09:30', status: 'Offline', speed: '-', countedAs: 'Offline Time (30 min)', wasteType: 'Organic Waste' },
          { timePeriod: '09:30-10:30', status: 'Online', speed: '20 km/h', countedAs: 'Running Time (1 hour)', wasteType: 'Organic Waste' },
          { timePeriod: '10:30-10:40', status: 'Idle', speed: '0 km/h', countedAs: 'Idle Time (10 min)', wasteType: 'Organic Waste' },
          { timePeriod: '10:40-11:30', status: 'Online', speed: '50 km/h', countedAs: 'Running Time (50 min)', wasteType: 'Organic Waste' },
        ]
      },
      {
        date: '20/12/2025',
        records: [],
        noHistory: true
      },
      {
        date: '21/12/2025',
        totalDistance: '15km',
        totalFuel: '4.0 L',
        activeTime: '1h 15m',
        idleTime: '10 min',
        offlineTime: '0 min',
        records: [
          { timePeriod: '08:00-08:30', status: 'Online', speed: '50 km/h', countedAs: 'Running Time (30 min)', wasteType: 'Organic Waste' },
          { timePeriod: '08:30-08:40', status: 'Idle', speed: '0 km/h', countedAs: 'Idle Time (10 min)', wasteType: 'Organic Waste' },
          { timePeriod: '08:40-09:15', status: 'Online', speed: '10 km/h', countedAs: 'Running Time (35 min)', wasteType: 'Organic Waste' },
        ]
      }
    ];

    res.json({
      success: true,
      vehicleId: id,
      fromDate: fromDate || '27/12/2025',
      toDate: toDate || '27/12/2025',
      data: sampleHistory
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrucks,
  getTruckById,
  getVehicleHistory,
  createTruck,
  updateTruck,
  deleteTruck,
  createVehicleHistory,
  getTruckHistory,
};
