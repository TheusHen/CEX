# ✈️ CEX System – Airport Quality Index

**CEX System** is an integrated platform that calculates, stores, and publicly displays airport ratings based on objective and subjective criteria such as comfort, efficiency, and aesthetics. It combines **artificial intelligence**, **automated calculation**, **geographic visualization**, and **cloud storage** to generate the **CEX index**, a standardized metric between 0 and 10 that allows comparing airports worldwide.

---

## 🎯 Objective

Create a reliable and transparent system to measure the **user experience in airports**, considering not only operational factors but also visual perception, comfort, and structure, facilitating analysis, comparisons, and improvements.

---

## 🧠 How It Works

The system consists of three main layers:

---

### 🖥️ 1. **Local Software (Python + React)**

> Executed locally by the evaluator (auditor, user, or enthusiast).

* React interface with interactive map (Leaflet)
* Data input:

  * Manual (objective and subjective values)
  * Or AI-assisted (image/text interpreted by Gemini/OpenAI)
* Backend with FastAPI:

  * Calculates the indices of **Comfort (C)**, **Efficiency (E)**, and **Aesthetics (X)**
  * Applies weights and calculates the final **CEX** index
* Visualization:

  * Simple graphs with partial and final results
* Submission:

  * The calculated data is sent via `POST` to the public website

---

### 🌐 2. **Public Website (Next.js + Supabase)**

> Hosted online for public consultation, visualization, and interaction.

* **API Route** that receives and saves the sent data
* Integration with Supabase database (managed PostgreSQL)
* Map with evaluated airports

Coming soon: 
* Colored pins according to the CEX score
* Dynamic page for each airport:

  * Graphs of indices (C, E, X)
  * Evaluation history
  * Feedback system (👍 / 👎)
* Ranking of the best-rated airports
* Filters by date, score, IATA code, etc.

---

### 🔁 3. **Integration between modules**

* The local frontend (React) sends data to the backend (FastAPI)
* The backend calculates and sends to the website (Next.js API)
* The website saves to Supabase and displays publicly

---

## 📊 CEX Evaluation Formula

The score is based on three pillars:

| Index   | Meaning    | Formula                                                                        |
| ------- | ---------- | ------------------------------------------------------------------------------ |
| **C**   | Comfort    | $C = \frac{S_p + A_c + D_a + Z_l}{4}$                                          |
| **E**   | Efficiency | $E = \frac{T_o + N_g + R_t + P_m}{4}$                                          |
| **X**   | Aesthetics | $X = \frac{V_a + I_d + S_c + L_u}{4}$                                          |
| **CEX** | Final score| $\text{CEX} = \frac{w_C \cdot C + w_E \cdot E + w_X \cdot X}{w_C + w_E + w_X}$ |

**Each index evaluates 4 variables.** The final result is a weighted average, standardized from 0 to 10.

---

## 📦 Example of Sent Payload

```json
{
  "airport": "GRU",
  "iata_code": "GRU",
  "date": "2025-07-24",
  "C": 7.5,
  "E": 8.2,
  "X": 6.8,
  "CEX": 7.5
}
```

---

## 🧪 MVP – Minimum Viable Product

The functional MVP already delivers:

* ✅ Local calculation via automated formula
* ✅ Data submission with standardized structure
* ✅ Storage and query via Supabase
* ✅ Visualization on map and dynamic pages

---

## 🔧 Technologies Used

| Layer            | Technologies                   |
| ---------------- | ------------------------------ |
| Local backend    | Python, FastAPI                |
| Local frontend   | React, Vite, Leaflet, Chart.js |
| Remote API       | Next.js (API Routes)           |
| Database         | Supabase (PostgreSQL)          |
| Public frontend  | Next.js + TailwindCSS          |
| Hosting          | Vercel (website), local execution |

---

## 📁 Folder Structure

```
cex-system/
├── local/                      # Local software (Python + React)
├── backend/                    # Backend API server (Node.js + Fastify)
├── web/                        # Public website (Next.js + Supabase)
├── docs/                       # Documentation
└── README.md
```

---

## 📅 Development Schedule

| Week | Deliverables                                      |
| ---- | ------------------------------------------------- |
| 1    | FastAPI backend with calculation logic            |
| 2    | React interface with map and data entry           |
| 3    | Next.js API and Supabase integration              |
| 4    | Map visualization, history, and public ranking    |

---

## 🚀 Future Expansions

* 🔐 Login for authenticated evaluations
* 🤖 AI validation (automatic error verification)
* 📄 Export evaluations to PDF
* 📊 Private dashboard for internal analysis
* 📱 Mobile application (React Native)

---

## 🧩 Contributions and Reuse

The system is **modular, open-source, and expandable**, and can be used to evaluate other types of infrastructure (stations, shopping malls, hospitals, etc.) with minor adaptations.

## 📝 Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## 📜 License

This project is licensed under the terms of the license included in the [LICENSE](LICENSE) file.
