import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './App.css';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Set the default base URL for all Axios requests
axios.defaults.baseURL = 'http://localhost:5007';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" />
  </React.StrictMode>
);