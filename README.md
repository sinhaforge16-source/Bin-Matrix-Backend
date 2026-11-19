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
  - Supports status query filtering: `?status=Online`, `?status=Offline`, `?status=Online Bins`, and `?status=Offline Bins`.
- **System Notifications (`/api/notifications`)**:
  - Categorized alert system matching `Notification.png` (`All`, `Routes`, `Trucks`, `Drivers`, `Bins`).
  - Action routing with targets (e.g. `View Truck`, `View Driver`, `View Bin`, `View Chat`, `View Route`).
  - Single and bulk read tracking (`PATCH /:id/read`, `PATCH /read-all`).
- **Route Optimization (`/api/routes/optimized`, `/api/routes/confirm`)**:
  - Step-by-step optimization sequence (steps `01` through `05`) matching `Routes1.png` and `Routes2.png`.
  - Full route path coordinates for Sri Lankan corridors (Dedigamuwa → Ranala → Embulgama → Artigala → Hanwella).
  - One-click route confirmation (`POST /confirm`) with automated notification triggers.
- **User Management Table (`/api/app-users`)**:
  - Full CRUD operations matching `Users.png` with fields: `userId` (`VI-123`), `email`, `assignedBinId`, `status`, `percentage`, `location`, `lastUpdated`.
  - Returns `availableBins` list for instant frontend dropdown selection.
- **Vehicle Assignment & Vehicles List (`/api/vehicle-assignments`)**:
  - Vehicle-to-driver-to-route assignment workflow matching `Vehicles1.png` (Assignment modal) and `Vehicles2.png` (Vehicles List table).
  - Supports filtering by `?wasteType=Plastic` (case-insensitive for `Plastic`, `Paper`, `Organic Waste`, `E-waste`, `Chatbot`).
  - Full CRUD support with instant dropdown options for waste types, drivers, vehicles, and routes.
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
│   ├── appUserController.js   # User management for Users.png
│   ├── authController.js      # Auth logic (register, login, getMe)
│   ├── binController.js       # Bins CRUD, filtering & map monitoring summary
│   ├── chatController.js      # Chat threads, messages & map pins
│   ├── dashboardController.js # Aggregations for Home.png dashboard
│   ├── driverController.js    # Drivers CRUD & category filtering
│   ├── notificationController.js # Notifications alerts & read tracking
│   ├── reportController.js    # Historical analytics for Detailed Reports
│   ├── routeController.js     # Routes management & route optimization
│   ├── truckController.js     # Fleet vehicles & history management
│   ├── userController.js      # Users management
│   └── vehicleAssignmentController.js # Vehicle-to-driver-to-route assignments
├── middleware/
│   ├── authMiddleware.js      # JWT verification & role authorization
│   └── errorMiddleware.js     # 404 & centralized error handler
├── models/
│   ├── AppUser.js             # User management schema (Users.png)
│   ├── Bin.js                 # Bin schema (binId, category, status, fillLevel, capacityStatus, isPriority, GPS)
│   ├── ChatMessage.js         # Chat message schema with map pins & photo attachments
│   ├── Driver.js              # Driver schema (name, driverId, category, isPresentToday, isAllocated)
│   ├── Notification.js        # Notification alerts schema (Routes, Trucks, Drivers, Bins)
│   ├── ReportMetric.js        # Analytics schema (category, date, onTime, late, notCleaned, fuel, distance)
│   ├── Route.js               # Route schema (routeName, area, assignedTruck, assignedDriver, status)
│   ├── RoutePlan.js           # Route optimization steps schema (Routes1.png & Routes2.png)
│   ├── Truck.js               # Truck schema (truckNumber, category, status, isIdle, distance, fuel)
│   ├── User.js                # System user schema (username, password, role, email)
│   ├── VehicleAssignment.js   # Vehicle assignment schema (Vehicles1.png & Vehicles2.png)
│   └── VehicleHistory.js      # Granular timeline activity logs schema
├── routes/
│   ├── appUserRoutes.js       # /api/app-users
│   ├── authRoutes.js          # /api/auth
│   ├── binRoutes.js           # /api/bins
│   ├── chatRoutes.js          # /api/chat
│   ├── dashboardRoutes.js     # /api/dashboard
│   ├── driverRoutes.js        # /api/drivers
│   ├── notificationRoutes.js  # /api/notifications
│   ├── reportRoutes.js        # /api/reports
│   ├── routeRoutes.js         # /api/routes
│   ├── truckRoutes.js         # /api/trucks
│   ├── userRoutes.js          # /api/users
│   └── vehicleAssignmentRoutes.js # /api/vehicle-assignments
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

