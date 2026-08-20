import React, { useEffect } from 'react';
import { Link } from 'react-router';
import '../style/legal.scss';

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <main className="legal-page">
        <div className="glass-panel">
          <div className="legal-page__header">
            <h1>Privacy Policy</h1>
            <p>Last updated: August 2026</p>
          </div>
          
          <div className="legal-page__content">
            <h2>1. Introduction</h2>
            <p>
              Welcome to AI Interview MERN. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our website 
              and tell you about your privacy rights.
            </p>

            <h2>2. Data We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul>
              <li><strong>Identity Data:</strong> First name, last name, username or similar identifier (via Google OAuth).</li>
              <li><strong>Contact Data:</strong> Email address.</li>
              <li><strong>Profile Data:</strong> Your profile picture, interview feedback, generated reports, and audio recordings during mock interviews.</li>
              <li><strong>Technical Data:</strong> Internet protocol (IP) address, browser type and version, time zone setting.</li>
            </ul>

            <h2>3. How We Use Your Data (AI Processing)</h2>
            <p>
              Our platform utilizes the Google Gemini API to analyze your mock interview responses. When you participate in an AI voice or video call:
            </p>
            <ul>
              <li>Your speech is converted to text locally using the Web Speech API.</li>
              <li>The text transcripts are sent securely to our backend and processed by the Google Gemini model.</li>
              <li>Audio data is <strong>never stored</strong> permanently on our servers. It is processed in real-time and discarded.</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
              used or accessed in an unauthorized way, altered or disclosed. Your connection is secured via HTTPS and your 
              passwords (if applicable) are securely hashed using bcrypt.
            </p>

            <h2>5. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us via our GitHub repository.
            </p>
          </div>
          
          <div className="legal-page__back">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default Privacy;
