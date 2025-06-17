function ensureAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  req.flash("error_msg", "Access denied. Admin privileges required.");
  res.redirect("/");
}

module.exports = {
  ensureAdmin,
};
