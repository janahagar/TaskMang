import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';
import { useNavigate } from "react-router-dom";
import { FaPencilAlt, FaTrashAlt } from "react-icons/fa";

const API_BASE_URL =
  "https://ec4rjesbcg.execute-api.eu-north-1.amazonaws.com/prod";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const colors = {
  primary: "#2980b9",
  primaryLight: "#7fb3d5",
  danger: "#e74c3c",
  grayDark: "#34495e",
  grayLight: "#f7f9fc",
  borderGray: "#e1e4e8",
  errorBg: "#fdecea",
  errorText: "#c0392b",
};

function TaskDashboard() {
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    file: null,
    fileName: "",
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({
    title: "",
    description: "",
    dueDate: "",
    file: null,
    fileName: "",
  });
  const [editUploadingFile, setEditUploadingFile] = useState(false);

  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Invalid date";
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getToken = async (retryCount = 0) => {
    try {
      let token = localStorage.getItem("authToken");
      if (!token || retryCount > 0) {
        const session = await fetchAuthSession();
        token = session.tokens.idToken.toString();
        localStorage.setItem("authToken", token);
      }
      return token;
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * 2 ** retryCount;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return getToken(retryCount + 1);
      }
      localStorage.removeItem("authToken");
      navigate("/signin");
      throw new Error("Session expired. Please sign in again.");
    }
  };

  const fetchTasks = async () => {
    try {
      setError(null);
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data.tasks || []);
    } catch (err) {
      setError("Failed to fetch tasks: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        const name = user.attributes?.name || user.username || "User";
        setUserName(name);
      })
      .catch(() => setUserName("User"));

    fetchTasks();
  }, []);

  const uploadFileToS3 = async (file) => {
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve(
            `https://taskmanager-files-cloudproj.s3.amazonaws.com/${encodeURIComponent(
              file.name
            )}`
          ),
        1500
      );
    });
  };

  const createTask = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newTask.title || !newTask.description) {
      setError("Title and description are required");
      return;
    }

    try {
      setUploadingFile(true);
      let fileUrl = undefined;
      if (newTask.file) {
        fileUrl = await uploadFileToS3(newTask.file);
      }
      setUploadingFile(false);

      const token = await getToken();
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate || undefined,
        fileUrl,
      };

      const response = await axios.post(`${API_BASE_URL}/tasks`, taskData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.task) {
        setTasks((prevTasks) => [...prevTasks, response.data.task]);
        setNewTask({ title: "", description: "", dueDate: "", file: null, fileName: "" });
        setShowCreateForm(false);
      } else {
        setError("Received invalid response from server");
      }
    } catch (err) {
      setUploadingFile(false);
      if (err.response) {
        setError(
          `Failed to create task: ${err.response.data.error || err.response.statusText}`
        );
      } else if (err.request) {
        setError(
          "Failed to create task: No response from server. Please check your internet connection."
        );
      } else {
        setError(`Failed to create task: ${err.message}`);
      }
    }
  };

  // This is the missing function causing the error:
  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    setEditTaskData((prev) => ({
      ...prev,
      file,
      fileName: file ? file.name : "",
    }));
  };

  const startEditing = (task) => {
    setEditingTaskId(task.taskId);
    setExpandedTaskId(null);
    setEditTaskData({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate || "",
      file: null,
      fileName: "",
    });
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditTaskData({ title: "", description: "", dueDate: "", file: null, fileName: "" });
  };

  const saveEditTask = async () => {
    setError(null);
    try {
      setEditUploadingFile(true);
      let fileUrl = editTaskData.fileUrl || undefined;
      if (editTaskData.file) {
        fileUrl = await uploadFileToS3(editTaskData.file);
      }
      setEditUploadingFile(false);

      const token = await getToken();
      const updateData = {
        title: editTaskData.title,
        description: editTaskData.description,
        dueDate: editTaskData.dueDate || undefined,
        fileUrl,
      };

      const response = await axios.put(`${API_BASE_URL}/tasks/${editingTaskId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.task) {
        setTasks((tasks) =>
          tasks.map((t) => (t.taskId === editingTaskId ? response.data.task : t))
        );
        cancelEditing();
      } else {
        setError("Invalid response from server during update.");
      }
    } catch (err) {
      setEditUploadingFile(false);
      setError("Failed to update task: " + (err.message || "Unknown error"));
    }
  };

  const deleteTask = async (taskId) => {
    setError(null);
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((tasks) => tasks.filter((task) => task.taskId !== taskId));
      if (expandedTaskId === taskId) setExpandedTaskId(null);
      if (editingTaskId === taskId) cancelEditing();
    } catch (err) {
      setError("Failed to delete task: " + (err.message || "Unknown error"));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <div
          className="loading-spinner"
          style={{
            border: "5px solid #f3f3f3",
            borderTop: `5px solid ${colors.primary}`,
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            animation: "spin 1s linear infinite",
            margin: "0 auto 25px",
          }}
        />
        <p style={{ color: "#666", fontSize: "18px" }}>Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        margin: 0,
        padding: "20px 40px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "transparent",
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header: greeting + plus button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
          width: "100%",
        }}
      >
        <h2
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: colors.grayDark,
            margin: 0,
            flexGrow: 1,
          }}
        >
          Hello, {userName} 👋
        </h2>

        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              fontSize: 30,
              borderRadius: "50%",
              width: 56,
              height: 56,
              border: "none",
              backgroundColor: colors.primary,
              color: "white",
              cursor: "pointer",
              lineHeight: 1,
              fontWeight: "bold",
              marginLeft: 20,
              flexShrink: 0,
              boxShadow: "0 4px 10px rgba(41, 128, 185, 0.6)",
              transition: "background-color 0.3s ease",
            }}
            aria-label="Create new task"
            title="Create new task"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.primaryLight)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
          >
            +
          </button>
        )}
      </div>

      {/* Create task form */}
      {showCreateForm && (
        <div
          style={{
            width: "100%",
            padding: 24,
            marginBottom: 40,
            borderRadius: 0,
            boxShadow: "none",
            backgroundColor: "transparent",
            alignSelf: "stretch",
          }}
        >
          <form onSubmit={createTask}>
            {/* Task Name */}
            <label
              htmlFor="title"
              style={{ display: "block", marginBottom: 8, color: colors.grayDark, fontWeight: 600 }}
            >
              Task Name
            </label>
            <input
              id="title"
              type="text"
              placeholder="Enter task title"
              value={newTask.title}
              onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
              style={{
                width: "100%",
                padding: "14px 18px",
                border: `1px solid #ccc`,
                borderRadius: 4,
                fontSize: 16,
                marginBottom: 20,
                boxSizing: "border-box",
              }}
              required
            />

            {/* Description */}
            <label
              htmlFor="description"
              style={{ display: "block", marginBottom: 8, color: colors.grayDark, fontWeight: 600 }}
            >
              Description
            </label>
            <textarea
              id="description"
              placeholder="Enter task description"
              value={newTask.description}
              onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
              style={{
                width: "100%",
                padding: "14px 18px",
                border: `1px solid #ccc`,
                borderRadius: 4,
                minHeight: 120,
                fontSize: 16,
                marginBottom: 20,
                resize: "vertical",
                boxSizing: "border-box",
              }}
              required
            />

            {/* Due Date */}
            <label
              htmlFor="dueDate"
              style={{ display: "block", marginBottom: 8, color: colors.grayDark, fontWeight: 600 }}
            >
              Due Date (optional)
            </label>
            <input
              id="dueDate"
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
              min={getMinDate()}
              style={{
                width: "100%",
                padding: "14px 18px",
                border: `1px solid #ccc`,
                borderRadius: 4,
                fontSize: 16,
                marginBottom: 20,
                boxSizing: "border-box",
              }}
            />

            {/* File Attach */}
            <label
              htmlFor="file"
              style={{ display: "block", marginBottom: 8, color: colors.grayDark, fontWeight: 600 }}
            >
              Attach File (optional)
            </label>
            <input
              id="file"
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                setNewTask((prev) => ({
                  ...prev,
                  file,
                  fileName: file ? file.name : "",
                }));
              }}
              style={{ marginBottom: 20, width: "100%" }}
            />
            {newTask.fileName && (
              <div style={{ marginBottom: 20, fontSize: 14, color: "#555" }}>
                Selected file: <strong>{newTask.fileName}</strong>
              </div>
            )}

            {/* Buttons */}
            <button
              type="submit"
              disabled={uploadingFile}
              style={{
                backgroundColor: uploadingFile ? colors.primaryLight : colors.primary,
                color: "white",
                padding: 14,
                border: "none",
                borderRadius: 8,
                cursor: uploadingFile ? "not-allowed" : "pointer",
                fontSize: 18,
                fontWeight: 700,
                width: "100%",
                transition: "background-color 0.3s ease",
              }}
            >
              {uploadingFile ? "Uploading file..." : "Create Task"}
            </button>

            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              style={{
                marginTop: 10,
                padding: "14px 18px",
                backgroundColor: "#bdc3c7",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                width: "100%",
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Task List */}
      <div
        style={{
          width: "100%",
          margin: 0,
          flexGrow: 1,
        }}
      >
        {tasks.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", fontSize: 18, marginTop: 30 }}>
            No tasks yet. Create your first task by clicking the + button above!
          </p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.taskId}
              task={task}
              colors={colors}
              formatDate={formatDate}
              getMinDate={getMinDate}
              expandedTaskId={expandedTaskId}
              setExpandedTaskId={setExpandedTaskId}
              editingTaskId={editingTaskId}
              startEditing={startEditing}
              cancelEditing={cancelEditing}
              editTaskData={editTaskData}
              setEditTaskData={setEditTaskData}
              saveEditTask={saveEditTask}
              deleteTask={deleteTask}
              setEditingTaskId={setEditingTaskId}
              editUploadingFile={editUploadingFile}
              handleEditFileChange={handleEditFileChange}  // <-- Pass here!
            />
          ))
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: 30,
            padding: 15,
            backgroundColor: colors.errorBg,
            borderRadius: 8,
            color: colors.errorText,
            textAlign: "center",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          {error}
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

