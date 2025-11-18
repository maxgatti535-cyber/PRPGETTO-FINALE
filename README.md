# DASH Over 50 METHOD™ App

A friendly, evidence-based assistant to help U.S. adults over 50 adopt the DASH diet and manage cardiovascular health.

![App Screenshot](https://i.imgur.com/sY9v2Yf.png)

## ✨ Key Features

This application is designed to be a daily companion for a healthier life, with a simple and accessible interface.

-   **🤖 AI Coach:** Get personalized advice and support from a virtual coach powered by the Google Gemini API. The coach uses your profile (age, medications, preferences) to provide relevant and safe answers.
-   **📅 4-Week Meal Plan:** A rotating meal plan with delicious, DASH-compliant recipes, designed for simplicity and variety.
-   **❤️ Blood Pressure Tracking:** Log your blood pressure readings, view your history, and see your progress with intuitive charts.
-   **💊 Medication Management:** A daily checklist to ensure you never forget to take your medications.
-   **📚 Education Hub:** Learn the "5 Pillars of the DASH Over 50 Method" with clear and easy-to-browse content.
-   **🏃 Guided Exercises:** Gentle movement routines suitable for different fitness levels, designed to be safe and effective.
-   **📊 Progress Tracking:** Weekly summaries of your blood pressure, water intake, and medication adherence to keep you motivated.
-   **🔔 Custom Reminders:** Set alerts for meals, drinking water, or any other daily activity.

## 🚀 Technologies Used

-   **React & TypeScript:** For a robust and scalable user interface.
-   **Tailwind CSS:** For fast, modern, and customizable styling.
-   **Google Gemini API:** Powers our AI Coach for intelligent and helpful conversations.
-   **Local Storage:** All user data is stored locally on the device to ensure maximum privacy and offline functionality.

##  Design Philosophy

-   **User-Centric:** Designed specifically for adults over 50, with a strong focus on readability, accessibility (scalable fonts, high contrast), and ease of use.
-   **Privacy First:** No accounts, no sign-ups. Your personal data never leaves your device.
-   **Accessibility:** Support for different font sizes, a high-contrast mode, and reduced motion for a comfortable experience for everyone.

## 🏃‍♀️ How to Run the App Locally

This is a static web application. To run it correctly and test all its features (including the AI coach), you need to serve it via a local server.

1.  **Install a local server (if you don't have one):**
    The easiest way is to use `serve`, an npm package.
    ```bash
    npm install -g serve
    ```

2.  **Start the server:**
    Navigate to the project's root folder in your terminal and type:
    ```bash
    serve .
    ```

3.  **Open in your browser:**
    Open your browser and go to the address provided by the server (usually `http://localhost:3000`).

**Note on the API Key:** The AI Coach feature requires a Google Gemini API key. In this development environment, the key is provided automatically as an environment variable (`process.env.API_KEY`).

## ⚠️ Important Disclaimer

This application is intended for educational and wellness purposes only. **It is not a medical device and does not provide medical advice.** Always consult your physician or another qualified health provider with any questions you may have regarding a medical condition or before making any changes to your treatment plan.

---

*Crafted with care to support your journey to better health.*
