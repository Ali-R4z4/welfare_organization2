const Donation = require('../models/Donation');
const Donor = require('../models/Donor');
const Project = require('../models/Project');

// @desc    Create a new donation
// @route   POST /api/donations
// @access  Public (can be donor or guest)
exports.createDonation = async (req, res) => {
  try {
    const {
      donorId,
      projectId,
      amount,
      currency,
      paymentMethod,
      message,
      isAnonymous,
      donorName,
      donorEmail
    } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // If donorId provided, verify donor exists
    let donor = null;
    if (donorId) {
      donor = await Donor.findById(donorId);
      if (!donor) {
        return res.status(404).json({
          success: false,
          message: 'Donor not found'
        });
      }
    }

    // Create donation
    const donation = await Donation.create({
      donor: donorId || null,
      project: projectId,
      amount,
      currency: currency || project.currency,
      paymentMethod,
      paymentStatus: 'completed', // For now, mark as completed
      message,
      isAnonymous,
      donorName: donorName || (donor ? donor.name : 'Anonymous'),
      donorEmail: donorEmail || (donor ? donor.email : null)
    });

    // Update project raised amount and donation count
    project.raisedAmount += amount;
    project.donationCount += 1;
    await project.save();

    // Update donor stats if registered donor
    if (donor) {
      donor.totalDonated += amount;
      donor.donationCount += 1;
      await donor.save();
    }

    // Populate donor and project info
    await donation.populate('donor', 'name email');
    await donation.populate('project', 'title location');

    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      data: donation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create donation',
      error: error.message
    });
  }
};

// @desc    Get all donations (Admin only)
// @route   GET /api/donations
// @access  Private (Admin)
exports.getAllDonations = async (req, res) => {
  try {
    const {
      projectId,
      donorId,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    let query = {};

    if (projectId) query.project = projectId;
    if (donorId) query.donor = donorId;
    if (status) query.paymentStatus = status;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const donations = await Donation.find(query)
      .populate('donor', 'name email phone')
      .populate('project', 'title location status')
      .sort(sortOptions);

    // Calculate total amount
    const totalAmount = donations.reduce((sum, donation) => {
      if (donation.paymentStatus === 'completed') {
        return sum + donation.amount;
      }
      return sum;
    }, 0);

    res.status(200).json({
      success: true,
      count: donations.length,
      totalAmount,
      data: donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations',
      error: error.message
    });
  }
};

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Private (Admin or Donor who made it)
exports.getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone')
      .populate('project', 'title description location image');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation',
      error: error.message
    });
  }
};

// @desc    Get donations by donor (their own donations)
// @route   GET /api/donations/my
// @access  Private (Donor)
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.donor.id })
      .populate('project', 'title location image status')
      .sort({ createdAt: -1 });

    // Calculate total donated
    const totalDonated = donations.reduce((sum, donation) => {
      if (donation.paymentStatus === 'completed') {
        return sum + donation.amount;
      }
      return sum;
    }, 0);

    res.status(200).json({
      success: true,
      count: donations.length,
      totalDonated,
      data: donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your donations',
      error: error.message
    });
  }
};

// @desc    Get donations for a specific project
// @route   GET /api/donations/project/:id
// @access  Public
exports.getProjectDonations = async (req, res) => {
  try {
    const donations = await Donation.find({
      project: req.params.id,
      paymentStatus: 'completed'
    })
      .populate('donor', 'name')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to recent 50 donations

    // Calculate total for this project
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);

    // Hide donor info if anonymous
    const sanitizedDonations = donations.map(donation => {
      if (donation.isAnonymous) {
        return {
          ...donation.toObject(),
          donor: null,
          donorName: 'Anonymous',
          donorEmail: null
        };
      }
      return donation;
    });

    res.status(200).json({
      success: true,
      count: sanitizedDonations.length,
      totalAmount,
      data: sanitizedDonations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project donations',
      error: error.message
    });
  }
};

// @desc    Update donation status (Admin only)
// @route   PUT /api/donations/:id
// @access  Private (Admin)
exports.updateDonation = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Update status
    if (paymentStatus) {
      donation.paymentStatus = paymentStatus;
    }

    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Donation updated successfully',
      data: donation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update donation',
      error: error.message
    });
  }
};

// @desc    Delete donation (Admin only)
// @route   DELETE /api/donations/:id
// @access  Private (Admin)
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Revert project and donor stats if donation was completed
    if (donation.paymentStatus === 'completed') {
      // Update project
      const project = await Project.findById(donation.project);
      if (project) {
        project.raisedAmount -= donation.amount;
        project.donationCount -= 1;
        await project.save();
      }

      // Update donor if registered
      if (donation.donor) {
        const donor = await Donor.findById(donation.donor);
        if (donor) {
          donor.totalDonated -= donation.amount;
          donor.donationCount -= 1;
          await donor.save();
        }
      }
    }

    await donation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete donation',
      error: error.message
    });
  }
};