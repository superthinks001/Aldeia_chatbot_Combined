import React from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">🔥</div>
            <span className="logo-text">aldeia</span>
          </div>

          <nav className="nav-menu">
            <a href="#homeowner">HOMEOWNER</a>
            <a href="#partners">PARTNERS</a>
            <a href="#how-it-works">HOW IT WORKS</a>
            <a href="#contact">CONTACT US</a>
          </nav>

          <button className="login-btn" onClick={onLoginClick}>
            LOGIN
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-subtitle">
            A step-by-step roadmap to guide the journey for home rebuilding
          </p>
          <h1 className="hero-title">
            It takes a village to build a village...
            <br />
            Rebuild together, Stronger than ever.
          </h1>
          <p className="hero-description">
            We understand the challenges you face after the wildfires. Our team is here to support you every step of the way, from
            <br />
            connecting with architects to accessing vital resources. Let's rebuild your home and community, together!
          </p>
          <button className="cta-btn" onClick={onLoginClick}>
            START REBUILD
          </button>
        </div>
        <div className="hero-badge">
          <div className="badge-icon">🔥</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">Accelerate your Path to Rebuilding</h2>
          <p className="features-subtitle">
            We have streamlined the process to make it accelerated and as smooth as possible for you.
          </p>
          <h3 className="features-tagline">Your Needs. Our Pre-approved Designs.</h3>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>Confirm rebuild location</h4>
              <p>Search your lot address and confirm property details for rebuilding your home.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>Enter your rebuild preferences</h4>
              <p>Tell us about your style needs and style preferences of your future home rebuild.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>Feedback rebuild home designs</h4>
              <p>Our AI will match your lot and rebuild preferences with a range of pre-approved home designs.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>Connect with your architect</h4>
              <p>Customize your selected home rebuild design and plan by connecting with your architect.</p>
            </div>
          </div>

          <div className="cta-buttons">
            <button className="cta-btn-primary" onClick={onLoginClick}>START REBUILD</button>
            <button className="cta-btn-secondary">CONTACT US</button>
          </div>

          <div className="partners-logos">
            <div className="partner-logo">
              <div className="logo-placeholder">SuperThinks</div>
            </div>
            <div className="partner-logo">
              <div className="logo-placeholder">NE DOBBIĽL CONDO</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="contact-container">
          <div className="contact-form-wrapper">
            <h2>Contact Us</h2>
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Value" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="Value" />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea placeholder="Value" rows={4}></textarea>
              </div>
              <button type="submit" className="submit-btn">SUBMIT</button>
            </form>
          </div>

          <div className="contact-info">
            <p>
              Send us a message if you have any questions. We are always happy to hear from you. We are here to guide you through the process of rebuilding your future home.
            </p>
            <p>
              If you need any immediate guidance while on the rebuild website, try our chatbot you see here.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p className="copyright">© 2025-2028 SuperThinks LLC.</p>
          <nav className="footer-nav">
            <a href="#about">ABOUT US</a>
            <a href="#partners">PARTNERS</a>
            <a href="#how-it-works">HOW IT WORKS</a>
            <a href="#contact">CONTACT US</a>
          </nav>
          <div className="social-icons">
            <a href="#instagram" aria-label="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="#youtube" aria-label="YouTube">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
