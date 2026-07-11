# 📱 MSME Borrower PWA — IDBI Innovate 2026 (Track 03)
**Team v22** — *"Every version is better than the last."*

---

## 🌟 Layman’s Guide: What is this Application?

If you don't know how to code or operate complex technical tools—**no problem at all!** This step-by-step guide is written in plain, simple language so you can launch and test this mobile web application right on your computer screen or phone within two minutes.

The **MSME Borrower PWA (Progressive Web Application)** is a borrower-facing, mobile-friendly banking app. In the real world, millions of small business owners (like textile manufacturers, CNC machine shops, and retail traders) are rejected for loans because they do not have formal credit histories. 

This app gives them a **Self-Service Financial Health Portal**. With a few taps on their screen, the small business owner can:
1. Connect their alternate digital footprints (like GST filings, UPI merchant QR payments, and Account Aggregator bank accounts) with explicit digital consent.
2. View their live **MSME Financial Health Score (300 to 900)** in plain, easy-to-understand language.
3. See **Why they got this score** (what hurts their score vs. what boosts it).
4. Use an interactive **Score Boost AI Simulator** to see how fixing late tax filings or reducing bank overdraft limits will unlock instant **0.75% interest rate rebates** on working capital loans!

---

## 👶 Step-by-Step Guide for Beginners (How to Run on Your PC)

Follow these exact 3 simple steps to start the MSME Borrower app right now:

### Step 1: Make sure Node.js is installed
1. Open your browser and go to **[https://nodejs.org](https://nodejs.org)**.
2. Download the **LTS (Long Term Support)** installer for your computer and run it (click **Next → Next → Install** until finished). If you already did this for the Banker Dashboard, you don't need to do it again!

### Step 2: Open Your Command Prompt / Terminal
1. Go to the main project folder (`msme-health-score`) on your computer.
2. If you are on **Windows**: click the top folder bar, type `cmd`, and press **Enter**.
3. If you are on **Mac**: press `Command + Space`, type `Terminal`, type `cd ` and drag the folder right into the terminal and press **Enter**.

### Step 3: Run the Application Command
Type or copy-paste these commands into the terminal:

#### Command 1: Install Needed Libraries (Skip if you already ran `npm run install:all` earlier)
```bash
npm run install:all
```

#### Command 2: Start the MSME Borrower PWA!
```bash
npm run dev:pwa
```
*(Within 2 seconds, you will see a green link on your terminal screen saying `http://localhost:5174`).*

---

## 🚀 Step 4: Open Your Browser & See the Mobile App!

1. Open **Google Chrome** or **Microsoft Edge**.
2. Type **`http://localhost:5174`** into the top address bar and hit **Enter**.
3. **Pro Tip to See it as a Real Mobile Phone:**  
   - Press **`F12`** on your keyboard (or right-click anywhere on the screen and select **Inspect**).  
   - In the dev window that pops up, click the little **Phone / Tablet icon** at the top-left corner (or press `Ctrl + Shift + M`). Your screen will instantly transform into a sleek, mobile smartphone screen!

---

## 🎮 How to Test & Use the App Without Coding

We included built-in demo safety features so anyone can evaluate the app seamlessly:

> [!TIP]
> **Check the Mode Switches at the Top:**  
> Right below the header, you will see buttons for **`Live API`** and **`Judge Demo Mode`**.
> - **If `Judge Demo Mode` is ON (`Green/Active`):** The application runs seamlessly inside your browser using mathematical high-fidelity AI simulation without requiring a backend server. If the live server is ever offline, the app automatically switches to **Judge Demo Mode** so you never get stuck on an error screen!

### What to Try Inside the App:
1. **Switch Profiles (Top Header Dropdown):** Click the dropdown menu at the very top to switch between different real-world MSME businesses:
   - *Apex Textiles Pvt Ltd* (Score: 785 - Prime Tier)
   - *Vignesh CNC Works* (Score: 615 - Satisfactory Tier)
   - *Sharma Retail & Traders* (Score: 490 - Stressed Tier)
   - *Green Leaf Agro* (Score: 710 - Good Tier)
2. **Explore the Bottom Navigation Bar (`Home`, `Why Score?`, `AA Consents`, `Boost Score`):**
   - Click **`Why Score?`** (`Why did I get this score?`): See plain-English explanations of how regular GST filings boosted their score (+48 pts) or how overdraft utilization lowered it (-28 pts).
   - Click **`AA Consents`** (`Manage Account Aggregator Consents`): Test granting and revoking data-sharing permissions under the **DPDP Act 2023** and **ReBIT AA v2.0** framework. Watch what happens when a consent is revoked!
   - Click **`Boost Score`** (`Score Boost AI Simulator`): Slide the interactive behavior levers to see how improving cash flow velocity or tax compliance pushes the score over 700 to instantly unlock an **OCEN working capital credit line at a 0.75% rate discount**!

---

## 🛠️ For Technical Developers & Engineers
- **Tech Stack:** React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Lucide Icons.
- **Port:** `5174` (by default).
- **Production Build Check:** Run `npm run build` inside `apps/msme-pwa` to verify zero TypeScript compilation errors (`built in ~2 seconds`).
- **Responsive Architecture:** Styled with a centered `max-w-md mx-auto shadow-2xl` shell to perfectly mimic a native mobile PWA app experience on both desktop and mobile viewports.

---
© 2026 IDBI Innovate • Track 03: MSME Financial Health Score Platform • **Team v22**
