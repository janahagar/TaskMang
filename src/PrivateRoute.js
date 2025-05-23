import React, { useEffect, useState } from "react";
import { getCurrentUser } from '@aws-amplify/auth';
import { Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.log("Authentication error:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ 
        padding: "20px", 
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px"
      }}>
        <div>
          <div style={{ marginBottom: "10px" }}>Loading...</div>
          <div style={{ fontSize: "0.9em", color: "#666" }}>Checking authentication...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to signin page but save the current location they were trying to access
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}
