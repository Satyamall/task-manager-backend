const pool = require("../config/db");

const createTask = async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const userId = req.user.id; // From JWT middleware
    const [rows] = await pool.query(
      "INSERT INTO tasks (title, description, status, user_id) VALUES (?, ?, ?, ?)",
      [title, description, status || "Pending", userId]
    );
    res.status(201).json({ message: "Task created", taskId: rows.insertId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating task", error: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    let query = `
      SELECT tasks.id, tasks.title, tasks.description, tasks.status, tasks.user_id, users.avatar_url
      FROM tasks
      INNER JOIN users ON tasks.user_id = users.id
    `;
    let params = [];

    if (req.user.role !== "admin") {
      query += " WHERE tasks.user_id = ?";
      params.push(req.user.id);
    }

    const [rows] = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    if (rows.length === 0 && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await pool.query(
      "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?",
      [title, description, status, id]
    );
    res.json({ message: "Task updated" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating task", error: error.message });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    if (rows.length === 0 && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
    res.json({ message: "Task deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting task", error: error.message });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
