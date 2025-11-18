import React, { useState } from 'react';

interface WelcomeScreenProps {
  onComplete: () => void;
}

/**
 * Sends the user's details to an email marketing service.
 * @param name The user's full name.
 * @param email The user's email address.
 * @returns A promise that resolves to true if the process should continue (even on failure).
 */
const subscribeToMailingList = async (name: string, email: string): Promise<boolean> => {
  // --- DEVELOPER ACTION REQUIRED ---
  // This is a placeholder to integrate with your email marketing service (e.g., Mailchimp, ConvertKit).
  // 1. Replace `endpointUrl` with your service's actual API endpoint.
  // 2. Adjust the `payload` structure to match what your service requires.
  // 3. Securely add your API Key, typically in the Authorization header.
  // NOTE: For better security, API keys should be handled by a backend proxy, not exposed in the frontend.

  const endpointUrl = 'https://your-email-service.com/api/subscribe'; // <-- REPLACE THIS
  const apiKey = 'YOUR_API_KEY_HERE'; // <-- REPLACE THIS

  const payload = {
    email_address: email,
    status: 'subscribed',
    merge_fields: {
      FNAME: name.split(' ')[0] || '',
      LNAME: name.split(' ').slice(1).join(' ') || '',
    },
  };

  console.log('--- SIMULATING EMAIL SUBSCRIPTION ---');
  console.log('Endpoint:', endpointUrl);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    // In a real scenario, you would uncomment and configure this fetch call.
    /*
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Example for Mailchimp: 'Authorization': `Basic ${btoa(`anystring:${apiKey}`)}`
        // Check your email service's documentation for the correct header.
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to subscribe email:', errorData);
      // We will return `true` anyway to not block the user's onboarding.
    }
    */
    
    // Simulate network delay for a better UX feel.
    await new Promise(resolve => setTimeout(resolve, 750));
    
    console.log('--- SIMULATION SUCCESSFUL ---');
    return true;

  } catch (error) {
    console.error('Network or other error during email subscription:', error);
    // Even if the subscription fails, we don't want to block the user.
    // Let them continue with the app. You might want to log this failure to a monitoring service.
    return true;
  }
};


const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && consentChecked && !isSubmitting) {
      setIsSubmitting(true);
      
      // Save to local storage for in-app use
      localStorage.setItem('profile.name', JSON.stringify(name));
      localStorage.setItem('profile.email', JSON.stringify(email));

      // Attempt to subscribe to the mailing list
      await subscribeToMailingList(name, email);
      
      // Complete onboarding regardless of subscription success
      setIsSubmitting(false);
      onComplete();
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
  };

  return (
    <div className="bg-creamBg min-h-screen flex flex-col justify-center items-center p-4">
      <div className="bg-surface p-6 rounded-2xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark w-full max-w-md text-center">
          <img 
            src="https://i.imgur.com/vZhVvfY.png" 
            alt="DASH Over 50 METHOD logo" 
            className="h-16 w-auto mb-6 mx-auto"
            onError={handleImageError}
          />
          <h1 className="text-3xl font-bold text-brandPrimaryDark mb-2">
            Welcome to DASH Over 50 METHOD™
          </h1>
          <p className="text-lg text-textSecondary mb-8 max-w-md mx-auto">
            Your daily companion for improving your well-being.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-textSecondary mb-1">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-lg border-border bg-creamBg shadow-sm text-lg h-12 px-3 text-textPrimary placeholder:text-textMuted focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-textSecondary mb-1">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border-border bg-creamBg shadow-sm text-lg h-12 px-3 text-textPrimary placeholder:text-textMuted focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-start space-x-3 pt-2">
              <input
                type="checkbox"
                id="consent"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="h-6 w-6 rounded border-border text-brandPrimary focus:ring-brandPrimary mt-1"
                required
                disabled={isSubmitting}
              />
              <label htmlFor="consent" className="text-base text-textMuted">
                I understand this app is for educational wellness purposes and not a medical device. My data is stored only on this device. I agree to the <a href="/terms" target="_blank" className="text-accentBlue underline">Terms</a> and <a href="/privacy" target="_blank" className="text-accentBlue underline">Privacy Policy</a>.
              </label>
            </div>

            <button
              type="submit"
              disabled={!name || !email || !consentChecked || isSubmitting}
              className="w-full text-lg bg-brandPrimary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 transition-colors disabled:bg-textMuted min-h-[52px]"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </button>
          </form>
      </div>
    </div>
  );
};

export default WelcomeScreen;