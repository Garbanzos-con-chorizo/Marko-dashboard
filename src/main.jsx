import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("MAIN_JSX_START");

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (e) {
  console.error("React Mounting Failed:", e);
  document.getElementById('root').innerHTML = '<div style="color:red;padding:20px;">MOUNTING_ERROR: ' + e.message + '</div>';
}
