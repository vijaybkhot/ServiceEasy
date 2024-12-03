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