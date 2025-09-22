// middleware/checkFrappeAuth.js
export const checkFrappeAuth = (req, res, next) => {
  console.log(req.headers)
  const secret = req.headers["frappe-secret"]
  if (!secret || secret !== process.env.FRAPPE_SECRET_KEY) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized - Invalid Secret Key"
    });
  }
  next();
};
