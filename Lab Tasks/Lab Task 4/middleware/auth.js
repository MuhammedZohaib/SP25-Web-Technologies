function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.flash("error_msg", "Please log in to access this resource");
  res.redirect("/login");
}

module.exports = {
  ensureAuthenticated,
};
