import React from 'react';

interface LegalPageProps {
  setScreen: (screen: string) => void;
}

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;

const PrivacyPolicy: React.FC<LegalPageProps> = ({ setScreen }) => {
  return (
    <div className="space-y-4">
      <button onClick={() => setScreen('home')} className="flex items-center gap-1 text-lg text-textSecondary font-bold hover:text-brandPrimary mb-4">
        <BackIcon /> Back to Home
      </button>

      <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark space-y-4">
        <h1 className="text-2xl font-bold text-textPrimary">Privacy Policy</h1>

        <div className="prose text-textSecondary text-lg max-w-none">
          <p className="font-bold text-warning">This is a placeholder for your Privacy Policy.</p>
          <p>
            It is essential to replace this text with a comprehensive policy that accurately reflects your data handling practices and complies with relevant laws like GDPR, CCPA, etc.
          </p>
          <p>
            We strongly recommend consulting with a legal professional to draft this document. The content provided here is <strong>NOT</strong> legal advice and is for illustrative purposes only.
          </p>
          <h2 className="text-xl font-semibold text-textPrimary mt-4">Information We Collect</h2>
          <p>
            (Your policy should detail what personal data you collect, such as name, email, health information entered by the user, and usage data.)
          </p>
          <h2 className="text-xl font-semibold text-textPrimary mt-4">How We Use Your Information</h2>
          <p>
            (Explain the purposes for which you use the collected data, for example, to personalize the user experience, provide customer support, or improve the application.)
          </p>
          <h2 className="text-xl font-semibold text-textPrimary mt-4">Data Storage and Security</h2>
          <p>
            This app stores all user data locally on the device. No personal data is transmitted to or stored on our servers. It is your responsibility to secure your device.
          </p>
           <h2 className="text-xl font-semibold text-textPrimary mt-4">Your Rights</h2>
          <p>
            (Inform users of their rights regarding their data, such as the right to access, correct, or delete their information. Since data is local, explain how they can manage it within the app, e.g., through the 'Reset App Data' feature.)
          </p>
          <p>Last updated: October 20, 2025</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;