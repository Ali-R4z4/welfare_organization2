const Donation = require("../models/Donation");
const DonationSettings = require("../models/DonationSettings");
const Project = require("../models/Project");
const axios = require("axios");

// @desc    Get donation settings
// @route   GET /api/donations/settings
// @access  Public
exports.getDonationSettings = async (req, res) => {
  try {
    const settings = await DonationSettings.getSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation settings",
      error: error.message,
    });
  }
};

// @desc    Create new donation (with location detection)
// @route   POST /api/donations
// @access  Public
exports.createDonation = async (req, res) => {
  try {
    // Support both old format (donor object) and new format (flat structure)
    const {
      donor,
      projectId,
      amount,
      currency,
      paymentMethod,
      privacyPolicyAccepted,
      termsAccepted,
      // New format from frontend form
      fullName,
      email,
      phone,
      address,
    } = req.body;

    // Extract donor information (support both formats)
    const donorName = donor?.name || fullName;
    const donorEmail = donor?.email || email;
    const donorPhone = donor?.phone || phone || "";
    const donorAddress = donor?.address || address || "";

    // Validation
    if (!donorName || !donorEmail) {
      return res.status(400).json({
        success: false,
        message: "Full name and email are required",
      });
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(donorEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid donation amount is required",
      });
    }

    // Currency validation
    const validCurrencies = ["PKR", "USD", "EUR", "GBP", "AED", "SAR"];
    const selectedCurrency = currency || "PKR";
    if (!validCurrencies.includes(selectedCurrency)) {
      return res.status(400).json({
        success: false,
        message: `Invalid currency. Accepted currencies: ${validCurrencies.join(
          ", "
        )}`,
      });
    }

    // Privacy policy and terms are optional for now (can be added to frontend later)
    // if (!privacyPolicyAccepted) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'You must accept the privacy policy'
    //   });
    // }

    // Get user IP and location
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    let locationData = {};

    try {
      // Try to get location from IP (using free API)
      if (ip && ip !== "::1" && !ip.startsWith("127.")) {
        const geoResponse = await axios.get(
          `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,region,timezone,lat,lon`
        );
        if (geoResponse.data.status === "success") {
          locationData = {
            ip: ip,
            country: geoResponse.data.country,
            countryCode: geoResponse.data.countryCode,
            city: geoResponse.data.city,
            region: geoResponse.data.region,
            timezone: geoResponse.data.timezone,
            latitude: geoResponse.data.lat,
            longitude: geoResponse.data.lon,
          };
        }
      }
    } catch (geoError) {
      console.log("Location detection failed:", geoError.message);
    }

    // Default payment method to bank_transfer if not provided
    const selectedPaymentMethod = paymentMethod || "bank_transfer";

    // Create donation
    const donation = await Donation.create({
      donor: {
        name: donorName.trim(),
        email: donorEmail.trim().toLowerCase(),
        phone: donorPhone.trim(),
        address: donorAddress.trim(),
        country: donor?.country || locationData.country || "",
      },
      project: projectId || null,
      amount: parseFloat(amount),
      currency: selectedCurrency,
      paymentMethod: selectedPaymentMethod,
      ipAddress: ip,
      location: locationData,
      userAgent: userAgent,
      privacyPolicyAccepted:
        privacyPolicyAccepted !== undefined ? privacyPolicyAccepted : true,
      privacyPolicyAcceptedAt:
        privacyPolicyAccepted !== false ? new Date() : null,
      termsAccepted: termsAccepted !== undefined ? termsAccepted : true,

      // Bank details (defaults)
      bankName: "Meezan Bank Limited",
      bankAccountTitle: "Pakistan Medico International",
      bankSwiftCode: "MEZNPKKA",

      status:
        selectedPaymentMethod === "bank_transfer" ? "pending" : "processing",
    });

    // Update project if specified
    if (projectId) {
      await Project.findByIdAndUpdate(projectId, {
        $inc: {
          raisedAmount: donation.convertedAmount || donation.amount,
          donationCount: 1,
        },
      });
    }

    // Generate reference number
    const reference = `PMI-${donation._id
      .toString()
      .slice(-8)
      .toUpperCase()}-${Date.now()}`;

    const currencyMap = {
      PKR: 586,
      USD: 280,
      EUR: 300,
      GBP: 350,
      AED: 76,
      SAR: 75,
    };

    // Call Meezan Bank payment API (POST request)
    // Meezan Bank API accepts form-urlencoded data
    const meezanParams = new URLSearchParams();
    meezanParams.append("userName", "PAKISTANMEDICO_api");
    meezanParams.append("password", "P987658");
    meezanParams.append("amount", (amount * 100).toString());
    meezanParams.append("currency", currencyMap[selectedCurrency].toString());
    meezanParams.append(
      "returnUrl",
      process.env.MEEZAN_RETURN_URL || "http://localhost:3000/donate/success"
    );
    meezanParams.append("orderNumber", reference);

    console.log(meezanParams.toString());

    const meezanResponse = await axios.post(
      `https://acquiring.meezanbank.com/payment/rest/register.do`,
      meezanParams.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Parse the response (Meezan Bank returns XML or JSON)
    let formUrl = null;
    console.log("Meezan Bank Response:", meezanResponse.data);

    if (meezanResponse.data) {
      // If it's JSON
      if (typeof meezanResponse.data === "object") {
        formUrl =
          meezanResponse.data.formUrl ||
          meezanResponse.data.url ||
          meezanResponse.data.formUrl;
      } else if (typeof meezanResponse.data === "string") {
        // If it's XML or string, try to extract URL
        // Try different patterns
        const patterns = [
          /formUrl["\s:=]+([^"'\s<>]+)/i,
          /<formUrl>([^<]+)<\/formUrl>/i,
          /formUrl=([^&\s]+)/i,
          /url["\s:=]+([^"'\s<>]+)/i,
        ];

        for (const pattern of patterns) {
          const match = meezanResponse.data.match(pattern);
          if (match && match[1]) {
            formUrl = match[1];
            break;
          }
        }
      }
    }

    if (!formUrl) {
      console.error(
        "Failed to parse formUrl from Meezan Bank response:",
        meezanResponse.data
      );
      return res.status(500).json({
        success: false,
        message: "Failed to get payment URL from Meezan Bank",
        debug: meezanResponse.data
          ? "Response received but formUrl not found"
          : "No response from Meezan Bank",
      });
    }

    res.status(201).json({
      success: true,
      message: "Donation request created successfully",
      data: {
        donationId: donation._id,
        reference: reference,
        formUrl: formUrl,
      },
    });
  } catch (error) {
    console.error("Create donation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create donation",
      error: error.message,
    });
  }
};

// @desc    Get donation by ID
// @route   GET /api/donations/:id
// @access  Public (for donation status check)
exports.getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .select("-__v -updatedAt")
      .populate("project", "title category image");

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error("Get donation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation",
      error: error.message,
    });
  }
};

