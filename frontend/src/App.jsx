import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import InstanceView from './components/InstanceView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/instance/:instanceId" element={<InstanceView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;