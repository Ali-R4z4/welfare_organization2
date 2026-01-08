// backend/src/controllers/statisticsController.js
const Project = require('../models/Project');
const Donation = require('../models/Donation');
const Donor = require('../models/Donor');

// @desc    Get dashboard statistics
// @route   GET /api/statistics/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // Total projects
    const totalProjects = await Project.countDocuments();
    
    // Active projects (status: 'active')
    const activeProjects = await Project.countDocuments({ status: 'active' });
    
    // Completed projects (status: 'completed')
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    
    // Total donations amount
    const donationStats = await Donation.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          donationCount: { $sum: 1 }
        }
      }
    ]);
    
    // Total donors
    const totalDonors = await Donor.countDocuments();
    
    // Recent donations (last 5)
    const recentDonations = await Donation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('donor', 'name email')
      .populate('project', 'title');
    
    // Project completion rate
    const completionRate = totalProjects > 0 
      ? Math.round((completedProjects / totalProjects) * 100) 
      : 0;
    
    // Monthly donation trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyDonations = await Donation.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: 1
                }
              }
            }
          },
          totalAmount: 1,
          count: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          activeProjects,
          completedProjects,
          completionRate: `${completionRate}%`,
          totalDonors,
          totalDonations: donationStats[0]?.donationCount || 0,
          totalAmount: donationStats[0]?.totalAmount || 0
        },
        recentDonations,
        monthlyDonations,
        chartData: {
          projects: {
            total: totalProjects,
            active: activeProjects,
            completed: completedProjects
          }
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// @desc    Get project statistics
// @route   GET /api/statistics/projects
// @access  Private/Admin
const getProjectStats = async (req, res) => {
  try {
    // Project status distribution
    const statusStats = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalFunding: { $sum: '$currentFunding' }
        }
      }
    ]);
    
    // Top 5 funded projects
    const topFundedProjects = await Project.find()
      .sort({ currentFunding: -1 })
      .limit(5)
      .select('title description targetAmount currentFunding status');
    
    // Project funding progress
    const fundingStats = await Project.aggregate([
      {
        $project: {
          title: 1,
          fundingPercentage: {
            $cond: [
              { $eq: ['$targetAmount', 0] },
              0,
              { $multiply: [{ $divide: ['$currentFunding', '$targetAmount'] }, 100] }
            ]
          },
          targetAmount: 1,
          currentFunding: 1
        }
      },
      {
        $sort: { fundingPercentage: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Projects by category
    const categoryStats = await Project.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalFunding: { $sum: '$currentFunding' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        statusDistribution: statusStats,
        topFundedProjects,
        fundingProgress: fundingStats,
        categoryDistribution: categoryStats
      }
    });
  } catch (error) {
    console.error('Project stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project statistics',
      error: error.message
    });
  }
};

// @desc    Get donation statistics
// @route   GET /api/statistics/donations
// @access  Private/Admin
const getDonationStats = async (req, res) => {
  try {
    // Total donations summary
    const totalStats = await Donation.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          count: { $sum: 1 },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      }
    ]);
    
    // Donations by payment method
    const paymentMethodStats = await Donation.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Monthly donations (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const monthlyStats = await Donation.aggregate([
      {
        $match: {
          createdAt: { $gte: oneYearAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: 1
                }
              }
            }
          },
          totalAmount: 1,
          count: 1,
          averageAmount: { $divide: ['$totalAmount', '$count'] }
        }
      }
    ]);
    
    // Top 10 largest donations
    const largestDonations = await Donation.find()
      .sort({ amount: -1 })
      .limit(10)
      .populate('donor', 'name email')
      .populate('project', 'title');
    
    res.json({
      success: true,
      data: {
        summary: totalStats[0] || {},
        paymentMethods: paymentMethodStats,
        monthlyTrends: monthlyStats,
        largestDonations
      }
    });
  } catch (error) {
    console.error('Donation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation statistics',
      error: error.message
    });
  }
};

// @desc    Get donor statistics
// @route   GET /api/statistics/donors
// @access  Private/Admin
const getDonorStats = async (req, res) => {
  try {
    // Total donors
    const totalDonors = await Donor.countDocuments();
    
    // New donors (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newDonors = await Donor.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Top donors by total donations
    const topDonors = await Donation.aggregate([
      {
        $group: {
          _id: '$donor',
          totalDonated: { $sum: '$amount' },
          donationCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalDonated: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'donors',
          localField: '_id',
          foreignField: '_id',
          as: 'donorInfo'
        }
      },
      {
        $unwind: '$donorInfo'
      },
      {
        $project: {
          donorId: '$_id',
          name: '$donorInfo.name',
          email: '$donorInfo.email',
          totalDonated: 1,
          donationCount: 1,
          averageDonation: { $divide: ['$totalDonated', '$donationCount'] }
        }
      }
    ]);
    
    // Donor location distribution
    const locationStats = await Donor.aggregate([
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Donor type distribution
    const typeStats = await Donor.aggregate([
      {
        $group: {
          _id: '$donorType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Donor retention (donors with multiple donations)
    const repeatDonors = await Donation.aggregate([
      {
        $group: {
          _id: '$donor',
          donationCount: { $sum: 1 }
        }
      },
      {
        $match: {
          donationCount: { $gt: 1 }
        }
      },
      {
        $count: 'repeatDonorsCount'
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalDonors,
        newDonors,
        repeatDonors: repeatDonors[0]?.repeatDonorsCount || 0,
        topDonors,
        locationDistribution: locationStats,
        typeDistribution: typeStats
      }
    });
  } catch (error) {
    console.error('Donor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donor statistics',
      error: error.message
    });
  }
};

// Make sure to export all functions
module.exports = {
  getDashboardStats,
  getProjectStats,
  getDonationStats,
  getDonorStats
};