

const protect = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
  }
  req.user = req.session.user;
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Bạn không có quyền thực hiện hành động này. Yêu cầu role: ${roles.join(' hoặc ')}`
    });
  }
  next();
};

module.exports = { protect, authorize };
