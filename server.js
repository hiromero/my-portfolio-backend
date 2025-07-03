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


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
