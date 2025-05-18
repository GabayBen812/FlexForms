import React from "react";
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Add your auth logic here if needed
  return <>{children}</>;
} 