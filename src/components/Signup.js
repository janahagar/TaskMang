import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUp } from '@aws-amplify/auth';

function SignUp() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!password) {
      setError("Password cannot be empty.");
      setLoading(false);
      return;
    }
    if (password !== password.trim()) {
      setError("Password cannot start or end with spaces.");
      setLoading(false);
      return;
    }

    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: name,
        password,
        options: {
          userAttributes: {
            email,
            name
          },
          autoSignIn: false
        }
      });

      if (isSignUpComplete) {
        alert("Sign-up successful! Please sign in.");
        navigate("/signin");
      } else if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        localStorage.setItem("email", name); // store name as username
        navigate("/confirm");
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "40px 20px",
        textAlign: "center",
        maxWidth: "400px",
        margin: "0 auto",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div className="loading-spinner" style={{
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px"
        }}></div>
        <p style={{ color: "#666" }}>Creating your account...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "40px 30px",
      maxWidth: "400px",
      margin: "0 auto",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ 
        textAlign: "center", 
        color: "#2c3e50",
        marginBottom: "30px",
        fontSize: "24px"
      }}>Create Account</h2>
      <form onSubmit={handleSignUp}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            color: "#34495e",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              transition: "border-color 0.3s",
              outline: "none"
            }}
            onFocus={e => e.target.style.borderColor = "#3498db"}
            onBlur={e => e.target.style.borderColor = "#ddd"}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            color: "#34495e",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            Username
          </label>
          <input
            type="text"
            placeholder="Choose a username"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              transition: "border-color 0.3s",
              outline: "none"
            }}
            onFocus={e => e.target.style.borderColor = "#3498db"}
            onBlur={e => e.target.style.borderColor = "#ddd"}
          />
        </div>
        <div style={{ marginBottom: "25px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            color: "#34495e",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              transition: "border-color 0.3s",
              outline: "none"
            }}
            onFocus={e => e.target.style.borderColor = "#3498db"}
            onBlur={e => e.target.style.borderColor = "#ddd"}
          />
        </div>
        <button 
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
            transition: "background-color 0.3s",
            marginBottom: "20px"
          }}
          onMouseOver={e => e.target.style.backgroundColor = "#2980b9"}
          onMouseOut={e => e.target.style.backgroundColor = "#3498db"}
        >
          Sign Up
        </button>
      </form>
      {error && (
        <div style={{ 
          marginTop: "20px",
          padding: "12px",
          backgroundColor: "#fee",
          borderRadius: "4px",
          color: "#e74c3c",
          fontSize: "14px",
          textAlign: "center"
        }}>
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

export default SignUp; 