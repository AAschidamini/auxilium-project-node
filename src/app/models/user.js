const mongoose = require("../../data/index");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: true,
    select: false,
  },

  professional: {
    type: Boolean,
    required: true,
    default: false,
  },

  statusChat: {
    type: Boolean,
    default: false,
  },

  crm: {
    type: String,
    default: null,
  },

  contact: {
    type: String,
    default: null,
  },

  description: {
    type: String,
    default: null,
  },

  passwordResetToken: {
    type: String,
    select: false,
  },

  passwordResetExpires: {
    type: Date,
    select: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre("save", async function (next) {
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;

  next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
