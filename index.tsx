
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for non-React errors
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && root.innerText.trim() === '') {
    root.innerHTML = `<div style="padding: 20px; color: #B91C1C; font-family: sans-serif;">
      <h1>Errore Critico di Avvio</h1>
      <p>${event.message}</p>
    </div>`;
  }
});

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
            <h3 style={{ marginTop: 0, color: '#9B2C2C' }}>Dettagli Errore:</h3>
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
          <p style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>Clicca su "Resetta App" se l'errore persiste dopo una ricarica normale.</p>
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

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
