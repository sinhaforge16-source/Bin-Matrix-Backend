const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Load models
const User = require('./models/User');
const Bin = require('./models/Bin');
const Driver = require('./models/Driver');
const Truck = require('./models/Truck');
const Route = require('./models/Route');
const ReportMetric = require('./models/ReportMetric');
const VehicleHistory = require('./models/VehicleHistory');
const ChatMessage = require('./models/ChatMessage');
const Notification = require('./models/Notification');
const RoutePlan = require('./models/RoutePlan');
const AppUser = require('./models/AppUser');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in .env');
    }
    const conn = await mongoose.connect(uri);
    console.log(`Connected to MongoDB: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const seedLightData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany(),
      Bin.deleteMany(),
      Driver.deleteMany(),
      Truck.deleteMany(),
      Route.deleteMany(),
      ReportMetric.deleteMany(),
      VehicleHistory.deleteMany(),
      ChatMessage.deleteMany(),
      Notification.deleteMany(),
      RoutePlan.deleteMany(),
      AppUser.deleteMany(),
    ]);

    // 1. Users (2 records)
    console.log('Seeding 2 Users...');
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
    ]);

    // 2. Bins (3 records)
    console.log('Seeding 3 Bins...');
    const bins = await Bin.create([
      {
        binId: 'Han-1012-Kl',
        category: 'Plastic',
        status: 'Online',
        fillLevel: 94,
        batteryLevel: 90,
        capacityStatus: 'Overflowing',
        isPriority: true,
        location: 'Hanwella Town',
        latitude: 6.8912,
        longitude: 80.0812,
      },
      {
        binId: 'Deh-2213-Ai',
        category: 'Paper',
        status: 'Online',
        fillLevel: 80,
        batteryLevel: 85,
        capacityStatus: 'Almost Full',
        isPriority: true,
        location: 'Galle Rd',
        latitude: 6.8421,
        longitude: 79.8642,
      },
      {
        binId: 'Ded-4015-Qr',
        category: 'Organic waste',
        status: 'Online',
        fillLevel: 55,
        batteryLevel: 88,
        capacityStatus: 'Normal',
        isPriority: false,
        location: 'Dedigamuwa',
        latitude: 6.8851,
        longitude: 80.0154,
      },
    ]);

    // 3. Drivers (3 records)
    console.log('Seeding 3 Drivers...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('driver123', salt);
    const drivers = await Driver.create([
      {
        driverId: 'DRI-101',
        name: 'G.Kamal',
        driverName: 'G.Kamal',
        category: 'Organic Waste',
        mobileNumber: '+94 123 456 789',
        email: 'kamal@binmatrix.com',
        password: hashedPassword,
        isPresentToday: true,
        isAllocated: true,
      },
      {
        driverId: 'DRI-102',
        name: 'N.Sunil',
        driverName: 'N.Sunil',
        category: 'Plastic',
        mobileNumber: '+94 123 456 790',
        email: 'sunil@binmatrix.com',
        password: hashedPassword,
        isPresentToday: true,
        isAllocated: true,
      },
      {
        driverId: 'DRI-103',
        name: 'P.Silva',
        driverName: 'P.Silva',
        category: 'Paper',
        mobileNumber: '+94 123 456 791',
        email: 'silva@binmatrix.com',
        password: hashedPassword,
        isPresentToday: true,
        isAllocated: false,
      },
    ]);

    // 4. Trucks / Vehicles (3 records)
    console.log('Seeding 3 Trucks/Vehicles...');
    const trucks = await Truck.create([
      {
        truckNumber: 'WP-VI-123',
        vehicleId: 'VI-123',
        category: 'Plastic',
        status: 'Online',
        isIdle: false,
        speedKmh: 28,
        ignitionStatus: 'On',
        currentLocation: 'Galle Rd, Sri Lanka',
        latitude: 6.8421,
        longitude: 79.8642,
        routeCode: '2712-Pla-01',
        startTime: '8.00 am',
        driver: {
          driverId: 'DRI-102',
          name: 'N.Sunil',
          contactNumber: '+94 123 456 790',
        },
        todaySummary: {
          totalDistanceKm: 18.2,
          activeTimeMinutes: 270,
          idleTimeMinutes: 45,
          offlineTimeMinutes: 0,
        },
        routeProgress: {
          completedBins: 2,
          pendingBins: 1,
          missedBins: 0,
          completionPercentage: 66,
        },
      },
      {
        truckNumber: 'WP-VI-321',
        vehicleId: 'VI-321',
        category: 'Paper',
        status: 'Idle',
        isIdle: true,
        speedKmh: 0,
        ignitionStatus: 'Off',
        currentLocation: 'Dehiwala',
        latitude: 6.8524,
        longitude: 79.8654,
        routeCode: '2712-Pap-01',
        startTime: 'Not Started',
        driver: {
          driverId: 'DRI-103',
          name: 'P.Silva',
          contactNumber: '+94 123 456 791',
        },
        todaySummary: {
          totalDistanceKm: 0,
          activeTimeMinutes: 0,
          idleTimeMinutes: 120,
          offlineTimeMinutes: 0,
        },
        routeProgress: {
          completedBins: 0,
          pendingBins: 3,
          missedBins: 0,
          completionPercentage: 0,
        },
      },
      {
        truckNumber: 'WP-VI-456',
        vehicleId: 'VI-456',
        category: 'Organic Waste',
        status: 'Online',
        isIdle: false,
        speedKmh: 32,
        ignitionStatus: 'On',
        currentLocation: 'Hanwella',
        latitude: 6.8912,
        longitude: 80.0812,
        routeCode: '2712-Owa-01',
        startTime: '7.30 am',
        driver: {
          driverId: 'DRI-101',
          name: 'G.Kamal',
          contactNumber: '+94 123 456 789',
        },
        todaySummary: {
          totalDistanceKm: 22.4,
          activeTimeMinutes: 310,
          idleTimeMinutes: 35,
          offlineTimeMinutes: 0,
        },
        routeProgress: {
          completedBins: 3,
          pendingBins: 0,
          missedBins: 0,
          completionPercentage: 100,
        },
      },
    ]);

    // 5. Routes (2 records)
    console.log('Seeding 2 Routes...');
    await Route.create([
      {
        routeName: '2712-Owa-01',
        category: 'Organic waste',
        area: 'Hanwella - Dedigamuwa',
        assignedTruck: trucks[2]._id,
        assignedDriver: drivers[0]._id,
        bins: [bins[2]._id],
        status: 'In Progress',
        totalDistance: 22.4,
      },
      {
        routeName: '2712-Pla-01',
        category: 'Plastic',
        area: 'Galle Rd - Dehiwala',
        assignedTruck: trucks[0]._id,
        assignedDriver: drivers[1]._id,
        bins: [bins[0]._id],
        status: 'In Progress',
        totalDistance: 18.2,
      },
    ]);

    // 6. Report Metrics (3 records)
    console.log('Seeding 3 Report Metrics...');
    await ReportMetric.create([
      {
        category: 'Plastic',
        date: '14/11/2025',
        cleanedOnTime: 65,
        cleanedLate: 20,
        notCleaned: 15,
        fuelConsumptionLiters: 140,
        distanceTravelledKm: 185,
      },
      {
        category: 'Paper',
        date: '14/11/2025',
        cleanedOnTime: 70,
        cleanedLate: 18,
        notCleaned: 12,
        fuelConsumptionLiters: 120,
        distanceTravelledKm: 160,
      },
      {
        category: 'Organic waste',
        date: '14/11/2025',
        cleanedOnTime: 63,
        cleanedLate: 21,
        notCleaned: 16,
        fuelConsumptionLiters: 150,
        distanceTravelledKm: 192,
      },
    ]);

    // 7. Vehicle History (2 records)
    console.log('Seeding 2 Vehicle History records...');
    await VehicleHistory.create([
      {
        vehicleId: 'VI-123',
        date: '2025-12-27',
        wasteType: 'Plastic',
        driverName: 'N.Sunil',
        routeCode: '2712-Pla-01',
        dailyTotals: {
          distanceKm: 18.2,
          activeHours: 4.5,
          idleHours: 0.8,
          fuelConsumedLiters: 14.5,
        },
        logs: [
          {
            timePeriod: '08:00–08:30',
            status: 'Online',
            speedKmh: 28,
            countedAs: 'Running Time (30 min)',
          },
          {
            timePeriod: '08:30–09:00',
            status: 'Idle',
            speedKmh: 0,
            countedAs: 'Idle Time (30 min)',
          },
        ],
      },
      {
        vehicleId: 'VI-456',
        date: '2025-12-27',
        wasteType: 'Organic Waste',
        driverName: 'G.Kamal',
        routeCode: '2712-Owa-01',
        dailyTotals: {
          distanceKm: 22.4,
          activeHours: 5.1,
          idleHours: 0.6,
          fuelConsumedLiters: 16.0,
        },
        logs: [
          {
            timePeriod: '07:30–08:00',
            status: 'Online',
            speedKmh: 32,
            countedAs: 'Running Time (30 min)',
          },
        ],
      },
    ]);

    // 8. Chat Messages (3 records)
    console.log('Seeding 3 Chat Messages...');
    await ChatMessage.create([
      {
        userId: 'inosuke_hashibira',
        senderName: 'Hashibara Inosuke',
        senderAvatar: '/avatars/inosuke.png',
        senderRole: 'user',
        messageText: 'Garbage pile reported near Galle Rd',
        mapLocationPin: {
          lat: 6.8421,
          lng: 79.8642,
          address: 'Galle Rd, Dehiwala-Mount Lavinia',
          url: 'https://maps.google.com/?q=6.8421,79.8642',
        },
        timeString: '8.00 am',
        status: 'delivered',
        isOnline: true,
      },
      {
        userId: 'inosuke_hashibira',
        senderName: 'Bot',
        senderAvatar: '/avatars/bot.png',
        senderRole: 'bot',
        messageText: 'Sir, please send your current location',
        timeString: '8.01 am',
        status: 'read',
        isOnline: false,
      },
      {
        userId: 'nezuko_kamado',
        senderName: 'Nezuko kamado',
        senderAvatar: '/avatars/nezuko.png',
        senderRole: 'user',
        messageText: 'https://maps.google.com/?q=6.8524,79.8654',
        mapLocationPin: {
          lat: 6.8524,
          lng: 79.8654,
          address: 'Galle Rd, Dehiwala Junction',
          url: 'https://maps.google.com/?q=6.8524,79.8654',
        },
        timeString: '8.02 am',
        status: 'read',
        isOnline: false,
      },
    ]);

    // 9. Notifications (3 records)
    console.log('Seeding 3 Notifications...');
    await Notification.create([
      {
        category: 'Routes',
        message: "Truck TR-102 has completed today's route.",
        timeAgo: '10 min ago',
        actionType: 'Truck',
        targetId: 'TR-102',
        actionLabel: 'View Truck',
        isRead: false,
      },
      {
        category: 'Trucks',
        message: 'Truck TR-205 has been offline for 4 days.',
        timeAgo: '2 hours ago',
        actionType: 'Truck',
        targetId: 'TR-205',
        actionLabel: 'View Truck',
        isRead: false,
      },
      {
        category: 'Bins',
        message: 'Bin B-045 has exceeded 90% fill level.',
        timeAgo: '30 minutes ago',
        actionType: 'Bin',
        targetId: 'B-045',
        actionLabel: 'View Bin',
        isRead: false,
      },
    ]);

    // 10. Route Plans (2 records)
    console.log('Seeding 2 Route Plans...');
    await RoutePlan.create([
      {
        category: 'Organic Waste',
        routeName: '2712-Ewa-01',
        isOptimized: true,
        isConfirmed: false,
        steps: [
          {
            stepNumber: 1,
            stepLabel: '01',
            status: 'Active',
            description: 'Dedigamuwa to Ranala Junction Road',
            coordinates: [{ lat: 6.8851, lng: 80.0154, stopName: 'Dedigamuwa Stop A' }],
          },
          {
            stepNumber: 2,
            stepLabel: '02',
            status: 'Pending',
            description: 'Ranala Main Collection Hub',
            coordinates: [{ lat: 6.9152, lng: 80.0214, stopName: 'Ranala Central' }],
          },
          {
            stepNumber: 3,
            stepLabel: '03',
            status: 'Pending',
            description: 'Embulgama River Bank Waypoint',
            coordinates: [{ lat: 6.8853, lng: 80.0542, stopName: 'Embulgama Central' }],
          },
          {
            stepNumber: 4,
            stepLabel: '04',
            status: 'Pending',
            description: 'Jalthara Crossway to Artigala',
            coordinates: [{ lat: 6.8784, lng: 80.0451, stopName: 'Jalthara Crossing' }],
          },
          {
            stepNumber: 5,
            stepLabel: '05',
            status: 'Pending',
            description: 'Hanwella Town & Bus Stand Terminal',
            coordinates: [{ lat: 6.8912, lng: 80.0812, stopName: 'Hanwella Town Center' }],
          },
        ],
      },
      {
        category: 'Plastic',
        routeName: '2712-Pla-01',
        isOptimized: true,
        isConfirmed: false,
        steps: [
          {
            stepNumber: 1,
            stepLabel: '01',
            status: 'Active',
            description: 'Dehiwala Marine Drive Collection Point',
            coordinates: [{ lat: 6.8524, lng: 79.8654, stopName: 'Dehiwala Beach Rd' }],
          },
          {
            stepNumber: 2,
            stepLabel: '02',
            status: 'Pending',
            description: 'Galle Road Commercial Strip',
            coordinates: [{ lat: 6.8421, lng: 79.8642, stopName: 'Galle Rd Stop 1' }],
          },
        ],
      },
    ]);

    // 11. App Users (3 records)
    console.log('Seeding 3 App Users...');
    await AppUser.create([
      {
        userId: 'VI-123',
        email: 's@gmail.com',
        assignedBinId: 'Han-1012-Kl',
        category: 'Organic Waste',
        status: 'Online',
        lastUpdated: '2 min ago',
        percentage: 100,
        location: 'Galle Rd',
      },
      {
        userId: 'VI-321',
        email: 's@gmail.com',
        assignedBinId: 'Deh-2213-Ai',
        category: 'Organic Waste',
        status: 'Offline',
        lastUpdated: '2 min ago',
        percentage: 20,
        location: 'Galle Rd',
      },
      {
        userId: 'VI-456',
        email: 's@gmail.com',
        assignedBinId: 'Ded-4015-Qr',
        category: 'Plastic',
        status: 'Online',
        lastUpdated: '5 min ago',
        percentage: 50,
        location: 'Dehiwala',
      },
    ]);

    console.log('--------------------------------------------------');
    console.log('SUCCESS: Lightweight dataset (2-3 items per collection) seeded!');
    console.log('Collections created in MongoDB Atlas:');
    console.log('- users (2)');
    console.log('- bins (3)');
    console.log('- drivers (3)');
    console.log('- trucks (3)');
    console.log('- routes (2)');
    console.log('- reportmetrics (3)');
    console.log('- vehiclehistories (2)');
    console.log('- chatmessages (3)');
    console.log('- notifications (3)');
    console.log('- routeplans (2)');
    console.log('- appusers (3)');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error(`Error during lightweight seeding: ${error.message}`);
    process.exit(1);
  }
};

seedLightData();
