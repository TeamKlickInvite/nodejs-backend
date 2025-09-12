// middleware/checkFrappeAuth.js
export const checkFrappeAuth = (req, res, next) => {
  const secret = req.headers["xfrappe-z"];
  if (!secret || secret !== process.env.FRAPPE_SECRET_KEY) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized - Invalid Secret Key"
    });
  }
  next();
};
