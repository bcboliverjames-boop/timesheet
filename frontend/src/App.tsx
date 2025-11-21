import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import WarehouseList from './pages/warehouse/List';
import ProductList from './pages/product/List';
import InventoryList from './pages/inventory/List';
import InboundList from './pages/inbound/List';
import OutboundList from './pages/outbound/List';
import LocationList from './pages/location/List';
import AppLayout from './components/Layout';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/warehouses" element={<WarehouseList />} />
                  <Route path="/products" element={<ProductList />} />
                  <Route path="/locations" element={<LocationList />} />
                  <Route path="/inventory" element={<InventoryList />} />
                  <Route path="/inbound" element={<InboundList />} />
                  <Route path="/outbound" element={<OutboundList />} />
                </Routes>
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

