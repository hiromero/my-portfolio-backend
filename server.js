// my-portfolio/backend/server.js
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

// Hardcoded owner credentials
const OWNER_EMAIL = 'hiroshiromero0@gmail.com';
const OWNER_PASSWORD = 'chosenyi00';

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    console.log('⮕ Login attempt:', { email, password });
    if (email !== OWNER_EMAIL || password !== OWNER_PASSWORD) {
        console.log('⮕ Invalid credentials');
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log('⮕ Successful login');
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { email } });
});


import fs from 'fs';
import path from 'path';
const __dirname = path.resolve();

const DETAILS_PATH = path.join(__dirname, 'data', 'details.json');

// 🔐 Auth middleware
function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });

    const token = auth.split(' ')[1];
    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(403).json({ message: 'Invalid token' });
    }
}

// 📖 Get details
app.get('/api/details', (req, res) => {
    const data = fs.readFileSync(DETAILS_PATH, 'utf-8');
    res.json(JSON.parse(data));
});

// 💾 Save or update details (auth required)
app.post('/api/details', authMiddleware, (req, res) => {
    fs.writeFileSync(DETAILS_PATH, JSON.stringify(req.body, null, 2));
    res.json({ message: 'Details saved successfully' });
});

// ❌ Clear details
app.delete('/api/details', authMiddleware, (req, res) => {
    fs.writeFileSync(DETAILS_PATH, '{}');
    res.json({ message: 'Details deleted' });
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



