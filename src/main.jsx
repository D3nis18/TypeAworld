import React from 'react'
import ReactDOM from 'react-dom/client'
import { initializeFirebase } from './firebase/config'
import App from './App.jsx'
import './index.css'

// Ensure Firebase is initialized before rendering
initializeFirebase();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
