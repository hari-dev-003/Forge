import './pwa/installPrompt.js'; // must run first — capture beforeinstallprompt ASAP
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store.js';
import App from './App.jsx';
import { registerSW } from './registerSW.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// Enable PWA offline support / installability (production builds only).
registerSW();