// @desc    Get all donations (Admin)
// @route   GET /api/donations
// @access  Private/Admin
exports.getAllDonations = async (req, res) => {
  try {
    const {
      status,
      currency,
      country,
      page = 1,
      limit = 50,
      search = "",
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (currency) query.currency = currency;
    if (country) query["donor.country"] = new RegExp(country, "i");

    // Search
    if (search) {
      query.$or = [
        { "donor.name": { $regex: search, $options: "i" } },
        { "donor.email": { $regex: search, $options: "i" } },
        { bankReference: { $regex: search, $options: "i" } },
        { gatewayTransactionId: { $regex: search, $options: "i" } },
      ];
    }

    const donations = await Donation.find(query)
      .populate("project", "title category")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    // Get summary stats
    const stats = await Donation.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$convertedAmount" },
          totalCount: { $sum: 1 },
          byCurrency: {
            $push: {
              currency: "$currency",
              amount: "$amount",
              convertedAmount: "$convertedAmount",
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: donations,
      summary: stats[0] || { totalAmount: 0, totalCount: 0, byCurrency: [] },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all donations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donations",
      error: error.message,
    });
  }
};

// @desc    Update donation status (Admin)
// @route   PUT /api/donations/:id/verify
// @access  Private/Admin
exports.verifyDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      bankReference,
      bankTransferDate,
      bankTransferSlip,
      transactionId,
      notes,
    } = req.body;

    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    // Update fields
    if (status) donation.status = status;
    if (bankReference) donation.bankReference = bankReference;
    if (bankTransferDate)
      donation.bankTransferDate = new Date(bankTransferDate);
    if (bankTransferSlip) donation.bankTransferSlip = bankTransferSlip;
    if (transactionId) donation.gatewayTransactionId = transactionId;
    if (notes) donation.notes = notes;

    // If marking as completed
    if (status === "completed") {
      donation.verifiedBy = req.user.id;
      donation.verifiedAt = new Date();

      // Send receipt email if not sent
      if (!donation.receiptSent) {
        donation.receiptSent = true;
        donation.receiptSentAt = new Date();
      }
    }

    await donation.save();

    res.status(200).json({
      success: true,
      message: "Donation updated successfully",
      data: donation,
    });
  } catch (error) {
    console.error("Verify donation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update donation",
      error: error.message,
    });
  }
};

