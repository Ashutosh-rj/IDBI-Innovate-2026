# 👔 Banker Dashboard — IDBI Innovate 2026 (Track 03)
**Team v22** — *"Every version is better than the last."*

---

## 🌟 Layman’s Guide: What is this Application?

If you are a bank officer, credit evaluator, or hackathon judge without a technical coding background—**do not worry!** This application is designed specifically so that you can run and evaluate it directly on your computer with zero coding knowledge.

The **Banker Dashboard** is an executive credit-decisioning web portal. Instead of forcing credit officers to read hundreds of physical paper tax returns and bank statements, this dashboard takes **Alternate Data** (like GST returns, UPI transactions, Account Aggregator bank statements, and EPFO payroll records) and uses Artificial Intelligence (AI) to generate an instant, auditable **MSME Financial Health Score (300 to 900)**.

---

## 👶 Step-by-Step Guide for Beginners (How to Run on Your PC)

Follow these exact 3 simple steps to start the Banker Dashboard right now on your computer:

### Step 1: Install Node.js (If you don't have it already)
1. Open your web browser (Chrome, Edge, Safari) and go to **[https://nodejs.org](https://nodejs.org)**.
2. Download the **LTS (Long Term Support)** version for Windows, Mac, or Linux.
3. Run the downloaded installer file and simply click **Next → Next → Install** until finished.

### Step 2: Open Your Command Prompt / Terminal
1. Open the folder where this project is saved on your computer (`msme-health-score`).
2. If you are on **Windows**:
   - Click on the top address bar of your folder window, type `cmd`, and hit **Enter**. A black command window will pop up right in your project folder!
3. If you are on **Mac**:
   - Press `Command + Space`, type `Terminal`, and open it. Then type `cd ` (with a space) and drag-and-drop the `msme-health-score` folder right into the terminal window and hit **Enter**.

### Step 3: Copy & Paste Two Simple Commands
Type or copy-paste these exact commands into your terminal one by one:

#### Command 1: Install Needed Software Libraries (Only need to do this once!)
```bash
npm run install:all
```
*(Wait about 30 to 60 seconds until you see `Done` or `Success` on the screen).*

#### Command 2: Start the Banker Dashboard!
```bash
npm run dev:banker
```
*(Within 2 seconds, you will see a green link on your screen saying `http://localhost:5173`).*

---

## 🚀 Step 4: Open Your Web Browser & Explore!

1. Open **Google Chrome**, **Microsoft Edge**, or **Safari**.
2. Type **`http://localhost:5173`** into the address bar at the top and hit **Enter**.
3. **Congratulations!** You are now inside the **IDBI Innovate 2026 Banker Dashboard**.

---

## 🎮 How to Navigate & Test Without Technical Knowledge

We have built a special **"Judge & Auditor Safety Switch"** right at the top of the dashboard so you never encounter technical errors or missing server crashes:

> [!TIP]
> **Look at the Top-Right Corner of the Screen:**  
> You will see a button that says either **`Live API Gateway :8080`** or **`Audit Cohort (SGSDG)`**.
> - **If you have our backend Docker servers running:** Leave it on **Live API Gateway** to see live Python AI predictions!
> - **If you are running ONLY the frontend on your laptop right now:** Click that button so it switches to **`Audit Cohort (SGSDG)`**. In this mode, the dashboard runs 100% inside your web browser using real, mathematical TreeSHAP explainability algorithms and verified audit data without needing any external server installed!

### Core Features to Click Around & Try:
1. **Portfolio Overview:** View the overall health distribution of MSME borrowers, Average PD (Default Probability), and credit risk bands.
2. **MSME Cohort & Scorecards:** Click on any business (like *Apex Textiles Pvt Ltd* or *Vignesh CNC Works*) to open their **Executive Credit Scorecard**.
3. **TreeSHAP Explainability (`Why did they get this score?`):** Look at the exact reason codes. The AI lists top positive boosters (e.g., `"Zero check bounces across 180 days -> +45 points"`) and top negative risk factors (`"High GST input tax credit mismatch -> -28 points"`).
4. **What-If AI Simulator:** Click the **`What-If Simulator`** tab at the top. Use your mouse to slide the **GST Input Tax Credit Mismatch** or **Bank Overdraft Limit Utilization** sliders left and right. Watch how the MSME Health Score dynamically updates live in front of your eyes!
5. **RBI Audit & Compliance Panel:** Review our strict adherence to the **DPDP Act 2023** and **ReBIT Account Aggregator v2.0** framework.

---

## 🛠️ For Technical Developers & Engineers
If you are an engineer wanting to verify the tech stack or connect to the live backend cluster:
- **Framework:** React 19 + TypeScript + Vite 6 + Tailwind CSS v4.
- **Port:** `5173` (by default).
- **Production Build Check:** Run `npm run build` inside `apps/banker-dashboard` to verify zero TypeScript compilation errors (`built in ~3 seconds`).
- **Live Backend Integration:** Connects automatically to Spring Cloud API Gateway (`http://localhost:8080`) and Python FastAPI Scoring Engine (`http://localhost:8000`) when available.

---
© 2026 IDBI Innovate • Track 03: MSME Financial Health Score Platform • **Team v22**
