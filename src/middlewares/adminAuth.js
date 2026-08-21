const { USER_ROLES } = require('../config/constants');

// Admin only access
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === USER_ROLES.ADMIN) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Seller only access (admin can also access)
const sellerOnly = (req, res, next) => {
  if (req.user && (req.user.role === USER_ROLES.SELLER || req.user.role === USER_ROLES.ADMIN)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Seller privileges required.'
    });
  }
};

// Check if user is owner of resource or admin
const ownerOrAdmin = (resourceOwnerId) => {
  return (req, res, next) => {
    if (req.user.role === USER_ROLES.ADMIN || 
        req.user.id === resourceOwnerId.toString()) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own resources.'
      });
    }
  };
};

module.exports = { 
  adminOnly, 
  sellerOnly,
  ownerOrAdmin
};