// @desc    Get donation statistics (Admin)
// @route   GET /api/donations/statistics/summary
// @access  Private/Admin
exports.getDonationStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      totalStats,
      monthlyStats,
      lastMonthStats,
      dailyStats,
      currencyStats,
      countryStats,
      statusStats,
    ] = await Promise.all([
      // Total donations (completed only)
      Donation.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$convertedAmount" },
            totalCount: { $sum: 1 },
            avgAmount: { $avg: "$convertedAmount" },
          },
        },
      ]),

      // This month
      Donation.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: thisMonth },
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$convertedAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Last month
      Donation.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: lastMonth, $lt: thisMonth },
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$convertedAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Today
      Donation.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$convertedAmount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // By currency
      Donation.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: "$currency",
            amount: { $sum: "$amount" },
            convertedAmount: { $sum: "$convertedAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { convertedAmount: -1 } },
      ]),

      // By country
      Donation.aggregate([
        { $match: { status: "completed", "donor.country": { $ne: "" } } },
        {
          $group: {
            _id: "$donor.country",
            amount: { $sum: "$convertedAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
        { $limit: 10 },
      ]),

      // By status
      Donation.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const result = {
      total: {
        amount: totalStats[0]?.totalAmount || 0,
        count: totalStats[0]?.totalCount || 0,
        average: totalStats[0]?.avgAmount || 0,
      },
      monthly: {
        amount: monthlyStats[0]?.amount || 0,
        count: monthlyStats[0]?.count || 0,
      },
      lastMonth: {
        amount: lastMonthStats[0]?.amount || 0,
        count: lastMonthStats[0]?.count || 0,
      },
      daily: {
        amount: dailyStats[0]?.amount || 0,
        count: dailyStats[0]?.count || 0,
      },
      byCurrency: currencyStats,
      byCountry: countryStats,
      byStatus: statusStats,
    };

    // Calculate growth
    result.monthlyGrowth = lastMonthStats[0]?.amount
      ? (
          ((result.monthly.amount - lastMonthStats[0].amount) /
            lastMonthStats[0].amount) *
          100
        ).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};

// @desc    Update donation settings (Admin)
// @route   PUT /api/donations/settings
// @access  Private/Admin
exports.updateDonationSettings = async (req, res) => {
  try {
    const settings = await DonationSettings.getSettings();

    // Update settings
    Object.keys(req.body).forEach((key) => {
      if (settings[key] !== undefined) {
        settings[key] = req.body[key];
      }
    });

    settings.updatedBy = req.user.id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: "Donation settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update donation settings",
      error: error.message,
    });
  }
};

// @desc    Delete donation (Admin)
// @route   DELETE /api/donations/:id
// @access  Private/Admin
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    // If donation was completed, update project
    if (donation.status === "completed" && donation.project) {
      await Project.findByIdAndUpdate(donation.project, {
        $inc: {
          raisedAmount: -(donation.convertedAmount || donation.amount),
          donationCount: -1,
        },
      });
    }

    await donation.deleteOne();

    res.status(200).json({
      success: true,
      message: "Donation deleted successfully",
    });
  } catch (error) {
    console.error("Delete donation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete donation",
      error: error.message,
    });
  }
};

// @desc    Upload bank detail images (Admin)
// @route   POST /api/donations/settings/upload-images
// @access  Private/Admin
exports.uploadBankImages = async (req, res) => {
  try {
    const { bankDetailsImage, privacyPolicyImage } = req.body;

    const settings = await DonationSettings.getSettings();

    if (bankDetailsImage) {
      settings.bankDetailsImage = bankDetailsImage;
    }

    if (privacyPolicyImage) {
      settings.privacyPolicyImage = privacyPolicyImage;
    }

    settings.updatedBy = req.user.id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      data: {
        bankDetailsImage: settings.bankDetailsImage,
        privacyPolicyImage: settings.privacyPolicyImage,
      },
    });
  } catch (error) {
    console.error("Upload images error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload images",
      error: error.message,
    });
  }
};
