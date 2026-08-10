# 💸 Opti-Split | AI-Powered Group Expense Splitting Engine

Opti-Split is a sophisticated, production-ready web application designed to simplify complex group financial management during trips or events. It sits at the intersection of modern frontend engineering and engaging, tactical UI design.

This application provides a **Member-First Workflow**, transforming how expenses are logged by focusing on one payer at a time. It incorporates **State-Based UI architecture** to bind the live state of your group directly to a professional dashboard that updates in real-time.

---

## 🚀 Key Engineering & UI Features

This project was built with a strong focus on core software engineering principles and production-quality UI design.

### **1. Member-First Dynamic Workspace (Middle Column)**
*   **Intuitive workflow:** Clicking any member in the **Left Column** (Groups) instantly targets them as the 'Active Payer.'
*   **Contextual UI:** The middle column dynamically switches to an entry tab for that specific person (e.g., *"Logging Expenses Paid by: Sahith"*).
*   **Optimized Logging:** This context prevents payer assignment errors, allowing for rapid-fire receipt processing for a single individual before moving to the next group member.

### **2. Real-Time Greedy Settlement Engine (Right Column)**
*   **Responsive Calculation:** Every manual entry or deletion triggers a re-calculation in real-time (`< 1ms`).
*   **Greedy Algorithm:** Opti-Split uses a sophisticated mathematical settlement algorithm to calculate net balances (`State ➔ Balances`) and generate an optimized "who owes who" list.
*   **Live Dashboard Binding:** State updates from the calculation engine are bound directly to the UI, rendering color-coded tactile 3D badges (e.g., `Owed ₹1200.00` in crisp emerald green) instantly.

### **3. Professional "Tactile Slate" Theme**
*   **Premium Visuals:** The UI sits in the perfect middle ground between engaging interactivity and sophisticated professional SaaS.
*   **3D Tactile Design:** Glassmorphism cards with layered box-shadows and specific linear gradients give everyone and everything visual depth.
*   **Interactive Physics:** Buttons use professional "push-down" button physics, simulating physical tactical interactions without excessive neon lighting.

### **4. Security Governance & State Management**
*   **Secured Credentials:** This project demonstrates engineering best practices by strictly isolating the sensitive Gemini API key using a non-committed local configuration file (`.gitignore`).
*   **Template Support:** A `config.example.js` file is provided to guide other engineers on how to deploy their own credentials.
*   **State Persistence:** All group members, expenses, and net balances are handled via sophisticated client-side state management and persisted to `localStorage` for continuity.

---

## 🛠️ File Structure and Engineering Governance

This project uses a modular file structure to separate state logic from UI rendering:

*   `.gitignore` - Security rules to prevent sensitive data (`config.js`) leakage to source control.
*   `config.example.js` - Safe template for users to paste their own API keys.
*   `app.js` - The core application engine. Handles state management, the Member-First Workspace logic, and the real-time settlement algorithm calculation.
*   `index.html` - The full-screen onboarding experience.
*   `main.html` - The sophisticated, 3-column dashboard interface.
*   `style.css` - The tactile 3D professional slate theme.

---

## 🚀 How to Run Opti-Split Locally

### **Step 1: Prerequisites & API Key**
You must have a **Gemini API Key**.
*   Go to **Google AI Studio** (aistudio.google.com).
*   Click on **Get API key** and generate a new key.

### **Step 2: Configuration**
Security is handled through non-committed configuration files:

1.  Clone this repository to your local computer.
2.  Find the file `config.example.js` in the project root.
3.  **Rename** this file exactly to **`config.js`**.
4.  Open `config.js` and paste your actual Gemini API key inside the quotes where indicated:
    ```javascript
    // config.js (Now Secret. gitignore is respecting it)
    const CONFIG = {
      GEMINI_API_KEY: "AIzaSy_YOUR_ACTUAL_KEY_HERE" 
    };
    ```

### **Step 3: Run the Application**
This is a serverless, Vanilla JavaScript application. Simply open `index.html` in your web browser (or serve it via a local server like Live Server in VS Code) to start using Opti-Split!