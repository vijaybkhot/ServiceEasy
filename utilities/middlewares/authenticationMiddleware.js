// Middleware to redirect to login if user is not logged in
export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).redirect("/login");
};

// Protect routes and throw error if user not logged in
export const customerProtect = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).render("errors/error", {
      status: 401,
      message: "You need to log in to access this page.",
      cssPath: `/public/css/error.css`,
    });
  }
  if (
    req.session.user.role !== "customer" &&
    req.session.user.role !== "admin"
  ) {
    return res.status(403).render("errors/error", {
      status: 403,
      message: "You do not have permission to access this page.",
      cssPath: `/public/css/error.css`,
    });
  }
  next();
};

export const attachUserToLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};

export const hasRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).render("errors/error", {
        status: 401,
        message: "You need to log in to access this page.",
        cssPath: `/public/css/error.css`,
      });
    }

    //  `requiredRoles` should be an array of roles
    const roles = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    if (roles.includes(req.session.user.role)) {
      return next();
    }

    console.error(
      `Access Denied: User with role '${
        req.session.user.role
      }' tried to access a page requiring one of the following roles: ${roles.join(
        ", "
      )}.`
    );
    return res.status(403).render("errors/error", {
      status: 403,
      message: "You do not have permission to access this page.",
      cssPath: `/public/css/error.css`,
    });
  };
};

export const redirectBasedOnRole = function (req, res, next) {
  const userRole = req.session.user?.role;

  if (!userRole) {
    return res.redirect("/login");
  }

  // Redirect based  users role
  switch (userRole) {
    case "customer":
      return res.redirect("/dashboard/customer-dashboard");
    case "employee":
      return res.redirect("/dashboard/employee-dashboard");
    case "store-manager":
      return res.redirect("/dashboard/store-manager-dashboard");
    case "admin":
      return res.redirect("/dashboard/admin-dashboard");
    default:
      console.error(
        `Unexpected role: ${userRole} - User info:`,
        req.session.user
      );
      return res.status(403).render("errors/error", {
        status: 403,
        message: "You do not have permission to access this page.",
        cssPath: `/public/css/error.css`,
      });
  }
};
