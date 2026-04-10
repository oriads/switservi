import { useState, useEffect } from 'react';

export default function WelcomePage() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:2050/health', { 
        mode: 'cors',
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('partial');
      }
    } catch (error) {
      setBackendStatus('partial');
    }
  };

  const openSystem = () => {
    window.open('http://localhost:5173', '_blank');
  };

  const copyLink = () => {
    const url = 'http://localhost:5173';
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('copyBtn');
      if (btn) {
        btn.textContent = '✓ Copiado!';
        setTimeout(() => {
          btn.textContent = '📋 Copiar Enlace';
        }, 2000);
      }
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '800px',
        width: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          color: 'white',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2.5em', margin: '0 0 10px 0', fontWeight: '700' }}>
            🖥️ HelpDesk IBM i
          </h1>
          <p style={{ fontSize: '1.2em', opacity: '0.9', margin: 0 }}>
            Sistema de Gestión de Cambios y Soporte
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: backendStatus === 'connected' ? '#10b981' : '#f59e0b',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.9em',
            marginTop: '15px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              background: 'white',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></div>
            <span>
              {backendStatus === 'connected' ? 'Sistema Completo' : 'Modo Limitado (Sin Backend)'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '40px' }}>
          {/* Access Box */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            marginBottom: '30px',
            boxShadow: '0 10px 30px rgba(16,185,129,0.3)'
          }}>
            <h2 style={{ fontSize: '1.3em', marginBottom: '15px', fontWeight: '500' }}>
              👇 HAZ CLIC AQUÍ PARA ABRIR EL SISTEMA 👇
            </h2>
            <div
              onClick={openSystem}
              style={{
                fontSize: '2em',
                fontWeight: '700',
                background: 'rgba(255,255,255,0.2)',
                padding: '15px 30px',
                borderRadius: '10px',
                display: 'inline-block',
                margin: '10px 0',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              http://localhost:5173
            </div>
            <br />
            <button
              id="copyBtn"
              onClick={copyLink}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid white',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                marginTop: '10px',
                fontSize: '1em'
              }}
            >
              📋 Copiar Enlace
            </button>
          </div>

          {/* Instructions */}
          <div style={{
            background: '#f8fafc',
            padding: '30px',
            borderRadius: '15px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              color: '#1e293b',
              fontSize: '1.4em',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>📖</span>
              Instrucciones para Acceder
            </h3>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { title: 'Abre tu Navegador de Internet', desc: 'Puede ser Chrome, Edge, Firefox o cualquier otro.' },
                { title: 'Copia la Dirección de Arriba', desc: 'Haz clic en el botón verde "Copiar Enlace".' },
                { title: 'Pega en la Barra de Direcciones', desc: 'Presiona Ctrl+V y luego Enter.' },
                { title: '¡Listo! Ya Puedes Usar el Sistema', desc: 'Se abrirá el sistema completo.' }
              ].map((step, index) => (
                <li key={index} style={{
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', color: '#1e293b', fontSize: '1.1em', marginBottom: '5px' }}>
                      {step.title}
                    </strong>
                    <p style={{ color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Warning if backend not connected */}
          {backendStatus === 'partial' && (
            <div style={{
              background: '#fef3c7',
              borderLeft: '4px solid #f59e0b',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '8px', fontSize: '1.1em' }}>
                ⚠️ Aviso Importante
              </strong>
              <p style={{ color: '#78350f', lineHeight: '1.6', margin: 0 }}>
                El sistema está funcionando en <strong>modo limitado</strong>. 
                Podrás ver la interfaz, pero las funciones que requieren el servidor 
                (guardar cambios, subir archivos, etc.) no estarán disponibles 
                hasta que inicies el backend con Docker.
              </p>
            </div>
          )}

          {/* Important */}
          <div style={{
            background: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <strong style={{ color: '#92400e', display: 'block', marginBottom: '8px', fontSize: '1.1em' }}>
              ⚠️ Importante
            </strong>
            <p style={{ color: '#78350f', lineHeight: '1.6', margin: 0 }}>
              Mantén la ventana del sistema abierta mientras trabajas. 
              Si la cierras, el sistema se detendrá.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
