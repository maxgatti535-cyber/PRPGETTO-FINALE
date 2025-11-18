import React from 'react';

interface LegalPageProps {
  setScreen: (screen: string) => void;
}

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;


const TermsOfService: React.FC<LegalPageProps> = ({ setScreen }) => {
  return (
    <div className="space-y-4">
       <button onClick={() => setScreen('home')} className="flex items-center gap-1 text-lg text-textSecondary font-bold hover:text-brandPrimary mb-4">
         <BackIcon /> Back to Home
      </button>

      <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark space-y-4">
        <h1 className="text-2xl font-bold text-textPrimary">Terms of Service</h1>

        <div className="prose text-textSecondary text-lg max-w-none">
          <p className="font-bold text-warning">This is a placeholder for your Terms of Service.</p>
          <p>
            Please replace this with your own terms, drafted in consultation with a legal professional. This document should outline the rules and regulations for the use of your application.
          </p>
          <p>
            The content provided here is <strong>NOT</strong> legal advice and is for illustrative purposes only.
          </p>
          <h2 className="text-xl font-semibold text-textPrimary mt-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
          <h2 className="text-xl font-semibold text-textPrimary mt-4">2. Medical Disclaimer</h2>
          <p>
            This application provides health-related information for educational purposes only. It is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </p>
           <h2 className="text-xl font-semibold text-textPrimary mt-4">3. Use of the App</h2>
          <p>
            You agree not to use the application for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the application in any way that could damage the application, services, or general business.
          </p>
          <h2 className="text-xl font-semibold text-textPrimary mt-4">4. Limitation of Liability</h2>
          <p>
            The owner of this application will not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the application.
          </p>
          <p>Last updated: October 20, 2025</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;