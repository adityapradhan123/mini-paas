import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AppDetail from './pages/AppDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/apps/:id" element={<AppDetail />} />
    </Routes>
  );
}

export default App;