import React, { useState, useEffect } from 'react';

function App() {
  const [status, setStatus] = useState('loading');
  const [backendHealth, setBackendHealth] = useState('checking');
  const [showFullApp, setShowFullApp] = useState(false);

  useEffect(() => {
    // Test backend connection
    fetch('http://localhost:8000/health')
      .then(response => response.json())
      .then(_data => {
        setBackendHealth('connected');
        setStatus('ready');
      })
      .catch(error => {
        console.error('Backend connection failed:', error);
        setBackendHealth('error');
        setStatus('ready');
      });
  }, []);

  if (showFullApp) {
    // Lazy load the full application
    const MainPage = React.lazy(() => import('./pages/WorkingMainPage'));
    
    return (
      <React.Suspense fallback={<div style={{padding: '20px'}}>Loading application...</div>}>
        <MainPage />
      </React.Suspense>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1a202c',
            margin: '0 0 8px 0'
          }}>
            🖼️ Remote Raw Viewer
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
            Secure remote image browsing application
          </p>
        </div>

        {/* Status */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#374151' }}>
            System Status
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: '#ecfdf5',
              borderRadius: '8px',
              border: '1px solid #a7f3d0'
            }}>
              <span style={{ marginRight: '8px' }}>✅</span>
              <span style={{ color: '#065f46', fontSize: '14px' }}>
                Frontend: Application loaded
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: backendHealth === 'connected' ? '#ecfdf5' : 
                             backendHealth === 'error' ? '#fef2f2' : '#fffbeb',
              borderRadius: '8px',
              border: `1px solid ${backendHealth === 'connected' ? '#a7f3d0' : 
                                 backendHealth === 'error' ? '#fecaca' : '#fed7aa'}`
            }}>
              <span style={{ marginRight: '8px' }}>
                {backendHealth === 'checking' && '⏳'}
                {backendHealth === 'connected' && '✅'}
                {backendHealth === 'error' && '❌'}
              </span>
              <span style={{ 
                color: backendHealth === 'connected' ? '#065f46' : 
                       backendHealth === 'error' ? '#991b1b' : '#92400e',
                fontSize: '14px'
              }}>
                Backend: {backendHealth === 'checking' ? 'Checking...' : 
                         backendHealth === 'connected' ? 'Connected' : 'Connection failed'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {backendHealth === 'connected' && (
            <button
              onClick={() => setShowFullApp(true)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🚀 Launch Application
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 Reload
          </button>
        </div>

        {/* Debug Info */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f1f5f9',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <strong>Debug Information:</strong><br/>
          Frontend URL: {window.location.href}<br/>
          Backend Health: http://localhost:8000/health<br/>
          Status: {status} | Backend: {backendHealth}<br/>
          Time: {new Date().toLocaleString()}
        </div>

        {/* Help */}
        {backendHealth === 'error' && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#7f1d1d'
          }}>
            <strong>Backend Connection Failed</strong><br/>
            Please ensure the backend server is running on port 8000.<br/>
            Try: <code>npm run dev</code> in the backend directory.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;