import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SuspendedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      color: 'var(--text-main)',
      fontFamily: 'var(--font-sans)',
      padding: 20
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        padding: '40px 60px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
        maxWidth: 500
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          marginBottom: 24
        }}>
          <Lock size={40} />
        </div>
        
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--text-main)' }}>
          Account Suspended
        </h1>
        
        <p style={{ color: 'var(--text-subtle)', lineHeight: 1.6, marginBottom: 32 }}>
          Your restaurant operations have been suspended. Please contact platform administration to resolve this issue and restore access to your workspace.
        </p>
        
        <Link 
          to="/login" 
          className="btn btn-primary"
          style={{ width: '100%', display: 'inline-block', textAlign: 'center' }}
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
