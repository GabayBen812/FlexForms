import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import Rooms from "@/pages/Rooms";

function App() {
  return (
    <Routes>
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <Rooms />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App; 