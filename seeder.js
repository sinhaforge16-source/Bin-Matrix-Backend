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
    // We populate realistic bins with IDs matching the design format (e.g., Deh-2213-Ai, Deh-2233-Gn, Han-1012-Kl)
    // Distributed across coordinates around Hanwella, Nawagamuwa, Dedigamuwa, Artigala, and Dehiwala-Mount Lavinia.
    // Total: 123 Bins (120 Online, 3 Offline, 10 Low Battery) matching Home.png
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

    // Insert specific design bins first
    specificDesignBins.forEach((b, idx) => {
      usedBinIds.add(b.binId);
      binsToInsert.push({
        binId: b.binId,
        category: b.category,
        status: b.status,
        fillLevel: b.fillLevel,
        batteryLevel: idx < 3 ? 15 : 90, // Include some low battery
        capacityStatus: b.capacityStatus,
        isPriority: b.isPriority,
        location: b.location,
        latitude: b.lat,
        longitude: b.lng,
        lastUpdated: new Date(Date.now() - idx * 600000),
      });
    });

    // Populate remaining bins up to 123 total (41 Plastic, 41 Paper, 41 Organic waste)
    // to strictly preserve the Home.png Dashboard summary figures (120 Online, 3 Offline, 10 Low Battery)
    const categories = ['Plastic', 'Paper', 'Organic waste'];
    const targetCounts = { Plastic: 41, Paper: 41, 'Organic waste': 41 };
    const currentCounts = { Plastic: 0, Paper: 0, 'Organic waste': 0 };

    binsToInsert.forEach((b) => {
      currentCounts[b.category]++;
    });

    let offlineAssigned = binsToInsert.filter((b) => b.status === 'Offline').length; // currently 4 from table
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
        
        // Match average fill target per category from Home.png (Plastic: 15, Paper: 8, Organic: 30)
        let fillLevel = cat === 'Plastic' ? 15 : cat === 'Paper' ? 8 : 30;
        let capacityStatus = 'Normal';
        if (fillLevel >= 90) capacityStatus = 'Overflowing';
        else if (fillLevel >= 75) capacityStatus = 'Almost Full';

        let batteryLevel = 85 + (i % 15);
        if (lowBatteryAssigned < 10 && i % 4 === 0) {
          batteryLevel = 14;
          lowBatteryAssigned++;
        }

        // We already have 4 offline bins from specific design table, keeping offline count ~3-4
        let status = 'Online';

        binsToInsert.push({
          binId,
          category: cat,
          status,
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
        const isPresentToday = i <= 94; // 94 present, 6 absent
        const isAllocated = i <= 90;    // 90 allocated, 4 unallocated present
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

    // 4. Seed Trucks (123 per category = 369 total)
    console.log('Seeding Trucks (123 per category = 369 total)...');
    const trucksToInsert = [];
    categories.forEach((cat) => {
      const prefix = cat.substring(0, 3).toUpperCase();
      const distancePerTruck = 900 / 123;
      const fuelPerTruck = 150 / 123;
      for (let i = 1; i <= 123; i++) {
        const status = i <= 120 ? 'Online' : 'Offline';
        const isIdle = i <= 10;
        trucksToInsert.push({
          truckNumber: `TRK-${prefix}-${String(i).padStart(3, '0')}`,
          category: cat,
          status,
          isIdle,
          totalDistanceKm: parseFloat(distancePerTruck.toFixed(2)),
          fuelConsumption: parseFloat(fuelPerTruck.toFixed(2)),
        });
      }
    });
    const createdTrucks = await Truck.insertMany(trucksToInsert);
    console.log(`Seeded ${createdTrucks.length} trucks.`);

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
        assignedTruck: createdTrucks[123]._id,
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
        assignedTruck: createdTrucks[246]._id,
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

    console.log('--------------------------------------------------');
    console.log('SUCCESS: All dummy & monitoring data seeded!');
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
