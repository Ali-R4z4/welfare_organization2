const AboutUs = require('../models/AboutUs');

// @desc    Get About Us data
// @route   GET /api/about
// @access  Public
exports.getAboutUs = async (req, res) => {
  try {
    let aboutUs = await AboutUs.findOne();
    
    // If no data exists, create default empty document
    if (!aboutUs) {
      aboutUs = await AboutUs.create({
        mission: '',
        vision: '',
        values: {
          compassion: '',
          excellence: '',
          equity: '',
          transparency: ''
        },
        achievements: {
          patientsTreated: '',
          medicalCamps: '',
          partnerHospitals: '',
          awards: ''
        },
        teamMembers: [],
        certificates: []
      });
    }

    res.status(200).json({
      success: true,
      data: aboutUs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch About Us data',
      error: error.message
    });
  }
};

// @desc    Update About Us data
// @route   PUT /api/about
// @access  Private (Admin only)
exports.updateAboutUs = async (req, res) => {
  try {
    const {
      mission,
      vision,
      values,
      achievements,
      teamMembers,
      certificates
    } = req.body;

    let aboutUs = await AboutUs.findOne();

    if (!aboutUs) {
      // Create new if doesn't exist
      aboutUs = await AboutUs.create({
        mission,
        vision,
        values,
        achievements,
        teamMembers,
        certificates
      });
    } else {
      // Update existing
      aboutUs.mission = mission || aboutUs.mission;
      aboutUs.vision = vision || aboutUs.vision;
      aboutUs.values = values || aboutUs.values;
      aboutUs.achievements = achievements || aboutUs.achievements;
      aboutUs.teamMembers = teamMembers || aboutUs.teamMembers;
      aboutUs.certificates = certificates || aboutUs.certificates;
      
      await aboutUs.save();
    }

    res.status(200).json({
      success: true,
      message: 'About Us updated successfully',
      data: aboutUs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update About Us data',
      error: error.message
    });
  }
};