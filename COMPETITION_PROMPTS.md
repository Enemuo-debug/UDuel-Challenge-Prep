# ChatGPT Prompts for Quiz Generation

Use the prompt below to generate the Excel files needed for your Quiz App. You can easily change the **Topic** or **Difficulty** by editing the bolded text.

---

## 🚀 The Excel Generator Prompt
**Copy and paste this into ChatGPT (GPT-4 or GPT-4o recommended):**

> **Act as a Mathematics/Subject Expert. Generate two downloadable Excel (.xlsx) files for me to use in a quiz application.**
>
> **1. Topic & Difficulty:**
> - **Topic:** Tricky Percentage Increase and Decrease word problems. *(Change this to any topic you want, e.g., "Chemical Equations" or "World History")*
> - **Difficulty:** High-speed school competition level.
> - **Quantity:** 10 questions.
>
> **2. File 1: `questions.xlsx`**
> - **Columns:** `id`, `question`
> - **Formatting:** Include 4 options (A, B, C, D) clearly listed. Use standard readable characters (e.g., `*`, `/`, `^`, `%`). Ensure equations are typed in a way that is easy to read on a large screen.
>
> **3. File 2: `answers.xlsx`**
> - **Columns:** `id`, `answer`
> - **CRITICAL for Voice Recognition:** The `answer` column must contain ONLY the numerical value (e.g., "150") or the exact key phrase. Do NOT include letters like "A)" or "Option B". I will be speaking the answer, so keep it to what I would naturally say.
>
> **4. Requirement:** Ensure the `id` values match perfectly in both files. Please provide the download links for both .xlsx files now.

---

## 💡 Pro-Tips for Better UX
- **For Math:** If you want ChatGPT to use specific notation, add: *"Use '^' for powers and '*' for multiplication to ensure it renders clearly in a standard text font."*
- **For Voice:** If an answer is a long decimal, add: *"Round all numerical answers to the nearest whole number so they are easier to say out loud."*
- **For Variety:** You can change the "Quantity" to 20 or 50 if you want a longer practice session!
