// Importa el modo estricto de React para detectar efectos secundarios problemáticos en desarrollo.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'remixicon/fonts/remixicon.css'
import './index.css'
import './portal/portal.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
