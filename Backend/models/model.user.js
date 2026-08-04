const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  clerkId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true, 
    trim: true      
  },
  firstName: { 
    type: String, 
    default: '' 
  },
  lastName: { 
    type: String, 
    default: '' 
  },
  photoUrl: { 
    type: String, 
    default: '' 
  },
  rol: { 
    type: String, 
    enum: ['admin', 'superadmin'],
    default: 'admin' 
  },
  status: { 
    type: String, 
    enum: ['activo', 'inactivo', 'revocado'], 
    default: 'activo' 
  }
}, { 
 
  timestamps: true, 
  versionKey: false 
});


module.exports = mongoose.model('User', userSchema);