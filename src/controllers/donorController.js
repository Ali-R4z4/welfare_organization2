const Donor = require('../models/Donor');
const jwt = require('jsonwebtoken');

// Generate JWT Token for Donor
const generateToken = (id) => {
  return jwt.sign({ id, type: 'donor' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register new donor
// @route   POST /api/donors/register
// @access  Public
exports.registerDonor = async (req, res) => {
  try {
    const { name, email, password, phone, address, isAnonymous } = req.body;

    // Check if donor already exists
    const donorExists = await Donor.findOne({ email });
    if (donorExists) {
      return res.status(400).json({
        success: false,
        message: 'Donor with this email already exists'
      });
    }

    // Create donor
    const donor = await Donor.create({
      name,
      email,
      password,
      phone,
      address,
      isAnonymous
    });

    // Generate token
    const token = generateToken(donor._id);

    res.status(201).json({
      success: true,
      message: 'Donor registered successfully',
      data: {
        _id: donor._id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        isAnonymous: donor.isAnonymous,
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to register donor',
      error: error.message
    });
  }
};

// @desc    Login donor
// @route   POST /api/donors/login
// @access  Public
exports.loginDonor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for donor (include password field)
    const donor = await Donor.findOne({ email }).select('+password');
    if (!donor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if donor is active
    if (!donor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordMatch = await donor.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(donor._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: donor._id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        totalDonated: donor.totalDonated,
        donationCount: donor.donationCount,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get donor profile
// @route   GET /api/donors/profile
// @access  Private (Donor)
exports.getDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findById(req.donor.id);
    
    res.status(200).json({
      success: true,
      data: donor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update donor profile
// @route   PUT /api/donors/profile
// @access  Private (Donor)
exports.updateDonorProfile = async (req, res) => {
  try {
    const { name, phone, address, isAnonymous } = req.body;

    const donor = await Donor.findById(req.donor.id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Update fields
    if (name) donor.name = name;
    if (phone) donor.phone = phone;
    if (address) donor.address = address;
    if (typeof isAnonymous !== 'undefined') donor.isAnonymous = isAnonymous;

    await donor.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: donor
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Get all donors (Admin only)
// @route   GET /api/donors
// @access  Private (Admin)
exports.getAllDonors = async (req, res) => {
  try {
    const { search, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const donors = await Donor.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: donors.length,
      data: donors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donors',
      error: error.message
    });
  }
};

// @desc    Get single donor (Admin only)
// @route   GET /api/donors/:id
// @access  Private (Admin)
exports.getDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: donor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donor',
      error: error.message
    });
  }
};