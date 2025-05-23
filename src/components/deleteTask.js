import React from "react";
import { deleteTask } from "../utils/api";

function TaskDeleteButton({ taskId }) {
  const handleDelete = async () => {
    try {
      await deleteTask(taskId);
      console.log("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return <button onClick={handleDelete}>Delete Task</button>;
}

export default TaskDeleteButton;
 