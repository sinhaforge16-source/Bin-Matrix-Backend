# Bin Matrix - Waste Management System Backend

Production-ready Node.js, Express, and MongoDB (MERN) backend for the **Bin Matrix** Waste Management System, designed to interface seamlessly with the Web and Mobile dashboards.

---

## 🚀 Features

- **MVC Architecture**: Clean separation of Models, Views/Routes, and Controllers.
- **JWT Authentication & RBAC**: Secure token-based authentication (`/api/auth`) with bcrypt password hashing and role-based route protection.
- **Live Aggregation Dashboard (`/api/dashboard/summary`)**:
  - Aggregates overall bin statistics (online/offline counts, low battery count, and category fill levels).
  - Categorical breakdowns (`Plastic`, `Paper`, `Organic waste`) for Driver Status (Total, Today's Present, Allocated, Unallocated Present) and Truck Status (Online/Offline, Idle Truck, Total Distance, Fuel Consumption) matching `Home.png`.
- **Detailed Reports Analytics (`/api/reports/analytics`)**:
  - Returns historical and monthly analytics matching `Detailed Reports.png`:
    - Monthly Bin Cleaning Efficiency (time-series stacked bar: cleaned on-time, late, not cleaned).
    - Monthly Cleaning Status Distribution (pie chart distribution: 63% on-time, 21% late, 7% not cleaned).
    - Monthly Fuel Consumption (line chart time-series in liters).
    - Monthly Total Distance Travelled (bar chart in KM, e.g. 192.92 km).
- **Live Bin Map & Capacity Monitoring (`/api/bins/monitoring-summary`)**:
  - Groups bins into four status buckets matching `Bin Monitoring 1.png`:
    - `Normal` (Within safe capacity)
    - `Almost Full` (Near Capacity)
    - `Overflowing` (Critical Bins)
    - `Priority` (Priority Bins)
  - Provides GPS map pins populated with realistic coordinates around Hanwella, Nawagamuwa, Dedigamuwa, Artigala, and Dehiwala-Mount Lavinia.
- **Full CRUD Endpoints with Advanced Filters**:
  - Bins (`/api/bins` with `?category=Paper`, `?capacityStatus=Almost Full`, `?isPriority=true`, `?status=Online`).
  - Drivers (`/api/drivers`)
  - Trucks (`/api/trucks`)
  - Routes (`/api/routes`)
  - Users (`/api/users`)
  - Reports (`/api/reports`)
- **Automated Seeder**: Pre-configured `seeder.js` populating exact design metrics and realistic IDs (`Deh-2213-Ai`, `Deh-2233-Gn`, `Deh-2243-Fa`, `Deh-2314-At`).

---

## 📁 Directory Structure

```text
Bin-Matrix-Backend/
├── config/
│   └── db.js                 # MongoDB connection logic
├── controllers/
│   ├── authController.js      # Auth logic (register, login, getMe)
│   ├── binController.js       # Bins CRUD, filtering & map monitoring summary
│   ├── dashboardController.js # Aggregations for Home.png dashboard
│   ├── driverController.js    # Drivers CRUD & category filtering
│   ├── reportController.js    # Historical analytics for Detailed Reports
│   ├── routeController.js     # Routes management & assignments
│   ├── truckController.js     # Trucks fleet management
│   └── userController.js      # Users management
├── middleware/
│   ├── authMiddleware.js      # JWT verification & role authorization
│   └── errorMiddleware.js     # 404 & centralized error handler
├── models/
│   ├── Bin.js                 # Bin schema (binId, category, status, fillLevel, capacityStatus, isPriority, GPS)
│   ├── Driver.js              # Driver schema (name, driverId, category, isPresentToday, isAllocated)
│   ├── ReportMetric.js        # Analytics schema (category, date, onTime, late, notCleaned, fuel, distance)
│   ├── Route.js               # Route schema (routeName, area, assignedTruck, assignedDriver, status)
│   ├── Truck.js               # Truck schema (truckNumber, category, status, isIdle, distance, fuel)
│   └── User.js                # User schema (username, password, role, email)
├── routes/
│   ├── authRoutes.js          # /api/auth
│   ├── binRoutes.js           # /api/bins
│   ├── dashboardRoutes.js     # /api/dashboard
│   ├── driverRoutes.js        # /api/drivers
│   ├── reportRoutes.js        # /api/reports
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
   Configure [.env](file:///e:/Company/Sinhaforge/Bin%20matrix/Bin-Matrix-Backend/.env):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/binmatrix
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

### 1. Detailed Reports (`/api/reports`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/reports/analytics?category=Plastic` | Analytics for cleaning efficiency, pie chart, fuel, distance | Public |
| `GET` | `/api/reports` | List all raw report records | Public |
| `POST` | `/api/reports` | Create report metric record | Protected |

### 2. Bin Monitoring & CRUD (`/api/bins`)
- Query parameters: `?category=Paper&capacityStatus=Almost%20Full&isPriority=true&status=Online`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/bins/monitoring-summary?category=All` | 4 buckets (Normal, Almost Full, Overflowing, Priority) + Map pins | Public |
| `GET` | `/api/bins` | List bins with filtering, search, & pagination | Public |
| `GET` | `/api/bins/:id` | Get bin by MongoDB _id or `binId` | Public |
| `POST` | `/api/bins` | Create a new bin | Public/Protected |
| `PUT` | `/api/bins/:id` | Update bin by _id or `binId` | Public/Protected |
| `DELETE` | `/api/bins/:id` | Delete bin by _id or `binId` | Public/Protected |

### 3. Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login and receive JWT token | Public |
| `GET` | `/api/auth/me` | Get current logged-in user profile | Protected (JWT) |

### 4. Dashboard Summary (`/api/dashboard`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | High-level metrics matching `Home.png` | Public |

### 5. Drivers (`/api/drivers`)
- Query parameters: `?category=Paper&isPresentToday=true&isAllocated=false`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/drivers` | List drivers with filtering | Public |
| `GET` | `/api/drivers/:id` | Get driver by _id or `driverId` | Public |
| `POST` | `/api/drivers` | Create driver | Public/Protected |
| `PUT` | `/api/drivers/:id` | Update driver | Public/Protected |
| `DELETE` | `/api/drivers/:id` | Delete driver | Public/Protected |

### 6. Vehicles & Fleet Monitoring (`/api/trucks`)
- Query parameters: `?category=Organic%20Waste&status=Online&isIdle=false&search=VI-123`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/trucks` | List vehicles with drivers, routes, speeds, status | Public |
| `GET` | `/api/trucks/:vehicleId` | Full vehicle details, live location, today's summary & route progress | Public |
| `GET` | `/api/trucks/:vehicleId/history?fromDate=...&toDate=...` | Granular time-period logs across dates with empty-gap handling | Public |
| `POST` | `/api/trucks/:vehicleId/history` | Create vehicle history record | Protected |
| `POST` | `/api/trucks` | Create new vehicle | Public/Protected |
| `PUT` | `/api/trucks/:id` | Update vehicle | Public/Protected |
| `DELETE` | `/api/trucks/:id` | Delete vehicle | Public/Protected |

### 7. Routes (`/api/routes`)
- Query parameters: `?category=Plastic&status=In%20Progress&area=Galle`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/routes` | List routes with populated truck, driver, and bins | Public |
| `GET` | `/api/routes/:id` | Get single route details | Public |
| `POST` | `/api/routes` | Create new route | Public/Protected |
| `PUT` | `/api/routes/:id` | Update route | Public/Protected |
| `DELETE` | `/api/routes/:id` | Delete route | Public/Protected |

### 8. Users (`/api/users`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users` | List system users | Protected |
| `GET` | `/api/users/:id` | Get user by id | Protected |
| `POST` | `/api/users` | Create user | Protected |
| `PUT` | `/api/users/:id` | Update user | Protected |
| `DELETE` | `/api/users/:id` | Delete user | Protected |
