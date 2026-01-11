const mongoose = require('mongoose');

const aboutUsSchema = new mongoose.Schema({
  mission: {
    type: String,
    default: ''
  },
  vision: {
    type: String,
    default: ''
  },
  values: {
    compassion: { type: String, default: '' },
    excellence: { type: String, default: '' },
    equity: { type: String, default: '' },
    transparency: { type: String, default: '' }
  },
  achievements: {
    patientsTreated: { type: String, default: '' },
    medicalCamps: { type: String, default: '' },
    partnerHospitals: { type: String, default: '' },
    awards: { type: String, default: '' }
  },
  teamMembers: [{
    name: { type: String, required: true },
    role: { type: String, required: true },
    image: { type: String, required: true }
  }],
  certificates: [{
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    year: { type: String, required: true },
    image: { type: String, required: true }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('AboutUs', aboutUsSchema);