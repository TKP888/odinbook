const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error_msg", "Please log in to view this resource");
  res.redirect("/auth/login");
};

const ensureGuest = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect("/dashboard");
};

const ensureOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId =
        req.params.id || req.params.postId || req.params.commentId;
      const userId = req.user.id;

      let resource;

      switch (resourceType) {
        case "post":
          resource = await prisma.post.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          break;
        case "comment":
          resource = await prisma.comment.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          break;
        case "profile":
          resource = { userId: resourceId };
          break;
        default:
          return res.status(400).json({ error: "Invalid resource type" });
      }

      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }

      if (resource.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      res.status(500).json({ error: "Server error" });
    }
  };
};

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  ensureOwnership,
};
