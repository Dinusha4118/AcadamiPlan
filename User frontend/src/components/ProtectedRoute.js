import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Additional role-based checks can be added here if needed
  return <Outlet />;
};

export default ProtectedRoute;