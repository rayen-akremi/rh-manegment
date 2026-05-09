const mongoose = require('mongoose');
const crypto = require('crypto');

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, savedPassword) => {
  const [salt, savedHash] = String(savedPassword).split(':');
  if (!salt || !savedHash) {
    return password === savedPassword;
  }

  const hashBuffer = Buffer.from(hashPassword(password, salt).split(':')[1], 'hex');
  const savedHashBuffer = Buffer.from(savedHash, 'hex');
  return hashBuffer.length === savedHashBuffer.length && crypto.timingSafeEqual(hashBuffer, savedHashBuffer);
};

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /.+\@.+\..+/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null // Base64 encoded image or URL
  },
  sessions: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  try {
    this.password = hashPassword(this.password);
  } catch (error) {
    throw error;
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return verifyPassword(candidatePassword, this.password);
};

// Don't return password in toJSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.sessions;
  return user;
};

module.exports = mongoose.model('User', userSchema);
