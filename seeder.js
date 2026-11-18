const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Load models
const User = require('./models/User');
const Bin = require('./models/Bin');
const Driver = require('./models/Driver');
const Truck = require('./models/Truck');
const Route = require('./models/Route');
const ReportMetric = require('./models/ReportMetric');
const VehicleHistory = require('./models/VehicleHistory');

// Connect to DB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/binmatrix'
    );
    console.log(`MongoDB Connected for seeding: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Sri Lankan geographic locations & realistic coordinates
const geographicLocations = [
  { area: 'Galle Rd, Dehiwala-Mount Lavinia', lat: 6.8421, lng: 79.8642 },
  { area: 'Dehiwala', lat: 6.8524, lng: 79.8654 },
  { area: 'Mount Lavinia', lat: 6.8372, lng: 79.8631 },
  { area: 'Hanwella Town', lat: 6.8912, lng: 80.0812 },
  { area: 'Pahala Hanwella', lat: 6.8975, lng: 80.0754 },
  { area: 'Hanwella Bus Stand', lat: 6.8925, lng: 80.0835 },
  { area: 'Nawagamuwa', lat: 6.9242, lng: 80.0051 },
  { area: 'Dedigamuwa', lat: 6.8851, lng: 80.0154 },
  { area: 'Artigala', lat: 6.8724, lng: 80.0381 },
  { area: 'Ranala', lat: 6.9152, lng: 80.0214 },
  { area: 'Embulgama', lat: 6.8853, lng: 80.0542 },
  { area: 'Jalthara', lat: 6.8784, lng: 80.0451 },
];

const importData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany(),
      Bin.deleteMany(),
      Driver.deleteMany(),
      Truck.deleteMany(),
      Route.deleteMany(),
      ReportMetric.deleteMany(),
      VehicleHistory.deleteMany(),
    ]);

    // 1. Seed Users (Default Admin & Staff)
    console.log('Seeding Users...');
    const users = await User.create([
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        email: 'admin@binmatrix.com',
        fullName: 'Admin Manager',
      },
      {
        username: 'kamal_driver',
        password: 'admin123',
        role: 'driver',
        email: 'kamal@binmatrix.com',
        fullName: 'G. Kamal',
      },
      {
        username: 'sunil_operator',
        password: 'admin123',
        role: 'manager',
        email: 'sunil@binmatrix.com',
        fullName: 'Sunil Silva',
      },
    ]);
    console.log(`Created ${users.length} users (Admin: admin / admin123)`);

    // 2. Seed Bins
    console.log('Seeding Bins (123 total to match 120 Online / 3 Offline)...');
    const specificDesignBins = [
      { binId: 'Deh-2213-Ai', category: 'Paper', fillLevel: 80, status: 'Online', location: 'Galle Rd', capacityStatus: 'Almost Full', isPriority: true, lat: 6.8421, lng: 79.8642 },
      { binId: 'Deh-2233-Gn', category: 'Paper', fillLevel: 85, status: 'Offline', location: 'Dehiwala', capacityStatus: 'Almost Full', isPriority: true, lat: 6.8524, lng: 79.8654 },
      { binId: 'Deh-2243-Fa', category: 'Paper', fillLevel: 80, status: 'Offline', location: 'Mount Lavinia', capacityStatus: 'Almost Full', isPriority: true, lat: 6.8372, lng: 79.8631 },
      { binId: 'Deh-2314-At', category: 'Paper', fillLevel: 82, status: 'Online', location: 'Mount Lavinia', capacityStatus: 'Almost Full', isPriority: true, lat: 6.8395, lng: 79.8655 },
      { binId: 'Deh-3213-Sw', category: 'Paper', fillLevel: 90, status: 'Online', location: 'Dehiwala', capacityStatus: 'Almost Full', isPriority: false, lat: 6.8550, lng: 79.8680 },
      { binId: 'Deh-4213-Tm', category: 'Paper', fillLevel: 88, status: 'Offline', location: 'Dehiwala', capacityStatus: 'Almost Full', isPriority: true, lat: 6.8480, lng: 79.8640 },
      { binId: 'Deh-3618-Ys', category: 'Paper', fillLevel: 89, status: 'Online', location: 'Galle Rd', capacityStatus: 'Almost Full', isPriority: false, lat: 6.8440, lng: 79.8650 },
      { binId: 'Deh-4789-Vp', category: 'Paper', fillLevel: 91, status: 'Online', location: 'Dehiwala', capacityStatus: 'Almost Full', isPriority: true, lat: 6.8530, lng: 79.8670 },
      { binId: 'Deh-5213-Ai', category: 'Paper', fillLevel: 90, status: 'Offline', location: 'Galle Rd', capacityStatus: 'Almost Full', isPriority: true, lat: 6.8410, lng: 79.8620 },
      { binId: 'Deh-6213-Ai', category: 'Paper', fillLevel: 80, status: 'Online', location: 'Galle Rd', capacityStatus: 'Almost Full', isPriority: false, lat: 6.8450, lng: 79.8660 },

      // Hanwella & East cluster
      { binId: 'Han-1012-Kl', category: 'Plastic', fillLevel: 94, status: 'Online', location: 'Hanwella Town', capacityStatus: 'Overflowing', isPriority: true, lat: 6.8912, lng: 80.0812 },
      { binId: 'Han-1025-Np', category: 'Plastic', fillLevel: 92, status: 'Online', location: 'Hanwella Bus Stand', capacityStatus: 'Overflowing', isPriority: true, lat: 6.8925, lng: 80.0835 },
      { binId: 'Han-1033-Pt', category: 'Organic waste', fillLevel: 95, status: 'Online', location: 'Pahala Hanwella', capacityStatus: 'Overflowing', isPriority: true, lat: 6.8975, lng: 80.0754 },
      { binId: 'Naw-3011-Mn', category: 'Plastic', fillLevel: 45, status: 'Online', location: 'Nawagamuwa', capacityStatus: 'Normal', isPriority: false, lat: 6.9242, lng: 80.0051 },
      { binId: 'Ded-4015-Qr', category: 'Organic waste', fillLevel: 55, status: 'Online', location: 'Dedigamuwa', capacityStatus: 'Normal', isPriority: false, lat: 6.8851, lng: 80.0154 },
      { binId: 'Art-5012-St', category: 'Paper', fillLevel: 30, status: 'Online', location: 'Artigala', capacityStatus: 'Normal', isPriority: false, lat: 6.8724, lng: 80.0381 },
      { binId: 'Ran-6014-Uv', category: 'Plastic', fillLevel: 50, status: 'Online', location: 'Ranala', capacityStatus: 'Normal', isPriority: false, lat: 6.9152, lng: 80.0214 },
      { binId: 'Emb-7018-Wx', category: 'Organic waste', fillLevel: 40, status: 'Online', location: 'Embulgama', capacityStatus: 'Normal', isPriority: false, lat: 6.8853, lng: 80.0542 },
      { binId: 'Jal-8022-Yz', category: 'Plastic', fillLevel: 60, status: 'Online', location: 'Jalthara', capacityStatus: 'Normal', isPriority: false, lat: 6.8784, lng: 80.0451 },
    ];

    const binsToInsert = [];
    const usedBinIds = new Set();

    specificDesignBins.forEach((b, idx) => {
      usedBinIds.add(b.binId);
      binsToInsert.push({
        binId: b.binId,
        category: b.category,
        status: b.status,
        fillLevel: b.fillLevel,
        batteryLevel: idx < 3 ? 15 : 90,
        capacityStatus: b.capacityStatus,
        isPriority: b.isPriority,
        location: b.location,
        latitude: b.lat,
        longitude: b.lng,
        lastUpdated: new Date(Date.now() - idx * 600000),
      });
    });

    const categories = ['Plastic', 'Paper', 'Organic waste'];
    const targetCounts = { Plastic: 41, Paper: 41, 'Organic waste': 41 };
    const currentCounts = { Plastic: 0, Paper: 0, 'Organic waste': 0 };

    binsToInsert.forEach((b) => {
      currentCounts[b.category]++;
    });

    let lowBatteryAssigned = binsToInsert.filter((b) => b.batteryLevel <= 20).length;

    categories.forEach((cat) => {
      const needed = targetCounts[cat] - currentCounts[cat];
      const prefix = cat.substring(0, 3).toUpperCase();

      for (let i = 1; i <= needed; i++) {
        let binId = `${prefix}-${String(i).padStart(3, '0')}`;
        let counter = 1;
        while (usedBinIds.has(binId)) {
          binId = `${prefix}-${String(counter++).padStart(3, '0')}-A`;
        }
        usedBinIds.add(binId);

        const geo = geographicLocations[i % geographicLocations.length];
        let fillLevel = cat === 'Plastic' ? 15 : cat === 'Paper' ? 8 : 30;
        let capacityStatus = 'Normal';
        if (fillLevel >= 90) capacityStatus = 'Overflowing';
        else if (fillLevel >= 75) capacityStatus = 'Almost Full';

        let batteryLevel = 85 + (i % 15);
        if (lowBatteryAssigned < 10 && i % 4 === 0) {
          batteryLevel = 14;
          lowBatteryAssigned++;
        }

        binsToInsert.push({
          binId,
          category: cat,
          status: 'Online',
          fillLevel,
          batteryLevel,
          capacityStatus,
          isPriority: i % 8 === 0,
          location: geo.area,
          latitude: geo.lat + (i * 0.001),
          longitude: geo.lng + (i * 0.001),
          lastUpdated: new Date(Date.now() - (i + 10) * 600000),
        });
      }
    });

    const createdBins = await Bin.insertMany(binsToInsert);
    console.log(`Seeded ${createdBins.length} bins.`);

    // 3. Seed Drivers (100 per category = 300 total)
    console.log('Seeding Drivers (100 per category = 300 total)...');
    const driversToInsert = [];
    categories.forEach((cat) => {
      const prefix = cat.substring(0, 3).toUpperCase();
      for (let i = 1; i <= 100; i++) {
        const isPresentToday = i <= 94;
        const isAllocated = i <= 90;
        driversToInsert.push({
          name: i === 1 ? 'G. Kamal' : `Driver ${prefix}-${i}`,
          driverId: `DRI-${prefix}-${String(i).padStart(3, '0')}`,
          category: cat,
          isPresentToday,
          isAllocated,
          phone: `+94 77 ${100000 + i}`,
          email: `driver.${prefix.toLowerCase()}${i}@binmatrix.com`,
        });
      }
    });
    const createdDrivers = await Driver.insertMany(driversToInsert);
    console.log(`Seeded ${createdDrivers.length} drivers.`);

    // 4. Seed Vehicles (Matching Vehicle Monitoring1.png, 4.png, 11.png)
    console.log('Seeding Vehicles for Fleet Monitoring...');
    const specificVehicles = [
      {
        vehicleId: 'VI-123',
        truckNumber: 'VI-123',
        gpsDeviceId: 'FG-009',
        category: 'Organic Waste',
        driver: {
          driverId: 'DeGK-4576',
          name: 'G.Kamal',
          contactNumber: '+94 123 456 789',
        },
        routeCode: '2712-Owa-01',
        startTime: '8.00 am',
        status: 'Online',
        speedKmh: 45,
        ignitionStatus: 'On',
        currentLocation: 'Dehiwala-Mount Lavinia, Sri Lanka',
        latitude: 6.8421,
        longitude: 79.8642,
        totalDistanceKm: 10,
        fuelConsumption: 2.5,
        todaySummary: {
          totalDistanceKm: 10,
          activeTimeMinutes: 40,
          idleTimeMinutes: 10,
          offlineTimeMinutes: 20,
        },
        routeProgress: {
          completedBins: 8,
          pendingBins: 5,
          missedBins: 0,
          completionPercentage: 61.5,
          routeCoordinates: [
            { lat: 6.8851, lng: 80.0154, segmentStatus: 'Completed' }, // Dedigamuwa
            { lat: 6.9152, lng: 80.0214, segmentStatus: 'Completed' }, // Ranala
            { lat: 6.9110, lng: 80.0380, segmentStatus: 'In Progress' }, // river road
            { lat: 6.9050, lng: 80.0550, segmentStatus: 'Pending' },     // Embulgama
            { lat: 6.8925, lng: 80.0835, segmentStatus: 'Pending' },     // Hanwella Bus Stand
          ],
        },
      },
      {
        vehicleId: 'VI-321',
        truckNumber: 'VI-321',
        gpsDeviceId: 'FG-010',
        category: 'Plastic',
        driver: {
          driverId: 'DeSN-1022',
          name: 'S.Nimal',
          contactNumber: '+94 123 456 780',
        },
        routeCode: '2712-Pla-01',
        startTime: '8.00 am',
        status: 'Offline',
        speedKmh: 0,
        ignitionStatus: 'Off',
        currentLocation: 'Dehiwala',
        latitude: 6.8524,
        longitude: 79.8654,
        totalDistanceKm: 5,
        fuelConsumption: 1.5,
        todaySummary: {
          totalDistanceKm: 5,
          activeTimeMinutes: 15,
          idleTimeMinutes: 5,
          offlineTimeMinutes: 60,
        },
        routeProgress: {
          completedBins: 2,
          pendingBins: 10,
          missedBins: 1,
          completionPercentage: 15.0,
          routeCoordinates: [],
        },
      },
      {
        vehicleId: 'VI-456',
        truckNumber: 'VI-456',
        gpsDeviceId: 'FG-011',
        category: 'Paper',
        driver: {
          driverId: 'DeHA-2033',
          name: 'H.Amal',
          contactNumber: '+94 123 456 781',
        },
        routeCode: '2712-Pap-01',
        startTime: '9.00 am',
        status: 'Idle',
        speedKmh: 0,
        ignitionStatus: 'On',
        currentLocation: 'Mount Lavinia',
        latitude: 6.8372,
        longitude: 79.8631,
        totalDistanceKm: 8,
        fuelConsumption: 2.0,
        todaySummary: {
          totalDistanceKm: 8,
          activeTimeMinutes: 25,
          idleTimeMinutes: 45,
          offlineTimeMinutes: 10,
        },
        routeProgress: {
          completedBins: 4,
          pendingBins: 6,
          missedBins: 0,
          completionPercentage: 40.0,
          routeCoordinates: [],
        },
      },
      {
        vehicleId: 'VI-756',
        truckNumber: 'VI-756',
        gpsDeviceId: 'FG-012',
        category: 'Chatbot',
        driver: {
          driverId: 'DeDT-3044',
          name: 'D.Thinul',
          contactNumber: '+94 123 456 782',
        },
        routeCode: '2712-Chat-01',
        startTime: '8.30 am',
        status: 'Online',
        speedKmh: 40,
        ignitionStatus: 'On',
        currentLocation: 'Mount Lavinia',
        latitude: 6.8395,
        longitude: 79.8655,
        totalDistanceKm: 12,
        fuelConsumption: 2.8,
        todaySummary: {
          totalDistanceKm: 12,
          activeTimeMinutes: 50,
          idleTimeMinutes: 10,
          offlineTimeMinutes: 10,
        },
        routeProgress: {
          completedBins: 6,
          pendingBins: 4,
          missedBins: 0,
          completionPercentage: 60.0,
          routeCoordinates: [],
        },
      },
      {
        vehicleId: 'VI-568',
        truckNumber: 'VI-568',
        gpsDeviceId: 'FG-013',
        category: 'Organic Waste',
        driver: {
          driverId: 'DeJT-4055',
          name: 'J.Thulan',
          contactNumber: '+94 123 456 783',
        },
        routeCode: '2712-Owa-01',
        startTime: '8.00 am',
        status: 'Online',
        speedKmh: 45,
        ignitionStatus: 'On',
        currentLocation: 'Dehiwala',
        latitude: 6.8550,
        longitude: 79.8680,
        totalDistanceKm: 14,
        fuelConsumption: 3.2,
        todaySummary: {
          totalDistanceKm: 14,
          activeTimeMinutes: 60,
          idleTimeMinutes: 15,
          offlineTimeMinutes: 10,
        },
        routeProgress: {
          completedBins: 7,
          pendingBins: 5,
          missedBins: 0,
          completionPercentage: 58.3,
          routeCoordinates: [],
        },
      },
      {
        vehicleId: 'VI-156',
        truckNumber: 'VI-156',
        gpsDeviceId: 'FG-014',
        category: 'Organic Waste',
        driver: {
          driverId: 'DeDS-5066',
          name: 'D.Supun',
          contactNumber: '+94 123 456 784',
        },
        routeCode: '2712-Owa-01',
        startTime: '10.00 am',
        status: 'Offline',
        speedKmh: 0,
        ignitionStatus: 'Off',
        currentLocation: 'Dehiwala',
        latitude: 6.8480,
        longitude: 79.8640,
        totalDistanceKm: 3,
        fuelConsumption: 1.0,
        todaySummary: {
          totalDistanceKm: 3,
          activeTimeMinutes: 10,
          idleTimeMinutes: 5,
          offlineTimeMinutes: 75,
        },
        routeProgress: {
          completedBins: 1,
          pendingBins: 11,
          missedBins: 2,
          completionPercentage: 8.3,
          routeCoordinates: [],
        },
      },
      {
        vehicleId: 'VI-556',
        truckNumber: 'VI-556',
        gpsDeviceId: 'FG-015',
        category: 'Paper',
        driver: {
          driverId: 'DeKY-6077',
          name: 'K.Yaksh',
          contactNumber: '+94 123 456 785',
        },
        routeCode: '2712-Pap-01',
        startTime: '8.00 am',
        status: 'Online',
        speedKmh: 35,
        ignitionStatus: 'On',
        currentLocation: 'Galle Rd',
        latitude: 6.8440,
        longitude: 79.8650,
        totalDistanceKm: 11,
        fuelConsumption: 2.6,
        todaySummary: {
          totalDistanceKm: 11,
          activeTimeMinutes: 45,
          idleTimeMinutes: 15,
          offlineTimeMinutes: 10,
        },
        routeProgress: {
          completedBins: 5,
          pendingBins: 5,
          missedBins: 0,
          completionPercentage: 50.0,
          routeCoordinates: [],
        },
      },
      {
        vehicleId: 'VI-459',
        truckNumber: 'VI-459',
        gpsDeviceId: 'FG-016',
        category: 'Organic Waste',
        driver: {
          driverId: 'DeUV-7088',
          name: 'U.Vihanga',
          contactNumber: '+94 123 456 786',
        },
        routeCode: '2712-Owa-01',
        startTime: '8.40 am',
        status: 'Online',
        speedKmh: 20,
        ignitionStatus: 'On',
        currentLocation: 'Dehiwala',
        latitude: 6.8530,
        longitude: 79.8670,
        totalDistanceKm: 7,
        fuelConsumption: 1.8,
        todaySummary: {
          totalDistanceKm: 7,
          activeTimeMinutes: 30,
          idleTimeMinutes: 20,
          offlineTimeMinutes: 10,
        },
        routeProgress: {
          completedBins: 3,
          pendingBins: 7,
          missedBins: 0,
          completionPercentage: 30.0,
          routeCoordinates: [],
        },
      },
      {
        vehicleId: 'VI-470',
        truckNumber: 'VI-470',
        gpsDeviceId: 'FG-017',
        category: 'Chatbot',
        driver: {
          driverId: 'DeIH-8099',
          name: 'I.Hemal',
          contactNumber: '+94 123 456 787',
        },
        routeCode: '2712-Chat-01',
        startTime: '8.00 am',
        status: 'Idle',
        speedKmh: 0,
        ignitionStatus: 'On',
        currentLocation: 'Galle Rd',
        latitude: 6.8450,
        longitude: 79.8660,
        totalDistanceKm: 9,
        fuelConsumption: 2.1,
        todaySummary: {
          totalDistanceKm: 9,
          activeTimeMinutes: 35,
          idleTimeMinutes: 50,
          offlineTimeMinutes: 15,
        },
        routeProgress: {
          completedBins: 4,
          pendingBins: 6,
          missedBins: 0,
          completionPercentage: 40.0,
          routeCoordinates: [],
        },
      },
    ];

    const trucksToInsert = [...specificVehicles];
    const usedTruckNumbers = new Set(specificVehicles.map((v) => v.vehicleId));

    // Fill remaining trucks to support Home.png aggregations (123 trucks per category = 369 total)
    categories.forEach((cat) => {
      const prefix = cat.substring(0, 3).toUpperCase();
      const distancePerTruck = 900 / 123;
      const fuelPerTruck = 150 / 123;
      for (let i = 1; i <= 123; i++) {
        let truckNumber = `TRK-${prefix}-${String(i).padStart(3, '0')}`;
        if (!usedTruckNumbers.has(truckNumber)) {
          usedTruckNumbers.add(truckNumber);
          const status = i <= 120 ? 'Online' : 'Offline';
          const isIdle = i <= 10;
          trucksToInsert.push({
            vehicleId: truckNumber,
            truckNumber,
            category: cat,
            status: isIdle ? 'Idle' : status,
            isIdle,
            speedKmh: isIdle || status === 'Offline' ? 0 : 35 + (i % 20),
            ignitionStatus: status === 'Offline' ? 'Off' : 'On',
            currentLocation: 'Galle Rd, Dehiwala-Mount Lavinia',
            latitude: 6.8421 + (i * 0.0005),
            longitude: 79.8642 + (i * 0.0005),
            totalDistanceKm: parseFloat(distancePerTruck.toFixed(2)),
            fuelConsumption: parseFloat(fuelPerTruck.toFixed(2)),
            todaySummary: {
              totalDistanceKm: parseFloat(distancePerTruck.toFixed(2)),
              activeTimeMinutes: 40,
              idleTimeMinutes: 10,
              offlineTimeMinutes: 10,
            },
          });
        }
      }
    });

    const createdTrucks = await Truck.insertMany(trucksToInsert);
    console.log(`Seeded ${createdTrucks.length} total vehicles/trucks.`);

    // 5. Seed Routes
    console.log('Seeding Routes...');
    const routesToInsert = [
      {
        routeName: 'Route 01 - Galle Road Central',
        area: 'Galle Rd, Dehiwala-Mount Lavinia',
        category: 'Plastic',
        assignedTruck: createdTrucks[0]._id,
        assignedDriver: createdDrivers[0]._id,
        status: 'In Progress',
        bins: [createdBins[0]._id, createdBins[1]._id, createdBins[2]._id],
        waypoints: [
          { name: 'Hanwella Town', latitude: 6.8912, longitude: 80.0812, sequenceOrder: 1 },
          { name: 'Embulgama', latitude: 6.885, longitude: 80.054, sequenceOrder: 2 },
          { name: 'Artigala', latitude: 6.872, longitude: 80.038, sequenceOrder: 3 },
        ],
      },
      {
        routeName: 'Route 02 - Dehiwala Urban',
        area: 'Dehiwala',
        category: 'Paper',
        assignedTruck: createdTrucks[1]._id,
        assignedDriver: createdDrivers[100]._id,
        status: 'Pending',
        bins: [createdBins[41]._id, createdBins[42]._id],
        waypoints: [
          { name: 'Dehiwala Junction', latitude: 6.852, longitude: 79.865, sequenceOrder: 1 },
          { name: 'Mount Lavinia Hotel Rd', latitude: 6.837, longitude: 79.863, sequenceOrder: 2 },
        ],
      },
      {
        routeName: 'Route 03 - Organic Market Run',
        area: 'Mount Lavinia',
        category: 'Organic waste',
        assignedTruck: createdTrucks[2]._id,
        assignedDriver: createdDrivers[200]._id,
        status: 'Completed',
        bins: [createdBins[82]._id, createdBins[83]._id],
        waypoints: [
          { name: 'Nawagamuwa', latitude: 6.924, longitude: 80.005, sequenceOrder: 1 },
          { name: 'Ranala', latitude: 6.915, longitude: 80.021, sequenceOrder: 2 },
        ],
      },
    ];
    await Route.create(routesToInsert);
    console.log('Sample routes created.');

    // 6. Seed Monthly Report Metrics (Matching Detailed Reports.png)
    console.log('Seeding Monthly Report Metrics for Detailed Reports...');
    const reportMetricsData = [
      // Plastic (Direct figures from Detailed Reports.png)
      { category: 'Plastic', date: '14/10/2025', cleanedOnTime: 95, cleanedLate: 50, notCleaned: 45, fuelConsumptionLiters: 8.5, distanceTravelledKm: 192.92 },
      { category: 'Plastic', date: '24/10/2025', cleanedOnTime: 65, cleanedLate: 45, notCleaned: 55, fuelConsumptionLiters: 10.0, distanceTravelledKm: 120.50 },
      { category: 'Plastic', date: '01/11/2025', cleanedOnTime: 45, cleanedLate: 25, notCleaned: 20, fuelConsumptionLiters: 13.5, distanceTravelledKm: 95.00 },
      { category: 'Plastic', date: '05/11/2025', cleanedOnTime: 15, cleanedLate: 10, notCleaned: 5, fuelConsumptionLiters: 7.5, distanceTravelledKm: 80.00 },
      { category: 'Plastic', date: '08/11/2025', cleanedOnTime: 120, cleanedLate: 55, notCleaned: 50, fuelConsumptionLiters: 20.0, distanceTravelledKm: 140.00 },
      { category: 'Plastic', date: '11/11/2025', cleanedOnTime: 25, cleanedLate: 15, notCleaned: 15, fuelConsumptionLiters: 9.0, distanceTravelledKm: 190.00 },
      { category: 'Plastic', date: '14/11/2025', cleanedOnTime: 90, cleanedLate: 50, notCleaned: 45, fuelConsumptionLiters: 23.0, distanceTravelledKm: 210.00 },

      // Paper
      { category: 'Paper', date: '14/10/2025', cleanedOnTime: 85, cleanedLate: 40, notCleaned: 35, fuelConsumptionLiters: 7.5, distanceTravelledKm: 165.00 },
      { category: 'Paper', date: '24/10/2025', cleanedOnTime: 70, cleanedLate: 30, notCleaned: 25, fuelConsumptionLiters: 9.0, distanceTravelledKm: 140.00 },
      { category: 'Paper', date: '01/11/2025', cleanedOnTime: 50, cleanedLate: 20, notCleaned: 15, fuelConsumptionLiters: 11.5, distanceTravelledKm: 110.00 },
      { category: 'Paper', date: '05/11/2025', cleanedOnTime: 20, cleanedLate: 15, notCleaned: 8, fuelConsumptionLiters: 6.5, distanceTravelledKm: 75.00 },
      { category: 'Paper', date: '08/11/2025', cleanedOnTime: 110, cleanedLate: 45, notCleaned: 40, fuelConsumptionLiters: 18.0, distanceTravelledKm: 155.00 },
      { category: 'Paper', date: '11/11/2025', cleanedOnTime: 30, cleanedLate: 15, notCleaned: 10, fuelConsumptionLiters: 8.5, distanceTravelledKm: 175.00 },
      { category: 'Paper', date: '14/11/2025', cleanedOnTime: 85, cleanedLate: 45, notCleaned: 35, fuelConsumptionLiters: 21.0, distanceTravelledKm: 195.00 },

      // Organic waste
      { category: 'Organic waste', date: '14/10/2025', cleanedOnTime: 100, cleanedLate: 55, notCleaned: 40, fuelConsumptionLiters: 9.5, distanceTravelledKm: 180.00 },
      { category: 'Organic waste', date: '24/10/2025', cleanedOnTime: 75, cleanedLate: 35, notCleaned: 30, fuelConsumptionLiters: 11.0, distanceTravelledKm: 135.00 },
      { category: 'Organic waste', date: '01/11/2025', cleanedOnTime: 60, cleanedLate: 30, notCleaned: 25, fuelConsumptionLiters: 14.5, distanceTravelledKm: 105.00 },
      { category: 'Organic waste', date: '05/11/2025', cleanedOnTime: 25, cleanedLate: 15, notCleaned: 10, fuelConsumptionLiters: 8.0, distanceTravelledKm: 90.00 },
      { category: 'Organic waste', date: '08/11/2025', cleanedOnTime: 130, cleanedLate: 60, notCleaned: 45, fuelConsumptionLiters: 22.0, distanceTravelledKm: 160.00 },
      { category: 'Organic waste', date: '11/11/2025', cleanedOnTime: 35, cleanedLate: 20, notCleaned: 15, fuelConsumptionLiters: 10.0, distanceTravelledKm: 185.00 },
      { category: 'Organic waste', date: '14/11/2025', cleanedOnTime: 95, cleanedLate: 55, notCleaned: 40, fuelConsumptionLiters: 24.5, distanceTravelledKm: 220.00 },
    ];
    await ReportMetric.insertMany(reportMetricsData);
    console.log(`Seeded ${reportMetricsData.length} monthly report metric records.`);

    // 7. Seed Vehicle History Logs (Matching Vehicle Monitoring5.png & 10.png)
    console.log('Seeding Vehicle History Logs for VI-123...');
    const standardDailyLogs = [
      { timePeriod: '08:00–08:30', status: 'Online', speedKmh: 50, countedAs: 'Running Time (30 min)' },
      { timePeriod: '08:30–08:40', status: 'Idle', speedKmh: 0, countedAs: 'Idle Time (10 min)' },
      { timePeriod: '08:40–09:15', status: 'Online', speedKmh: 10, countedAs: 'Running Time (35 min)' },
      { timePeriod: '09:15–09:30', status: 'Offline', speedKmh: 0, countedAs: 'Offline Time (30 min)' },
      { timePeriod: '09:30–10:30', status: 'Online', speedKmh: 20, countedAs: 'Running Time (1 hour)' },
      { timePeriod: '10:30–10:40', status: 'Idle', speedKmh: 0, countedAs: 'Idle Time (10 min)' },
      { timePeriod: '10:40–11:30', status: 'Online', speedKmh: 50, countedAs: 'Running Time (50 min)' },
    ];

    const vehicleHistories = [
      // 1. Date: 2025-12-19 (Matching Vehicle Monitoring10.png)
      {
        vehicleId: 'VI-123',
        date: '2025-12-19',
        wasteType: 'Organic Waste',
        logs: standardDailyLogs,
        dailyTotals: {
          distanceKm: 20,
          fuelLiters: 5.2,
          activeTime: '42 min',
          idleTime: '10 min',
          offlineTime: '20 min',
        },
      },
      // Note: 2025-12-20 is intentionally OMITTED to test the empty gap ("No vehicle history available for the selected date.")
      // 2. Date: 2025-12-21 (Matching Vehicle Monitoring10.png)
      {
        vehicleId: 'VI-123',
        date: '2025-12-21',
        wasteType: 'Organic Waste',
        logs: [
          { timePeriod: '08:00–08:30', status: 'Online', speedKmh: 50, countedAs: 'Running Time (30 min)' },
          { timePeriod: '08:30–08:40', status: 'Idle', speedKmh: 0, countedAs: 'Idle Time (10 min)' },
          { timePeriod: '08:40–09:15', status: 'Online', speedKmh: 10, countedAs: 'Running Time (35 min)' },
        ],
        dailyTotals: {
          distanceKm: 15,
          fuelLiters: 4.1,
          activeTime: '35 min',
          idleTime: '10 min',
          offlineTime: '15 min',
        },
      },
      // 3. Date: 2025-12-27 (Matching Vehicle Monitoring4.png & 5.png)
      {
        vehicleId: 'VI-123',
        date: '2025-12-27',
        wasteType: 'Organic Waste',
        logs: standardDailyLogs,
        dailyTotals: {
          distanceKm: 20,
          fuelLiters: 5.2,
          activeTime: '42 min',
          idleTime: '10 min',
          offlineTime: '20 min',
        },
      },
    ];

    await VehicleHistory.insertMany(vehicleHistories);
    console.log(`Seeded ${vehicleHistories.length} VehicleHistory records for VI-123 (with gap on 2025-12-20).`);

    console.log('--------------------------------------------------');
    console.log('SUCCESS: All data (including Vehicle Monitoring) seeded!');
    console.log('Default Admin Account: admin / admin123');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error(`Error during data seeding: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    console.log('Destroying all data...');
    await Promise.all([
      User.deleteMany(),
      Bin.deleteMany(),
      Driver.deleteMany(),
      Truck.deleteMany(),
      Route.deleteMany(),
      ReportMetric.deleteMany(),
      VehicleHistory.deleteMany(),
    ]);
    console.log('All data destroyed.');
    process.exit(0);
  } catch (error) {
    console.error(`Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
