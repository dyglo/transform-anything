import { lazy, StrictMode, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import { useWorkspace } from './state/workspace';
import './styles.css';
const Workspace = lazy(() => import('./pages/Workspace'));
function App() {
  useEffect(() => {
    void useWorkspace.getState().init();
  }, []);
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div id="main-content">
        <Suspense fallback={<div className="empty-workspace">Opening workspace…</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route
              path="*"
              element={
                <div className="empty-workspace">
                  <h1>Nothing here yet.</h1>
                  <a href="/">Return to Transform</a>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
