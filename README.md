# MoEngage Data Designer

A fullstack AI-powered tool to help marketers and product teams design data models and campaign usecases for their apps. Built with React (frontend) and Node.js/Express (backend), and powered by Google Gemini for AI recommendations.

## Features
- **Sample Data Design:**
  - Get AI-generated user attributes and event schema for your business vertical and goals.
  - Download sample data design as Excel.
- **Sample Usecases:**
  - View and download 10-15 marketing usecases per vertical (Push, Email, SMS, WhatsApp).
  - Get AI-recommended usecases for your vertical (powered by Gemini).
- **Business Vertical Detection:**
  - Detect business vertical from your app URL (using Gemini).
- **Modern UI:**
  - MoEngage branding, responsive layout, and easy-to-use interface.

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm

### 1. Clone the repository
```
git clone https://github.com/harekishore/dataDesigner.git
cd dataDesigner
```

### 2. Setup the Backend (Node.js/Express)
```
cd server
npm install
```
- Create a `.env` file and add your Gemini API key:
  ```
  GEMINI_API_KEY=your-gemini-api-key-here
  ```
- Start the server:
  ```
  npm start
  ```

### 3. Setup the Frontend (React)
```
cd ../client
npm install
npm start
```
- The app will run at [http://localhost:3001](http://localhost:3001) (or another port if 3000 is in use).

### 4. Deploy Frontend to GitHub Pages
- In `client/package.json`, ensure:
  ```json
  "homepage": "https://harekishore.github.io/dataDesigner"
  ```
- Deploy:
  ```
  npm run deploy
  ```
- Your app will be live at: https://harekishore.github.io/dataDesigner

## Customization
- Update the MoEngage logo in `client/src/moengage-logo-dark-2.svg` and `public/` as needed.
- Edit sample usecases and verticals in `client/src/App.js`.

## License
MIT

---

**Made with ❤️ by the MoEngage team.**