function TaskItem({
  task,
  colors,
  formatDate,
  getMinDate,
  expandedTaskId,
  setExpandedTaskId,
  editingTaskId,
  startEditing,
  cancelEditing,
  editTaskData,
  setEditTaskData,
  saveEditTask,
  deleteTask,
  setEditingTaskId,
  editUploadingFile,
  handleEditFileChange,  // <-- Accept here!
}) {
  const isExpanded = expandedTaskId === task.taskId;
  const isEditing = editingTaskId === task.taskId;

  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (isExpanded) setExpandedTaskId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded, setExpandedTaskId]);

  return (
    <div
      style={{
        padding: "15px 0",
        marginBottom: 20,
        borderBottom: `1px solid ${colors.borderGray}`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Task content on the left */}
      <div style={{ flex: 1, paddingRight: 20 }}>
        {isEditing ? (
          <div>
            <input
              type="text"
              value={editTaskData.title}
              onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
              style={{ width: "100%", marginBottom: 8, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <textarea
              value={editTaskData.description}
              onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
              style={{ width: "100%", marginBottom: 8, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              rows={3}
            />
            <input
              type="date"
              value={editTaskData.dueDate}
              min={getMinDate()}
              onChange={(e) => setEditTaskData({ ...editTaskData, dueDate: e.target.value })}
              style={{ marginBottom: 8, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <input
              type="file"
              onChange={handleEditFileChange}
              style={{ marginBottom: 8 }}
            />
            {editTaskData.fileName && <div style={{ marginBottom: 8 }}>Selected file: {editTaskData.fileName}</div>}
            <button onClick={saveEditTask} disabled={editUploadingFile} style={{ marginRight: 8, padding: "8px 16px" }}>
              {editUploadingFile ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                cancelEditing();
                setEditingTaskId(null);
              }}
              style={{ padding: "8px 16px" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ color: colors.grayDark, marginBottom: 10, fontWeight: 700 }}>{task.title}</h3>
            <p style={{ color: "#555", marginBottom: 10, fontSize: 16, lineHeight: 1.4 }}>{task.description}</p>
            <p
              style={{
                color: "#777",
                fontSize: "0.9em",
                backgroundColor: colors.grayLight,
                padding: "6px 12px",
                borderRadius: 6,
                display: "inline-block",
                marginBottom: 15,
                fontWeight: 600,
              }}
            >
              Due: {formatDate(task.dueDate)}
            </p>
            {task.fileUrl && (
              <p style={{ fontSize: "0.9em", marginBottom: 15 }}>
                📎{" "}
                <a href={task.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>
                  View attached file
                </a>
              </p>
            )}
          </>
        )}
      </div>

      {/* Dots button + dropdown menu */}
      <div style={{ position: "relative" }} ref={menuRef}>
        <button
          onClick={() => setExpandedTaskId(isExpanded ? null : task.taskId)}
          aria-label="Toggle task options"
          title={isExpanded ? "Hide options" : "Show options"}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 28,
            lineHeight: 1,
            userSelect: "none",
            color: colors.primary,
            padding: '4px 12px',
          }}
        >
          &#8942; {/* vertical ellipsis */}
        </button>

        {isExpanded && !isEditing && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "110%",
              backgroundColor: "white",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              borderRadius: 10,
              zIndex: 10,
              minWidth: 150,
              display: "flex",
              flexDirection: "column",
              padding: '8px 0',
              animation: "fadeInScale 0.2s ease forwards",
            }}
          >
            <button
              onClick={() => {
                startEditing(task);
                setExpandedTaskId(null);
              }}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                border: "none",
                background: "none",
                textAlign: "left",
                fontWeight: 600,
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6f0fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FaPencilAlt /> Edit
            </button>
            <button
              onClick={() => {
                deleteTask(task.taskId);
                setExpandedTaskId(null);
              }}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                border: "none",
                background: "none",
                textAlign: "left",
                fontWeight: 600,
                color: colors.danger,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdecea'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FaTrashAlt /> Delete
            </button>

            <style>{`
              @keyframes fadeInScale {
                0% {
                  opacity: 0;
                  transform: scale(0.95);
                }
                100% {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDashboard;
