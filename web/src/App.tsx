import { Routes, Route } from 'react-router-dom';
import RestaurantsListPage from './pages/landing/RestaurantsListPage';
import AboutPage from './pages/landing/AboutPage';
import RestaurantPublicPage from './pages/landing/RestaurantPublicPage';
import RestaurantPage from './pages/customer/RestaurantPage';
import TablePage from './pages/customer/TablePage';

function App() {
  return (
    <Routes>
      {/* Landing Pages */}
      <Route path="/" element={<RestaurantsListPage />} />
      <Route path="/conheca" element={<AboutPage />} />
      
      {/* Public Restaurant View (no session) */}
      <Route path="/r/:slug" element={<RestaurantPublicPage />} />
      
      {/* Customer Pages (with session - from QR code) */}
      <Route path="/r/:slug/mesa/:qrCode" element={<TablePage />} />
      <Route path="/r/:slug/pedido" element={<RestaurantPage />} />
    </Routes>
  );
}

export default App;
