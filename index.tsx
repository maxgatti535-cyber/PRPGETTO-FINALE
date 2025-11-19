
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- GLOBAL ERROR HANDLER ---
// Catches errors that happen before React mounts or outside React's tree
window.addEventListener('error', (event) => {
  console.error("Global Error Caught:", event.error);
  const root = document.getElementById('root');
  if (root && root.innerText.trim() === '') {
    root.innerHTML = `<div style="padding: 20px; color: #B91C1C; font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Errore di Avvio (Global Catch)</h1>
      <p>Si è verificato un errore critico che impedisce il caricamento dell'app.</p>
      <div style="background: #eee; padding: 10px; border-radius: 5px; margin-top: 10px; overflow: auto;">
        <strong>Messaggio:</strong> ${event.message}<br/>
        ${event.filename ? `<strong>File:</strong> ${event.filename}:${event.lineno}` : ''}
      </div>
      <button onclick="localStorage.clear(); window.location.reload();" style="margin-top: 20px; padding: 10px 20px; background: #B91C1C; color: white; border: none; borderRadius: 5px; cursor: pointer;">Resetta App</button>
    </div>`;
  }
});

// --- FALLBACK TIMEOUT ---
// If the screen is still white after 1.5 seconds, show a manual error
setTimeout(() => {
    const root = document.getElementById('root');
    if (root && root.innerText.trim() === '') {
        console.warn("Root is empty after timeout. Forcing visible error.");
        root.innerHTML = `<div style="padding: 20px; font-family: sans-serif; text-align: center;">
            <h1>Inizializzazione in corso...</h1>
            <p>Se questa schermata rimane per più di qualche secondo, potrebbe esserci un problema.</p>
            <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1B847C; color: white; border: none; border-radius: 5px; cursor: pointer;">Ricarica Pagina</button>
            <br/><br/>
            <button onclick="localStorage.clear(); window.location.reload();" style="padding: 8px 16px; background: #B91C1C; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">Reset Dati (Ultima Spiaggia)</button>
        </div>`;
    }
}, 1500);

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in React Component:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ color: '#B91C1C' }}>Qualcosa è andato storto.</h1>
          <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
            <h3 style={{ marginTop: 0, color: '#9B2C2C' }}>Dettagli Errore (React):</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#742A2A' }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>
          <button 
            onClick={() => {
                localStorage.clear();
                window.location.reload();
            }} 
            style={{ marginTop: '20px', padding: '12px 24px', background: '#B91C1C', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            ⚠️ Resetta App (Cancella Dati)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Wrapping strict mounting logic in try-catch
try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("React Root mounted successfully.");
} catch (e) {
    console.error("Fatal Error during React Mount:", e);
    rootElement.innerHTML = `<div style="padding:20px"><h1>Fatal Mount Error</h1><pre>${e}</pre></div>`;
}
