import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parseExcelBuffer, mergeData } from './excelProcessor';

const app = express();
const port = 3000;

// 1. Setup Middlewares
app.use(cors());
app.use(express.json());

// 2. Setup Multer (using memoryStorage so we don't need an 'uploads' folder)
const upload = multer({ storage: multer.memoryStorage() });

// 3. The Main Upload Endpoint
app.post('/upload', upload.fields([
    { name: 'questions', maxCount: 1 },
    { name: 'answers', maxCount: 1 }
]), (req: any, res: any) => {
    try {
        console.log('--- Received upload request ---');

        // Check if both files exist in the request
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (!files || !files.questions || !files.answers) {
            console.error('Missing files in request');
            return res.status(400).json({ error: 'Please select both .xlsx files.' });
        }

        // Parse questions file from Buffer
        console.log('Parsing questions...');
        const questionsRaw = parseExcelBuffer(files.questions[0].buffer);
        
        // Parse answers file from Buffer
        console.log('Parsing answers...');
        const answersRaw = parseExcelBuffer(files.answers[0].buffer);

        // Merge them together
        console.log('Merging data by ID...');
        const mergedResults = mergeData(questionsRaw, answersRaw);

        console.log(`Success! Merged ${mergedResults.length} questions.`);
        return res.json(mergedResults);

    } catch (err: any) {
        console.error('SERVER ERROR:', err.message);
        return res.status(500).json({ error: 'Internal server error while processing Excel.' });
    }
});

// 4. Start Server
app.listen(port, () => {
    console.log('=========================================');
    console.log(`QUIZ BACKEND STARTED!`);
    console.log(`Address: http://localhost:${port}`);
    console.log('Ready to receive Excel files...');
    console.log('=========================================');
});