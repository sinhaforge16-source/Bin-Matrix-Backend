const Bin = require('../models/Bin');
const Driver = require('../models/Driver');
const Truck = require('../models/Truck');

// @desc    Get dashboard summary metrics matching Home.png
// @route   GET /api/dashboard/summary
// @access  Public or Protected
const getDashboardSummary = async (req, res, next) => {
  try {
    const categories = ['Plastic', 'Paper', 'Organic waste'];

    // 1. Overall Bin Status Aggregation
    const binCounts = await Bin.aggregate([
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          lowBatteryCount: [
            {
              $match: { batteryLevel: { $lte: 20 } },
            },
            {
              $count: 'count',
            },
          ],
          fillLevelPerCategory: [
            {
              $group: {
                _id: '$category',
                avgFill: { $avg: '$fillLevel' },
                count: { $sum: 1 },
              },
            },
          ],
          totalBins: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ]);

    const statusCountsMap = {};
    if (binCounts[0]?.statusCounts) {
      binCounts[0].statusCounts.forEach((sc) => {
        statusCountsMap[sc._id] = sc.count;
      });
    }

    const onlineBins = statusCountsMap['Online'] || 0;
    const offlineBins = statusCountsMap['Offline'] || 0;
    const totalBins = binCounts[0]?.totalBins[0]?.count || 0;
    const lowBattery = binCounts[0]?.lowBatteryCount[0]?.count || 0;

    const fillLevelsMap = {
      Plastic: 0,
      Paper: 0,
      'Organic waste': 0,
    };

    if (binCounts[0]?.fillLevelPerCategory) {
      binCounts[0].fillLevelPerCategory.forEach((fc) => {
        fillLevelsMap[fc._id] = Math.round(fc.avgFill || 0);
      });
    }

    // 2. Driver Status Breakdown by Category
    const driverAgg = await Driver.aggregate([
      {
        $group: {
          _id: '$category',
          totalDrivers: { $sum: 1 },
          todaysPresent: {
            $sum: { $cond: [{ $eq: ['$isPresentToday', true] }, 1, 0] },
          },
          allocatedDrivers: {
            $sum: { $cond: [{ $eq: ['$isAllocated', true] }, 1, 0] },
          },
          unallocatedPresent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isPresentToday', true] },
                    { $eq: ['$isAllocated', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const driverStatsByCategory = {};
    categories.forEach((cat) => {
      driverStatsByCategory[cat] = {
        totalDrivers: 0,
        todaysPresent: 0,
        allocatedDrivers: 0,
        unallocatedPresent: 0,
      };
    });

    driverAgg.forEach((da) => {
      if (driverStatsByCategory[da._id]) {
        driverStatsByCategory[da._id] = {
          totalDrivers: da.totalDrivers,
          todaysPresent: da.todaysPresent,
          allocatedDrivers: da.allocatedDrivers,
          unallocatedPresent: da.unallocatedPresent,
        };
      }
    });

    // 3. Truck Status Breakdown by Category
    const truckAgg = await Truck.aggregate([
      {
        $group: {
          _id: '$category',
          totalTrucks: { $sum: 1 },
          online: {
            $sum: { $cond: [{ $eq: ['$status', 'Online'] }, 1, 0] },
          },
          offline: {
            $sum: { $cond: [{ $eq: ['$status', 'Offline'] }, 1, 0] },
          },
          idleTruck: {
            $sum: { $cond: [{ $eq: ['$isIdle', true] }, 1, 0] },
          },
          totalDistanceKm: { $sum: '$totalDistanceKm' },
          fuelConsumption: { $sum: '$fuelConsumption' },
        },
      },
    ]);

    const truckStatsByCategory = {};
    categories.forEach((cat) => {
      truckStatsByCategory[cat] = {
        online: 0,
        offline: 0,
        totalTrucks: 0,
        idleTruck: 0,
        totalDistanceKm: 0,
        fuelConsumption: 0,
      };
    });

    truckAgg.forEach((ta) => {
      if (truckStatsByCategory[ta._id]) {
        truckStatsByCategory[ta._id] = {
          online: ta.online,
          offline: ta.offline,
          totalTrucks: ta.totalTrucks,
          idleTruck: ta.idleTruck,
          totalDistanceKm: Math.round(ta.totalDistanceKm),
          fuelConsumption: Math.round(ta.fuelConsumption),
        };
      }
    });

    // Combine category breakdowns
    const categoriesBreakdown = {};
    categories.forEach((cat) => {
      categoriesBreakdown[cat] = {
        driverStatus: driverStatsByCategory[cat],
        truckStatus: truckStatsByCategory[cat],
      };
    });

    res.json({
      success: true,
      data: {
        location: 'Galle Rd, Dehiwala-Mount Lavinia',
        binStatus: {
          online: onlineBins,
          offline: offlineBins,
          total: totalBins,
          ratio: `${onlineBins}/${offlineBins}`,
          lowBattery,
          fillLevel: {
            Plastic: fillLevelsMap['Plastic'],
            Paper: fillLevelsMap['Paper'],
            'Organic waste': fillLevelsMap['Organic waste'],
          },
        },
        categories: categoriesBreakdown,
        // Individual breakdowns for direct convenience
        driverStatus: driverStatsByCategory,
        truckStatus: truckStatsByCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};

