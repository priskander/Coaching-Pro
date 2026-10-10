import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/data-reset.js';
import './lib/org-sync.js';
import './lib/action-engine.js';
import './app-core.js';

createRoot(document.getElementById('root')!).render(<App />);
