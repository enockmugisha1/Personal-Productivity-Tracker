import React from 'react';
import { forceResetAuth } from '../utils/clearFirebaseData';

/**
 * Debug component for resetting authentication
 * Only show in development or when there are authentication issues
 */
export const DebugAuthReset: React.FC = () => {
  const handleResetAuth = async () => {
    const confirmed = window.confirm(
      'This will clear all authentication data and reload the page. Are you sure?'
    );
    
    if (confirmed) {
      await forceResetAuth();
    }
  };

  // Only show in development or when there are specific auth errors
  const shouldShow = import.meta.env.DEV || 
    localStorage.getItem('show-auth-debug') === 'true' ||
    window.location.search.includes('debug=auth');

  if (!shouldShow) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#ff6b6b',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      border: '1px solid #ff5252'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        🐛 Debug Tools
      </div>
      <button
        onClick={handleResetAuth}
        style={{
          background: '#fff',
          color: '#ff6b6b',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Reset Auth
      </button>
    </div>
  );
};

export default DebugAuthReset;
