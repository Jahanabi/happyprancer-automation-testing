import React from 'react';
import './auth-loading.css';

const AuthLoadingOverlay = () => {
  return (
    <div className="auth-loading-backdrop" role="status" aria-live="polite">
      {/* Decorative background blobs */}
      <div className="auth-loading-bg-blob blob-1" aria-hidden="true" />
      <div className="auth-loading-bg-blob blob-2" aria-hidden="true" />
      <div className="auth-loading-bg-blob blob-3" aria-hidden="true" />

      {/* Main Centered Card */}
      <div className="auth-loading-card">
        <div className="auth-loading-logo-container">
          <img src="/images/logo.png" alt="HappyPrancer" className="auth-loading-logo" />
        </div>

        <div className="auth-loading-spinner-wrapper" aria-hidden="true">
          <div className="auth-loading-spinner" />
          <div className="auth-loading-spinner-inner" />
        </div>

        <h2 className="auth-loading-title">Verifying your session…</h2>
        <p className="auth-loading-subtitle">
          Please wait while we securely restore your information.
        </p>

        <div className="auth-loading-progress-container" aria-hidden="true">
          <div className="auth-loading-progress-bar" />
        </div>
      </div>
    </div>
  );
};

export default AuthLoadingOverlay;
