import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PaginaInicio from './pages/PaginaInicio';
import PaginaCatalogo from './pages/PaginaCatalogo';
import PaginaJugador from './pages/PaginaJugador';
import PaginaServicios from './pages/PaginaServicios';
import PaginaContacto from './pages/PaginaContacto';

export default function App() {
  return (
    <div className="portal-app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<PaginaInicio />} />
          <Route path="/jugadores" element={<PaginaCatalogo />} />
          <Route path="/jugadores/:id" element={<PaginaJugador />} />
          <Route path="/servicios" element={<PaginaServicios />} />
          <Route path="/contacto" element={<PaginaContacto />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
