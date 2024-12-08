export const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect("/login");
};

export const attachUserToLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};

export const hasRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // Ensure `requiredRoles` is an array for flexibility
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (roles.includes(req.session.user.role)) {
      return next();
    }

    res.status(403).send("Access denied. Insufficient permissions.");
  };
};
