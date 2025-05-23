import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { confirmSignUp, resendSignUpCode } from '@aws-amplify/auth';

function Confirm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const username = localStorage.getItem("email"); // now this is actually the 'name'

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!code || code.trim() === "") {
      setError("Please enter the verification code.");
      return;
    }
    if (!username) {
      setError("Username not found. Please sign up again.");
      return;
    }

    setLoading(true);
    try {
      await confirmSignUp({
        username,
        confirmationCode: code
      });
      
      alert("Account confirmed successfully!");
      navigate("/signin");
    } catch (err) {
      console.error("Confirmation error:", err);
      setError(err.message || "An error occurred during confirmation");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!username) {
      setError("Username not found. Please sign up again.");
      return;
    }

    setLoading(true);
    try {
      await resendSignUpCode({ username });
      alert("Confirmation code resent! Please check your email.");
      setError("");
    } catch (err) {
      console.error("Resend confirmation code error:", err);
      setError(err.message || "An error occurred while resending the code");
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
        <p style={{ color: "#666" }}>Verifying your account...</p>
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
      }}>Confirm Your Email</h2>
      <p style={{
        textAlign: "center",
        color: "#666",
        marginBottom: "25px",
        fontSize: "14px",
        lineHeight: "1.6"
      }}>
        Please enter the verification code sent to your email address.
      </p>
      <form onSubmit={handleConfirm}>
        <div style={{ marginBottom: "25px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            color: "#34495e",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            Verification Code
          </label>
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              transition: "border-color 0.3s",
              outline: "none",
              textAlign: "center",
              letterSpacing: "0.2em"
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
            marginBottom: "15px"
          }}
          onMouseOver={e => e.target.style.backgroundColor = "#2980b9"}
          onMouseOut={e => e.target.style.backgroundColor = "#3498db"}
        >
          Verify Account
        </button>
        <button 
          type="button"
          onClick={handleResendCode}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "transparent",
            color: "#3498db",
            border: "1px solid #3498db",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.3s"
          }}
          onMouseOver={e => {
            e.target.style.backgroundColor = "#3498db";
            e.target.style.color = "white";
          }}
          onMouseOut={e => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "#3498db";
          }}
        >
          Resend Code
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

export default Confirm; 