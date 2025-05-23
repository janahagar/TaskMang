import React, { useState, useEffect } from "react";
import { createTask, getTasks } from "../utils/api";

function TaskDebugger() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Helper to format ISO dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch tasks on component mount and after task creation
  const fetchTasks = async () => {
    try {
      setError(null);
      setLastAction("Fetching tasks...");
      setLoading(true);
      const response = await getTasks();
      setTasks(response.data.tasks || []);
      setLastAction("Successfully fetched tasks");
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError(error.message);
      setLastAction("Error fetching tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    try {
      setError(null);
      setLastAction("Creating task...");
      setCreating(true);

      // Prepare task data
      // Note: Your createTask util must handle file upload (e.g. via FormData or presigned URL)
      const taskData = { title, description, dueDate, file };

      const response = await createTask(taskData);
      setLastAction("Task created successfully");

      // Clear form
      setTitle("");
      setDescription("");
      setDueDate("");
      setFile(null);

      // Refresh tasks list
      await fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      setError(error.message);
      setLastAction("Error creating task");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h2>Task Debugger</h2>

      {/* Create Task Form */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Create New Task</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                marginBottom: "10px",
                padding: "8px",
                width: "100%",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              disabled={creating}
            />
          </div>
          <div>
            <textarea
              placeholder="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{
                marginBottom: "10px",
                padding: "8px",
                width: "100%",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                minHeight: "100px",
                resize: "vertical",
              }}
              disabled={creating}
            />
          </div>
          <div>
            <label htmlFor="dueDate">Due Date (optional):</label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                marginBottom: "10px",
                padding: "8px",
                width: "100%",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              disabled={creating}
            />
          </div>
          <div>
            <label htmlFor="file">Attach File (optional):</label>
            <input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ marginBottom: "10px", width: "100%" }}
              disabled={creating}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            style={{
              padding: "12px 20px",
              fontSize: "18px",
              fontWeight: "bold",
              backgroundColor: creating ? "#7fb3d5" : "#2980b9",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: creating ? "not-allowed" : "pointer",
              width: "100%",
            }}
          >
            {creating ? "Creating task..." : "Create Task"}
          </button>
        </form>
      </div>

      {/* Status Display */}
      {lastAction && (
        <div
          style={{
            margin: "10px 0",
            padding: "10px",
            background: "#f0f0f0",
            borderRadius: "4px",
          }}
        >
          Last Action: {lastAction}
        </div>
      )}
      {error && (
        <div
          style={{
            margin: "10px 0",
            padding: "10px",
            background: "#ffe6e6",
            borderRadius: "4px",
            color: "#c0392b",
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Tasks List */}
      <div>
        <h3>Tasks List</h3>
        <button
          onClick={fetchTasks}
          disabled={loading}
          style={{
            marginBottom: "15px",
            padding: "8px 15px",
            fontSize: "16px",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Refresh Tasks
        </button>
        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks found</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {tasks.map((task) => (
              <li
                key={task.taskId}
                style={{
                  margin: "10px 0",
                  padding: "15px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                }}
              >
                <h4>{task.title}</h4>
                <p>{task.description}</p>
                <div style={{ fontSize: "0.85em", color: "#666" }}>
                  <div>ID: {task.taskId}</div>
                  <div>Created By: {task.createdBy || "N/A"}</div>
                  <div>Status: {task.status || "N/A"}</div>
                  <div>Created At: {formatDate(task.createdAt)}</div>
                  <div>Due Date: {task.dueDate ? formatDate(task.dueDate) : "N/A"}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TaskDebugger;
