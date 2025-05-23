import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, getCurrentUser, signOut, fetchAuthSession } from '@aws-amplify/auth';

function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // First sign out any existing session
      try {
        await signOut();
        localStorage.removeItem('authToken');
      } catch (err) {
        // Ignore signOut errors
      }
      setLoading(false);
    } catch (err) {
      console.error("Error in checkAuthState:", err);
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError("Please enter both username and password.");
      setLoading(false);
      return;
    }

    try {
      // First try to sign out any existing session
      try {
        await signOut();
        localStorage.removeItem('authToken');
      } catch (err) {
        // Ignore signOut errors
      }

      // Now attempt to sign in
      await signIn({ 
        username,
        password,
        options: {
          authFlowType: "USER_SRP_AUTH"
        }
      });

      // After successful sign in, get and store the token
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();
      console.log('New token after sign in:', token);
      localStorage.setItem('authToken', token);
      
      navigate('/tasks');
    } catch (err) {
      console.error("Sign in error:", err);
      if (err.message === 'User is not confirmed.') {
        navigate('/confirm');
      } else {
        setError(err.message || "Failed to sign in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "40px 20px",
        textAlign: "center"
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
        <p style={{ color: "#666" }}>Checking session...</p>
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
      }}>Welcome Back</h2>
      <form onSubmit={handleSignIn}>
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
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          Sign In
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

export default SignIn;
