import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';
import { useNavigate } from "react-router-dom";
import { FaPencilAlt, FaTrashAlt, FaPlus, FaFileUpload, FaCheckCircle, FaClock, FaCalendarAlt, FaTasks, FaExclamationCircle } from "react-icons/fa";
import SearchAndFilter from './SearchAndFilter';
import TaskAnalytics from './TaskAnalytics';
import { getTasks, createTask as createTaskAPI, updateTask as updateTaskAPI, deleteTask as deleteTaskAPI } from '../utils/api';

const API_BASE_URL = "https://ec4rjesbcg.execute-api.eu-north-1.amazonaws.com/prod";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const colors = {
  primary: "#3b82f6",
  primaryLight: "#dbeafe",
  secondary: "#10b981",
  secondaryLight: "#d1fae5",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  grayDark: "#374151",
  grayLight: "#f9fafb",
  borderGray: "#e5e7eb",
  white: "#ffffff",
};

function EnhancedTaskDashboard() {
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    status: "pending",
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
    priority: "medium",
    status: "pending",
    file: null,
    fileName: "",
  });
  const [editUploadingFile, setEditUploadingFile] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

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
      console.log("Response from server:", response.data); // Debug log
      setTasks(response.data.tasks || []);
      setFilteredTasks(response.data.tasks || []);
    } catch (err) {
      setError("Failed to fetch tasks: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyLocalFilters = (tasksData, filterParams) => {
    let filtered = [...tasksData];

    // Apply search filter
    if (filterParams.search) {
      const searchTerm = filterParams.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterParams.status) {
      filtered = filtered.filter(task => task.status === filterParams.status);
    }

    // Apply priority filter
    if (filterParams.priority) {
      filtered = filtered.filter(task => task.priority === filterParams.priority);
    }

    // Apply date range filters
    if (filterParams.dueDateFrom || filterParams.dueDateTo) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        const fromDate = filterParams.dueDateFrom ? new Date(filterParams.dueDateFrom) : null;
        const toDate = filterParams.dueDateTo ? new Date(filterParams.dueDateTo) : null;
        
        if (fromDate && taskDate < fromDate) return false;
        if (toDate && taskDate > toDate) return false;
        return true;
      });
    }

    // Apply sorting
    const sortBy = filterParams.sortBy || 'dueDate';
    const sortOrder = filterParams.sortOrder || 'asc';
    
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle date sorting
      if (sortBy === 'dueDate' || sortBy === 'createdAt') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }
      
      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'desc' ? -result : result;
    });

    setFilteredTasks(filtered);
  };

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    applyLocalFilters(tasks, newFilters);
    
    // Debounce API calls for performance - only if filters are actually meaningful
    const hasSignificantFilters = newFilters.search || newFilters.status || newFilters.priority;
    if (hasSignificantFilters) {
      const debounceTimer = setTimeout(() => {
        fetchTasks();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [tasks]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        const name = user.attributes?.name || user.username || "User";
        setUserName(name);
      })
      .catch(() => setUserName("User"));

    fetchTasks();
  }, []);

  const createTask = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newTask.title || !newTask.description) {
      setError("Title and description are required");
      return;
    }

    try {
      setUploadingFile(true);

      const token = await getToken();
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        status: "pending"
      };

      // Only add dueDate if it's provided
      if (newTask.dueDate) {
        taskData.dueDate = newTask.dueDate;
      }

      // Handle file upload as base64 if file is selected
      if (newTask.file) {
        try {
          const fileContentBase64 = await convertFileToBase64(newTask.file);
          taskData.fileName = newTask.file.name;
          taskData.fileContentBase64 = fileContentBase64;
        } catch (fileError) {
          setUploadingFile(false);
          setError("Failed to process file: " + fileError.message);
          return;
        }
      }

      setUploadingFile(false);

      console.log("Sending task data:", taskData); // Debug log

      const response = await axios.post(`${API_BASE_URL}/tasks`, taskData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response from server:", response.data); // Debug log

      if (response.data && response.data.task) {
        setTasks((prevTasks) => [...prevTasks, response.data.task]);
        applyLocalFilters([...tasks, response.data.task], filters);
        setNewTask({ 
          title: "", 
          description: "", 
          dueDate: "", 
          file: null, 
          fileName: "" 
        });
        setShowCreateForm(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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

  // Helper function to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:mime-type;base64, prefix to get just the base64 content
        const base64Content = reader.result.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    setEditTaskData((prev) => ({
      ...prev,
      file,
      fileName: file ? file.name : "",
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewTask((prev) => ({
      ...prev,
      file,
      fileName: file ? file.name : "",
    }));
  };

  const startEditing = (task) => {
    console.log("Starting edit for task:", task); // Debug log
    setEditingTaskId(task.taskId);
    setExpandedTaskId(null);
    setEditTaskData({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate || "",
      priority: task.priority || "medium",
      file: null,
      fileName: "",
    });
    setError(null); // Clear any previous errors
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditTaskData({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      file: null,
      fileName: "",
    });
  };

  const saveEditTask = async () => {
    if (!editTaskData.title || !editTaskData.description) {
      setError("Title and description are required");
      return;
    }

    try {
      setEditUploadingFile(true);

      const token = await getToken();
      const updateData = {
        title: editTaskData.title,
        description: editTaskData.description,
        priority: editTaskData.priority || "medium",
      };

      // Only add dueDate if it's provided, otherwise send empty string to clear it
      if (editTaskData.dueDate) {
        updateData.dueDate = editTaskData.dueDate;
      }

      // Handle file upload as base64 if file is selected
      if (editTaskData.file) {
        try {
          const fileContentBase64 = await convertFileToBase64(editTaskData.file);
          updateData.fileName = editTaskData.file.name;
          updateData.fileContentBase64 = fileContentBase64;
        } catch (fileError) {
          setEditUploadingFile(false);
          setError("Failed to process file: " + fileError.message);
          return;
        }
      }

      setEditUploadingFile(false);

      console.log("Sending update data:", updateData); // Debug log

      const response = await axios.put(`${API_BASE_URL}/tasks/${editingTaskId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Update response from server:", response.data); // Debug log

      // Check for the task in the response (could be in response.data.task or response.data directly)
      const updatedTask = response.data.task || response.data.Attributes || response.data;
      
      if (updatedTask && updatedTask.taskId) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.taskId === editingTaskId ? updatedTask : task
          )
        );
        applyLocalFilters(
          tasks.map((task) =>
            task.taskId === editingTaskId ? updatedTask : task
          ),
          filters
        );
        cancelEditing();
        setError(null); // Clear any previous errors
      } else {
        console.error("Invalid response structure:", response.data);
        setError("Invalid response from server during update.");
      }
    } catch (err) {
      setEditUploadingFile(false);
      console.error("Update error:", err);
      
      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.error || err.response.data?.message || err.response.statusText;
        setError(`Failed to update task: ${errorMessage}`);
      } else if (err.request) {
        // Request was made but no response received
        setError("Failed to update task: No response from server. Please check your internet connection.");
      } else {
        // Something else happened
        setError(`Failed to update task: ${err.message}`);
      }
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedTasks = tasks.filter((task) => task.taskId !== taskId);
      setTasks(updatedTasks);
      applyLocalFilters(updatedTasks, filters);
      if (expandedTaskId === taskId) setExpandedTaskId(null);
      if (editingTaskId === taskId) cancelEditing();
    } catch (err) {
      setError("Failed to delete task: " + (err.message || "Unknown error"));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return colors.danger;
      case 'high': return colors.warning;
      case 'medium': return colors.primary;
      case 'low': return colors.secondary;
      default: return colors.grayDark;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return colors.secondary;
      case 'in-progress': return colors.primary;
      case 'pending': return colors.warning;
      case 'overdue': return colors.danger;
      default: return colors.grayDark;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <FaCheckCircle />;
      case 'in-progress': return <FaClock />;
      case 'pending': return <FaCalendarAlt />;
      case 'overdue': return <FaExclamationCircle />;
      default: return <FaTasks />;
    }
  };

  const TaskCard = ({ task }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
    const isExpanded = expandedTaskId === task.taskId;
    const isEditing = editingTaskId === task.taskId;
    
    return (
      <div style={{
        background: colors.white,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${isOverdue ? colors.dangerLight : colors.borderGray}`,
        transition: 'all 0.2s ease',
        position: 'relative',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)';
      }}
      onClick={() => setExpandedTaskId(isExpanded ? null : task.taskId)}>
        
        {/* Priority indicator */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '4px',
          height: '100%',
          backgroundColor: getPriorityColor(task.priority),
          borderRadius: '12px 0 0 12px'
        }} />
        
        {isEditing ? (
          // Edit Mode
          <div onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: colors.grayDark }}>
                Title *
              </label>
              <input
                type="text"
                value={editTaskData.title}
                onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.borderGray}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: colors.grayDark }}>
                Description *
              </label>
              <textarea
                value={editTaskData.description}
                onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  border: `1px solid ${colors.borderGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: colors.grayDark }}>
                Due Date
              </label>
              <input
                type="date"
                value={editTaskData.dueDate}
                onChange={(e) => setEditTaskData({ ...editTaskData, dueDate: e.target.value })}
                min={getMinDate()}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.borderGray}`,
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: colors.grayDark }}>
                Priority
              </label>
              <select
                value={editTaskData.priority}
                onChange={(e) => setEditTaskData({ ...editTaskData, priority: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.borderGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: colors.grayDark }}>
                Attach File (Optional)
              </label>
              <input
                ref={editFileInputRef}
                type="file"
                onChange={handleEditFileChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.borderGray}`,
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              {editTaskData.fileName && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: colors.primary }}>
                  Selected: {editTaskData.fileName}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={saveEditTask}
                disabled={editUploadingFile}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: colors.secondary,
                  color: 'white',
                  cursor: editUploadingFile ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: editUploadingFile ? 0.7 : 1
                }}
              >
                {editUploadingFile ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={cancelEditing}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: `1px solid ${colors.borderGray}`,
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: colors.grayDark,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600', 
                color: colors.grayDark,
                flex: 1,
                marginRight: '12px'
              }}>
                {task.title}
              </h3>
              
              {/* Action Buttons */}
              {isExpanded && (
                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      startEditing(task);
                      setExpandedTaskId(null);
                    }}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: colors.primaryLight,
                      color: colors.primary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    <FaPencilAlt size={10} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      deleteTask(task.taskId);
                      setExpandedTaskId(null);
                    }}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: colors.dangerLight,
                      color: colors.danger,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    <FaTrashAlt size={10} /> Delete
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5',
              ...(isExpanded ? {} : {
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              })
            }}>
              {task.description}
            </p>

            {/* Metadata */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {/* Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: getStatusColor(task.status) + '20',
                color: getStatusColor(task.status),
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {getStatusIcon(task.status)}
                {task.status || 'pending'}
              </div>

              {/* Priority */}
              {task.priority && (
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: getPriorityColor(task.priority) + '20',
                  color: getPriorityColor(task.priority),
                  fontSize: '12px',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {task.priority} Priority
                </div>
              )}
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: isOverdue ? colors.dangerLight : colors.grayLight,
                borderRadius: '6px',
                fontSize: '13px',
                color: isOverdue ? colors.danger : colors.grayDark,
                fontWeight: '500',
                marginBottom: '12px'
              }}>
                <FaCalendarAlt />
                {isOverdue ? 'Overdue: ' : 'Due: '}{formatDate(task.dueDate)}
              </div>
            )}

            {/* File Attachment */}
            {task.attachmentUrl && (
              <div style={{ marginTop: '12px' }}>
                <a
                  href={task.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: colors.primaryLight,
                    color: colors.primary,
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  <FaFileUpload />
                  View Attachment
                </a>
              </div>
            )}

            {/* Click hint */}
            <div style={{ 
              marginTop: '16px', 
              textAlign: 'center', 
              fontSize: '12px', 
              color: '#9ca3af',
              opacity: isExpanded ? 0 : 1,
              transition: 'opacity 0.2s ease'
            }}>
              Click to {isExpanded ? 'collapse' : 'expand'}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading && tasks.length === 0) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        background: colors.grayLight,
        minHeight: '100vh'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <div style={{
            background: colors.white,
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ fontSize: '18px', color: colors.grayDark, marginBottom: '16px' }}>
              Loading your tasks...
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              border: `3px solid ${colors.primaryLight}`,
              borderTop: `3px solid ${colors.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      background: colors.grayLight,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        color: 'white',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
          Welcome back, {userName}! 👋
        </h1>
        <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
          Ready to tackle your tasks? Let's make today productive!
        </p>
      </div>

      {/* Analytics */}
      <TaskAnalytics tasks={filteredTasks} />

      {/* Search and Filters */}
      <SearchAndFilter onFiltersChange={handleFiltersChange} currentFilters={filters} />

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        background: colors.white,
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        border: `1px solid ${colors.borderGray}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: colors.grayDark }}>
            Your Tasks ({filteredTasks.length})
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 12px',
                border: `1px solid ${viewMode === 'grid' ? colors.primary : colors.borderGray}`,
                borderRadius: '6px',
                backgroundColor: viewMode === 'grid' ? colors.primary : 'white',
                color: viewMode === 'grid' ? 'white' : colors.grayDark,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px',
                border: `1px solid ${viewMode === 'list' ? colors.primary : colors.borderGray}`,
                borderRadius: '6px',
                backgroundColor: viewMode === 'list' ? colors.primary : 'white',
                color: viewMode === 'list' ? 'white' : colors.grayDark,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              List
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
        >
          <FaPlus /> Create New Task
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: colors.dangerLight,
          border: `1px solid ${colors.danger}`,
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: colors.danger,
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}

      {/* Tasks Grid/List */}
      {filteredTasks.length === 0 ? (
        <div style={{
          background: colors.white,
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: `1px solid ${colors.borderGray}`
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: colors.grayDark }}>
            No tasks found
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>
            {tasks.length === 0 
              ? "Create your first task to get started!" 
              : "Try adjusting your filters to see more tasks."}
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <FaPlus /> Create Your First Task
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'grid' 
            ? 'repeat(auto-fill, minmax(350px, 1fr))' 
            : '1fr',
          gap: '20px'
        }}>
          {filteredTasks.map((task) => (
            <TaskCard key={task.taskId} task={task} />
          ))}
        </div>
      )}

      {/* Create Task Modal - placeholder for now */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: colors.white,
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '600', color: colors.grayDark }}>
              Create New Task
            </h2>
            <form onSubmit={createTask}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: colors.grayDark }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.borderGray}`,
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter task title..."
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: colors.grayDark }}>
                  Description *
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: `1px solid ${colors.borderGray}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter task description..."
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: colors.grayDark }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  min={getMinDate()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.borderGray}`,
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: colors.grayDark }}>
                  Attach File (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.borderGray}`,
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {newTask.fileName && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: colors.primary }}>
                    Selected: {newTask.fileName}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: `1px solid ${colors.borderGray}`,
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: colors.grayDark,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: colors.primary,
                    color: 'white',
                    cursor: uploadingFile ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: uploadingFile ? 0.7 : 1
                  }}
                >
                  {uploadingFile ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedTaskDashboard; 