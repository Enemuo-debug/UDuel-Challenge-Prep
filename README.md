# Quiz App for Competition Prep

This application helps you prepare for competitions by asking questions from Excel sheets and listening to your voice for answers.

## Prerequisites

- **Node.js** installed on your computer.
- **Google Chrome** or any browser that supports the Web Speech API.
- **Excel** to create the question and answer sheets.

## Project Structure

- `backend/`: TypeScript Node.js server.
- `frontend/`: HTML/CSS/JS frontend.
- `data/`: Placeholder for your Excel files.

## How to Set Up

### 1. Prepare your Excel files
Create two Excel files:
1. **Questions Excel**: Should have a column named `id` and a column named `question`.
2. **Answers Excel**: Should have a column named `id` and a column named `answer`.

The `id` in both files must match for each question/answer pair.

### 2. Install Backend Dependencies
Open your terminal, navigate to the `backend` folder, and run:
```bash
cd backend
npm install
```

### 3. Run the Backend
In the `backend` folder, run:
```bash
npm start
```
The server will start at `http://localhost:3000`.

### 4. Run the Frontend
You can open `frontend/index.html` directly in your browser.
*Note: Some browsers might require you to serve the HTML via a local server (like Live Server in VS Code) for the microphone to work properly.*

## How to Use

1. Open the app in your browser.
2. Select your **Questions Excel** file.
3. Select your **Answers Excel** file.
4. Click **Start Quiz**.
5. The app will go full-screen and show the first question.
6. You have **5 seconds** to say the answer out loud.
7. The app will tell you if you are correct or wrong and move to the next question.

## Troubleshooting

- **Microphone not working**: Ensure you have given the browser permission to use the microphone.
- **CORS Error**: Ensure the backend is running and `cors` is properly configured (it is by default).
- **Excel format**: Ensure the column headers are exactly `id`, `question`, and `answer`.
