import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";
import SignUp from "../src/components/Signup";
import SignIn from "../src/components/SignIn";
import ConfirmAccount from "../src/components/confirm";
import EnhancedTaskDashboard from "../src/components/EnhancedTaskDashboard";
import PrivateRoute from "./PrivateRoute";
import { Amplify } from 'aws-amplify';

import { signOut, getCurrentUser } from "@aws-amplify/auth";
import config from "./amplify-config";
import Home from "../src/components/Home";

// Configure Amplify
Amplify.configure({
  Auth: config.Auth,
  API: config.API,
});

function NavBar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.log("No active session:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.clear();
      setIsAuthenticated(false);
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <nav
        style={{
          padding: "15px 30px",
          marginBottom: "30px",
          background: "linear-gradient(to right, #3b82f6, #1e40af)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "white",
        }}
      >
        <div>Loading...</div>
      </nav>
    );
  }

  return (
    <nav
      style={{
        padding: "15px 30px",
        marginBottom: "30px",
        background: "linear-gradient(to right, #3b82f6, #1e40af)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        {!isAuthenticated && (
          <>
            <Link
              to="/signup"
              style={{
                marginRight: "20px",
                color: "white",
                textDecoration: "none",
                padding: "8px 15px",
                borderRadius: "8px",
                transition: "background-color 0.3s",
                backgroundColor: "rgba(255,255,255,0.1)",
                fontWeight: "500",
              }}
            >
              Sign Up
            </Link>
            <Link
              to="/signin"
              style={{
                color: "white",
                textDecoration: "none",
                padding: "8px 15px",
                borderRadius: "8px",
                transition: "background-color 0.3s",
                backgroundColor: "rgba(255,255,255,0.1)",
                fontWeight: "500",
              }}
            >
              Sign In
            </Link>
          </>
        )}
        {isAuthenticated && (
          <Link
            to="/tasks"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "1.1em",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📋 Task Dashboard
          </Link>
        )}
      </div>
      {isAuthenticated && (
        <button
          onClick={handleSignOut}
          style={{
            padding: "10px 24px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.3s",
            fontWeight: "600",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#dc2626")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#ef4444")}
        >
          Sign Out
        </button>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <NavBar />
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            paddingTop: "0",
          }}
        >
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/confirm" element={<ConfirmAccount />} />
            <Route
              path="/tasks"
              element={
                <PrivateRoute>
                  <EnhancedTaskDashboard />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