### 5. Driver Management (`/api/drivers`)
- Query parameters: `?category=Organic%20Waste&search=Kamal`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/drivers` | List drivers with masked passwords, mobile, email | Public |
| `GET` | `/api/drivers/:id` | Get driver by MongoDB _id or `driverId` | Public |
| `POST` | `/api/drivers` | Create/Add new driver | Public/Protected |
| `PUT` | `/api/drivers/:id` | Update driver details (inline edits) | Public/Protected |
| `DELETE` | `/api/drivers/:id` | Delete driver | Public/Protected |

### 6. Chatbot Assistant & Location Alert Pins (`/api/chat`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/chat/threads` | User threads with latest messages & online status | Public |
| `GET` | `/api/chat/messages/:userId` | Full conversation history with image & location pins | Public |
| `POST` | `/api/chat/messages` | Send message/image/location and trigger automated bot replies | Public |
| `GET` | `/api/chat/map-pins` | Reported bin coordinates for Chat Map view (`Chat map.png`) | Public |

### 7. Vehicles & Fleet Monitoring (`/api/trucks`)
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

### 8. Route Optimization & Management (`/api/routes`)
- Query parameters: `?category=Plastic&status=In%20Progress&area=Galle`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/routes/optimized?category=Organic%20Waste` | Step-by-step optimization (steps `01` to `05`) matching `Routes1.png` & `Routes2.png` | Public |
| `POST` | `/api/routes/confirm` | Confirm route plan and trigger system notification | Public |
| `GET` | `/api/routes` | List routes with populated truck, driver, and bins | Public |
| `GET` | `/api/routes/:id` | Get single route details | Public |
| `POST` | `/api/routes` | Create new route | Public/Protected |
| `PUT` | `/api/routes/:id` | Update route | Public/Protected |
| `DELETE` | `/api/routes/:id` | Delete route | Public/Protected |

### 9. System Notifications (`/api/notifications`)
- Query parameters: `?category=Routes` (supports `All`, `Routes`, `Trucks`, `Drivers`, `Bins`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/notifications?category=All` | List alerts with action type, target ID, time ago matching `Notification.png` | Public |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read | Public |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read | Public |
| `POST` | `/api/notifications` | Manually dispatch a new notification | Public/Protected |
| `DELETE` | `/api/notifications/:id` | Delete notification | Public/Protected |

### 10. User Management Table (`/api/app-users`)
- Query parameters: `?category=Organic%20Waste&status=Online&search=VI-123`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/app-users?category=Organic%20Waste` | List users table with assigned bins, online status, percentages & available bins matching `Users.png` | Public |
| `GET` | `/api/app-users/:id` | Get app user details by MongoDB _id or `userId` | Public |
| `POST` | `/api/app-users` | Add/Create new app user | Public |
| `PUT` | `/api/app-users/:id` | Update user (inline assigned bin dropdown or status change) | Public |
| `DELETE` | `/api/app-users/:id` | Delete app user | Public |

### 11. Vehicle Assignment & Vehicles List (`/api/vehicle-assignments`)
- Aliased at: `/api/trucks/assignments`
- Query parameters: `?wasteType=Plastic` (case-insensitive) & `?search=Kamal`
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/vehicle-assignments` | Fetch all vehicle assignments + dropdown options matching `Vehicles1.png` & `Vehicles2.png` | Public |
| `GET` | `/api/vehicle-assignments/:id` | Get single vehicle assignment by MongoDB _id or `vehicleId` | Public |
| `POST` | `/api/vehicle-assignments` | Create/save new assignment (`DONE` button in `Vehicles1.png`) | Public |
| `PUT` | `/api/vehicle-assignments/:id` | Update vehicle assignment (table row edit in `Vehicles2.png`) | Public |
| `DELETE` | `/api/vehicle-assignments/:id` | Delete assignment (trash icon in `Vehicles2.png`) | Public |

### 12. System Users & RBAC (`/api/users`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users` | List system users | Protected |
| `GET` | `/api/users/:id` | Get user by id | Protected |
| `POST` | `/api/users` | Create user | Protected |
| `PUT` | `/api/users/:id` | Update user | Protected |
| `DELETE` | `/api/users/:id` | Delete user | Protected |
