const express = require("express");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const router = express.Router();

router.use(authMiddleware);
router.post("/", createTask);
router.get("/", getTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
