import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AppDetail from './pages/AppDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/apps/:id" element={
        <ProtectedRoute>
          <AppDetail />
        </ProtectedRoute>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;