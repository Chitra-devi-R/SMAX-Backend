
// ==========================================

const User = require('../models/User');
const Ad = require('../models/Ad');
const { sendApprovalEmail } = require('../utils/emailService');

const notificationService = require('../utils/notificationService'); // 🆕 ADD THIS

// @desc    Approve ad
// @route   PUT /api/admin/ads/:id/approve
// @access  Private/Admin
exports.approveAd = async (req, res) => {
  try {
    console.log('\n✅ APPROVE AD:', req.params.id);

    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      console.log('❌ Ad not found\n');
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    ad.status = 'approved';
    ad.approvedBy = req.user.id;
    ad.approvedAt = new Date();
    
    if (req.body.note) {
      ad.adminNote = req.body.note;
    }

    await ad.save();

    // 🆕 SEND NOTIFICATION TO AD OWNER
    await notificationService.notifyAdApproved(
      ad.seller,
      ad._id,
      ad.title
    );
    console.log('📬 Approval notification sent');

    console.log('✅ Ad approved\n');

    res.json({
      success: true,
      message: 'Ad approved successfully',
      data: ad
    });

  } catch (error) {
    console.error('❌ Approve ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve ad',
      error: error.message
    });
  }
};

// @desc    Reject ad
// @route   PUT /api/admin/ads/:id/reject
// @access  Private/Admin
exports.rejectAd = async (req, res) => {
  try {
    console.log('\n❌ REJECT AD:', req.params.id);

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rejection reason'
      });
    }

    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      console.log('❌ Ad not found\n');
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    ad.status = 'rejected';
    ad.rejectedBy = req.user.id;
    ad.rejectedAt = new Date();
    ad.rejectionReason = reason;

    await ad.save();

    // 🆕 SEND NOTIFICATION TO AD OWNER
    await notificationService.notifyAdRejected(
      ad.seller,
      ad._id,
      ad.title,
      reason
    );
    console.log('📬 Rejection notification sent');

    console.log('✅ Ad rejected\n');

    res.json({
      success: true,
      message: 'Ad rejected successfully',
      data: ad
    });

  } catch (error) {
    console.error('❌ Reject ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject ad',
      error: error.message
    });
  }
};



exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAds = await Ad.countDocuments();
    const pendingAds = await Ad.countDocuments({ status: 'pending' });
    const approvedAds = await Ad.countDocuments({ status: 'approved' });
    const rejectedAds = await Ad.countDocuments({ status: 'rejected' });

    const recentAds = await Ad.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('seller', 'name email');

    res.json({
      success: true,
      stats: { 
        totalUsers, 
        totalAds, 
        pendingAds, 
        approvedAds,
        rejectedAds 
      },
      recentAds
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingAds = async (req, res) => {
  try {
    const ads = await Ad.find({ status: 'pending' })
      .populate('seller', 'name email mobile')
      .populate('category')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, count: ads.length, ads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveAd = async (req, res) => {
  try {
    const { adminNote } = req.body;
    
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', adminNote },
      { new: true }
    ).populate('seller');

    await sendApprovalEmail(ad.seller.email, ad.title, 'approved', adminNote);

    res.json({ success: true, message: 'Ad approved successfully', ad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectAd = async (req, res) => {
  try {
    const { adminNote } = req.body;
    
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', adminNote },
      { new: true }
    ).populate('seller');

    await sendApprovalEmail(ad.seller.email, ad.title, 'rejected', adminNote);

    res.json({ success: true, message: 'Ad rejected', ad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ 
      success: true, 
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      user 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const adsByCategory = await Ad.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo'
      }},
      { $unwind: '$categoryInfo' },
      { $project: {
        category: '$categoryInfo.name',
        count: 1
      }}
    ]);

    const adsByMonth = await Ad.aggregate([
      { $group: {
        _id: { 
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({ 
      success: true, 
      reports: { adsByCategory, adsByMonth } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};