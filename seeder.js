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

// Connect to DB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/binmatrix'
    );
    console.log(`MongoDB Connected for seeding: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const locations = [
  'Galle Rd, Dehiwala-Mount Lavinia',
  'Galle Rd, Colombo 03',
  'High Level Rd, Nugegoda',
  'Baseline Rd, Dematagoda',
  'Kandy Rd, Kelaniya',
  'Hanwella Town, Hanwella',
  'Pahala Hanwella, Artigala',
  'Dedigamuwa, Ranala',
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
    ]);

    console.log('Seeding Users...');
    // 1. Create Default Admin User & Sample Users
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
    // Exact Dashboard Metrics:
    // Total: 123 (Online: 120, Offline: 3)
    // Low Battery: 10 (batteryLevel <= 20)
    // Average Fill: Plastic: 15%, Paper: 8%, Organic waste: 30%
    console.log('Seeding Bins (123 total to match 120 Online / 3 Offline)...');
    const categories = ['Plastic', 'Paper', 'Organic waste'];
    const fillTargets = {
      Plastic: 15,
      Paper: 8,
      'Organic waste': 30,
    };

    const binsToInsert = [];
    let lowBatteryAssigned = 0;
    let offlineAssigned = 0;

    categories.forEach((cat) => {
      // 41 bins per category => 41 * 3 = 123 bins total
      const count = 41;
      const targetAvg = fillTargets[cat];

      for (let i = 1; i <= count; i++) {
        const binId = `${cat.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`;
        
        // 3 offline bins total across all categories
        let status = 'Online';
        if (offlineAssigned < 3 && i === 1) {
          status = 'Offline';
          offlineAssigned++;
        }

        // 10 low battery bins total
        let batteryLevel = 85 + (i % 15);
        if (lowBatteryAssigned < 10 && i % 4 === 0) {
          batteryLevel = 12 + (lowBatteryAssigned % 8); // <= 20
          lowBatteryAssigned++;
        }

        // Exact target average fill level
        const fillLevel = targetAvg;

        const loc = locations[i % locations.length];

        binsToInsert.push({
          binId,
          category: cat,
          status,
          fillLevel,
          batteryLevel,
          location: loc,
          latitude: 6.84 + (i * 0.002),
          longitude: 79.86 + (i * 0.002),
          lastUpdated: new Date(Date.now() - i * 600000),
        });
      }
    });

    const createdBins = await Bin.insertMany(binsToInsert);
    console.log(`Seeded ${createdBins.length} bins.`);

    // 3. Seed Drivers
    // For each category (Plastic, Paper, Organic waste):
    // Total: 100
    // Today's Present: 94
    // Allocated: 90
    // Unallocated Present: 4 (94 - 90 = 4)
    // Absent: 6 (100 - 94 = 6)
    console.log('Seeding Drivers (100 per category = 300 total)...');
    const driversToInsert = [];

    categories.forEach((cat) => {
      const prefix = cat.substring(0, 3).toUpperCase();
      for (let i = 1; i <= 100; i++) {
        const isPresentToday = i <= 94; // 94 present, 6 absent
        const isAllocated = i <= 90;    // 90 allocated, 4 unallocated present (91-94)

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

    // 4. Seed Trucks
    // For each category (Plastic, Paper, Organic waste):
    // Online / Offline: 120 / 3 (Total: 123)
    // Idle Truck: 10
    // Total Distance: 900 Km (Sum across category = 900)
    // Fuel Consumption: 150 (Sum across category = 150)
    console.log('Seeding Trucks (123 per category = 369 total)...');
    const trucksToInsert = [];

    categories.forEach((cat) => {
      const prefix = cat.substring(0, 3).toUpperCase();
      const distancePerTruck = 900 / 123;
      const fuelPerTruck = 150 / 123;

      for (let i = 1; i <= 123; i++) {
        const status = i <= 120 ? 'Online' : 'Offline';
        const isIdle = i <= 10; // 10 idle trucks

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

    // 5. Seed Sample Routes
    console.log('Seeding Sample Routes...');
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
    console.log('Sample routes created successfully.');

    console.log('-------------------------------------------');
    console.log('SUCCESS: All dummy data seeded successfully!');
    console.log('Credentials: admin / admin123');
    console.log('-------------------------------------------');

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
    ]);

    console.log('All data destroyed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

// Check CLI arguments
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}

