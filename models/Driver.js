const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: [true, 'Driver ID is required'],
      unique: true,
      trim: true,
    },
    driverName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Driver category is required'],
      enum: {
        values: ['Plastic', 'Paper', 'Organic waste', 'Organic Waste', 'Chatbot'],
        message: '{VALUE} is not a valid category',
      },
      default: 'Organic Waste',
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: '+94 123 456 789',
    },
    phone: {
      type: String,
      trim: true,
      default: '+94 123 456 789',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: 's@gmail.com',
    },
    password: {
      type: String,
      default: '••••••••••',
    },
    isPresentToday: {
      type: Boolean,
      default: true,
    },
    isAllocated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save synchronization for driverName/name and mobileNumber/phone, plus password hashing
driverSchema.pre('save', async function () {
  if (!this.driverName && this.name) {
    this.driverName = this.name;
  }
  if (!this.name && this.driverName) {
    this.name = this.driverName;
  }
  if (!this.mobileNumber && this.phone) {
    this.mobileNumber = this.phone;
  }
  if (!this.phone && this.mobileNumber) {
    this.phone = this.mobileNumber;
  }

  // Hash password if modified and not already hashed with bcrypt
  if (this.isModified('password') && this.password && !this.password.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Match entered password
driverSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
