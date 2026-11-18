# Bin Matrix - Waste Management System Backend

Production-ready Node.js, Express, and MongoDB (MERN) backend for the **Bin Matrix** Waste Management System, designed to interface seamlessly with the Web and Mobile dashboards.

---

## 🚀 Features

- **MVC Architecture**: Clean separation of Models, Views/Routes, and Controllers.
- **JWT Authentication & RBAC**: Secure token-based authentication (`/api/auth`) with bcrypt password hashing and role-based route protection.
- **Live Aggregation Dashboard (`/api/dashboard/summary`)**:
  - Aggregates overall bin statistics (online/offline counts, low battery count, and category fill levels).
  - Categorical breakdowns (`Plastic`, `Paper`, `Organic waste`) for Driver Status (Total, Today's Present, Allocated, Unallocated Present) and Truck Status (Online/Offline, Idle Truck, Total Distance, Fuel Consumption) matching the Figma `Home.png` UI.
- **Full CRUD Endpoints**: RESTful APIs with filtering, searching, sorting, and pagination for:
  - Bins (`/api/bins`)
  - Drivers (`/api/drivers`)
  - Trucks (`/api/trucks`)
  - Routes (`/api/routes`)
  - Users (`/api/users`)
- **Robust Error Handling**: Centralized error middleware handling Mongoose validation errors, duplicate keys, and invalid ObjectIds.
- **Automated Seeding Script**: Pre-configured `seeder.js` populating exact metrics matching the dashboard designs.

---

## 📁 Directory Structure

```text
Bin-Matrix-Backend/
├── config/
│   └── db.js                 # MongoDB connection logic
├── controllers/
│   ├── authController.js      # Auth logic (register, login, getMe)
│   ├── binController.js       # Bins CRUD & filtering
│   ├── dashboardController.js # Aggregations for Home.png dashboard
│   ├── driverController.js    # Drivers CRUD & category filtering
│   ├── routeController.js     # Routes management & assignments
│   ├── truckController.js     # Trucks fleet management
│   └── userController.js      # Users management
├── middleware/
│   ├── authMiddleware.js      # JWT verification & role authorization
│   └── errorMiddleware.js     # 404 & centralized error handler
├── models/
│   ├── Bin.js                 # Bin schema (binId, category, status, fillLevel, batteryLevel, location)
│   ├── Driver.js              # Driver schema (name, driverId, category, isPresentToday, isAllocated)
│   ├── Route.js               # Route schema (routeName, area, assignedTruck, assignedDriver, status)
│   ├── Truck.js               # Truck schema (truckNumber, category, status, isIdle, totalDistanceKm, fuelConsumption)
│   └── User.js                # User schema (username, password, role, email)
├── routes/
│   ├── authRoutes.js          # /api/auth
│   ├── binRoutes.js           # /api/bins
│   ├── dashboardRoutes.js     # /api/dashboard
│   ├── driverRoutes.js        # /api/drivers
│   ├── routeRoutes.js         # /api/routes
│   ├── truckRoutes.js         # /api/trucks
│   └── userRoutes.js          # /api/users
├── .env                       # Environment variables
├── .env.example               # Example environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Node.js dependencies & scripts
├── seeder.js                  # Database seeder script
├── server.js                  # Express application entry point
└── README.md                  # Documentation
```

---

## ⚙️ Prerequisites & Setup

1. **Prerequisites**:
   - [Node.js](https://nodejs.org/) (v16+)
   - [MongoDB](https://www.mongodb.com/) running locally on port 27017 or a MongoDB Atlas URI.

2. **Environment Variables**:
   Copy `.env.example` to `.env` or edit `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/binmatrix
   JWT_SECRET=supersecretkey
   NODE_ENV=development
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Seed Database**:
   Populate initial admin user and sample data matching the Figma dashboard numbers:
   ```bash
   npm run seed
   ```
   To reset/clear all data:
   ```bash
   npm run seed:destroy
   ```

5. **Start the Server**:
   - Development mode with live reload:
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

---

## 🔑 Default Credentials

- **Admin Account**:
  - Username: `admin`
  - Password: `admin123`
  - Role: `admin`

---

## 📡 API Reference

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login and receive JWT token | Public |
| `GET` | `/api/auth/me` | Get current logged-in user profile | Protected (JWT) |

### 2. Dashboard Summary (`/api/dashboard`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | Aggregated metrics for `Home.png` | Public / Protected |

#### Sample Dashboard Response:
```json
{
  "success": true,
  "data": {
    "location": "Galle Rd, Dehiwala-Mount Lavinia",
    "binStatus": {
      "online": 120,
      "offline": 3,
      "total": 123,
      "ratio": "120/3",
      "lowBattery": 10,
      "fillLevel": {
        "Plastic": 15,
        "Paper": 8,
        "Organic waste": 30
      }
    },
    "categories": {
      "Plastic": {
        "driverStatus": {
          "totalDrivers": 100,
          "todaysPresent": 94,
          "allocatedDrivers": 90,
          "unallocatedPresent": 4
        },
        "truckStatus": {
          "online": 120,
          "offline": 3,
          "totalTrucks": 123,
          "idleTruck": 10,
          "totalDistanceKm": 900,
          "fuelConsumption": 150
        }
      },
      "Paper": {
        "driverStatus": { ... },
        "truckStatus": { ... }
      },
      "Organic waste": {
        "driverStatus": { ... },
        "truckStatus": { ... }
      }
    }
  }
}
```

### 3. Bins (`/api/bins`)
- Query parameters: `?category=Plastic&status=Online&search=Galle&page=1&limit=20`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/bins` | List bins with filtering & pagination | Public |
| `GET` | `/api/bins/:id` | Get bin by MongoDB _id or `binId` | Public |
| `POST` | `/api/bins` | Create a new bin | Public/Protected |
| `PUT` | `/api/bins/:id` | Update bin by _id or `binId` | Public/Protected |
| `DELETE` | `/api/bins/:id` | Delete bin by _id or `binId` | Public/Protected |

### 4. Drivers (`/api/drivers`)
- Query parameters: `?category=Paper&isPresentToday=true&isAllocated=false`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/drivers` | List drivers with filtering | Public |
| `GET` | `/api/drivers/:id` | Get driver by _id or `driverId` | Public |
| `POST` | `/api/drivers` | Create driver | Public/Protected |
| `PUT` | `/api/drivers/:id` | Update driver | Public/Protected |
| `DELETE` | `/api/drivers/:id` | Delete driver | Public/Protected |

### 5. Trucks (`/api/trucks`)
- Query parameters: `?category=Plastic&status=Online&isIdle=false`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/trucks` | List trucks with populated driver & route | Public |
| `GET` | `/api/trucks/:id` | Get truck by _id or `truckNumber` | Public |
| `POST` | `/api/trucks` | Create truck | Public/Protected |
| `PUT` | `/api/trucks/:id` | Update truck | Public/Protected |
| `DELETE` | `/api/trucks/:id` | Delete truck | Public/Protected |

### 6. Routes (`/api/routes`)
- Query parameters: `?category=Plastic&status=In%20Progress&area=Galle`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/routes` | List routes with populated truck, driver, and bins | Public |
| `GET` | `/api/routes/:id` | Get single route details | Public |
| `POST` | `/api/routes` | Create new route | Public/Protected |
| `PUT` | `/api/routes/:id` | Update route | Public/Protected |
| `DELETE` | `/api/routes/:id` | Delete route | Public/Protected |

### 7. Users (`/api/users`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users` | List system users | Protected |
| `GET` | `/api/users/:id` | Get user by id | Protected |
| `POST` | `/api/users` | Create user | Protected |
| `PUT` | `/api/users/:id` | Update user | Protected |
| `DELETE` | `/api/users/:id` | Delete user | Protected |

