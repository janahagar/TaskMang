import React, { useState } from "react";
import { createTask } from "../utils/api";

function TaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Helper to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1]; // Remove data prefix
        resolve({ base64, fileName: file.name });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadMessage("");

    try {
      let taskData = { title, description, dueDate };

      if (file) {
        const { base64, fileName } = await convertFileToBase64(file);
        taskData.fileName = fileName;
        taskData.fileContentBase64 = base64;
      }

      const response = await createTask(taskData);

      if (response && response.data && response.data.task) {
        setUploadMessage("Task and file uploaded successfully!");
      } else {
        setUploadMessage("Task created, but no response from server.");
      }

      setTitle("");
      setDescription("");
      setDueDate("");
      setFile(null);
    } catch (error) {
      console.error("Error creating task:", error);
      setUploadMessage("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h2>Create New Task</h2>

      <label>
        Title
        <input
          type="text"
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <label>
        Description
        <textarea
          placeholder="Enter task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>

      <label>
        Due Date
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <small>Optional: Select a due date for your task</small>
      </label>

      <label>
        Attachment (optional)
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.docx,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          style={{
            display: "block",
            marginTop: "0.5rem",
            padding: "0.3rem",
            border: "1px solid #ccc",
            background: "white",
            color: "black"
          }}
        />
      </label>

      <button type="submit" disabled={isUploading}>
        {isUploading ? "Uploading..." : "Create Task"}
      </button>

      {uploadMessage && <p>{uploadMessage}</p>}
    </form>
  );
}

export default TaskForm;