import React from "react";
import { Link } from "react-router-dom";
import personImg from "../assets/person-task.png"; // <-- update path if needed

const Home = () => (
  <div style={{
    minHeight: "80vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f7f7f7"
  }}>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "60px",
      background: "#f7f7f7",
      padding: "40px 60px",
      borderRadius: "24px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.07)"
    }}>
      {/* Left Side */}
      <div>
        <h1 style={{ fontSize: "2.8rem", margin: 0, fontWeight: 400, color: "#222" }}>
          Task <span style={{ fontWeight: 700 }}>Management</span>
        </h1>
        <p style={{ color: "#666", margin: "18px 0 32px 0", maxWidth: 400 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link to="/signin">
            <button style={{
              padding: "12px 32px",
              background: "#444",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
              Sign In
            </button>
          </Link>
          <Link to="/signup">
            <button style={{
              padding: "12px 32px",
              background: "#fff",
              color: "#444",
              border: "2px solid #444",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              marginLeft: "8px"
            }}>
              Sign Up
            </button>
          </Link>
        </div>
      </div>
      {/* Right Side */}
      <img 
        src={personImg} 
        alt="Task Management Illustration" 
        style={{ width: "260px", maxWidth: "40vw", borderRadius: "16px" }} 
      />
    </div>
  </div>
);

export default Home;