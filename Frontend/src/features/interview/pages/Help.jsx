import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import '../style/legal.scss';

const Help = () => {
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  const faqs = [
    {
      question: "How does the AI grade my interview?",
      answer: "We use Google's Gemini Large Language Model to analyze the transcript of your interview. It compares your answers against industry standards for the role you selected, looking for keywords, structural coherence (like the STAR method), and technical accuracy. It then generates an ATS match score and identifies skill gaps."
    },
    {
      question: "Why is the microphone button disabled?",
      answer: "Our voice features rely on the Web Speech API. If you are using Firefox, an older version of Safari, or an unsupported browser, this feature will be disabled because those browsers do not fully support native speech recognition. Please switch to Google Chrome or Microsoft Edge for the best experience."
    },
    {
      question: "Is my audio recorded or saved?",
      answer: "No. Your audio is processed in real-time in your browser to convert it to text. Only the text transcript is sent to our backend and the AI model. We do not store or listen to your voice recordings."
    },
    {
      question: "What happens if the AI takes too long to load?",
      answer: "Sometimes generative AI models experience high traffic. We have built-in timeout protections. If a report takes longer than 20 seconds to generate, the system will safely cancel the request and notify you, preventing infinite loading screens."
    },
    {
      question: "Can I use this without a Google Account?",
      answer: "Yes! While we recommend Google OAuth for a seamless 1-click login, you can also create a standard email and password account from the Register page."
    }
  ];

  return (
    <>
      <main className="legal-page">
        <div className="glass-panel">
          <div className="legal-page__header">
            <h1>Help Center & FAQ</h1>
            <p>Everything you need to know about the AI Interview platform.</p>
          </div>
          
          <div className="accordion">
            {faqs.map((faq, index) => (
              <div className="accordion__item" key={index}>
                <button 
                  className={`accordion__header ${openIndex === index ? 'active' : ''}`}
                  onClick={() => toggleAccordion(index)}
                >
                  {faq.question}
                  <span className="icon">▼</span>
                </button>
                <div className={`accordion__content ${openIndex === index ? 'open' : ''}`}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="legal-page__back">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default Help;
