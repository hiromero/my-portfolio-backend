// my-portfolio/backend/server.js
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';

const __dirname = path.resolve();
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


const EXPERIENCE_PATH = path.join(__dirname, 'data', 'experience.json');

// helper to read/write
function readExperiences() {
    const raw = fs.readFileSync(EXPERIENCE_PATH, 'utf-8');
    return JSON.parse(raw);
}
function writeExperiences(data) {
    fs.writeFileSync(EXPERIENCE_PATH, JSON.stringify(data, null, 2));
}

// ─── Get all experiences ─────────────────────────────────────
app.get('/api/experience', authMiddleware, (req, res) => {
    const list = readExperiences();
    // sort newest (by year, month) first
    list.sort((a, b) => {
        const da = new Date(a.startYear, a.startMonthIndex);
        const db = new Date(b.startYear, b.startMonthIndex);
        return db - da;
    });
    res.json(list);
});

// ─── Create a new experience ────────────────────────────────
app.post('/api/experience', authMiddleware, (req, res) => {
    const experience = req.body;
    const list = readExperiences();
    // generate a simple unique id
    experience.id = Date.now().toString();
    // convert month name to index for sorting
    experience.startMonthIndex = new Date(`${experience.startMonth} 1, 2000`).getMonth();
    experience.endMonthIndex = experience.endMonth
        ? new Date(`${experience.endMonth} 1, 2000`).getMonth()
        : null;
    list.push(experience);
    writeExperiences(list);
    res.json(experience);
});

// ─── Update an existing experience ───────────────────────────
app.put('/api/experience/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const updated = req.body;
    const list = readExperiences().map(exp => {
        if (exp.id === id) {
            // recalc month indices
            updated.startMonthIndex = new Date(`${updated.startMonth} 1, 2000`).getMonth();
            updated.endMonthIndex = updated.endMonth
                ? new Date(`${updated.endMonth} 1, 2000`).getMonth()
                : null;
            return { ...updated, id };
        }
        return exp;
    });
    writeExperiences(list);
    res.json(updated);
});

// ─── Delete an experience ────────────────────────────────────
app.delete('/api/experience/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    let list = readExperiences().filter(exp => exp.id !== id);
    writeExperiences(list);
    res.json({ message: 'Deleted' });
});


const EDUCATION_PATH = path.join(__dirname, 'data', 'education.json');
function readEducation() {
    return JSON.parse(fs.readFileSync(EDUCATION_PATH, 'utf-8'));
}
function writeEducation(arr) {
    fs.writeFileSync(EDUCATION_PATH, JSON.stringify(arr, null, 2));
}

// ─── Get all education entries ─────────────────────────────
app.get('/api/education', authMiddleware, (req, res) => {
    const list = readEducation();
    // sort newest first by graduation date
    list.sort((a, b) => {
        const da = new Date(a.graduationYear, a.graduationMonthIndex);
        const db = new Date(b.graduationYear, b.graduationMonthIndex);
        return db - da;
    });
    res.json(list);
});

// ─── Create new entry ───────────────────────────────────────
app.post('/api/education', authMiddleware, (req, res) => {
    const entry = req.body;
    entry.id = Date.now().toString();
    entry.startMonthIndex = new Date(`${entry.startMonth} 1, 2000`).getMonth();
    entry.graduationMonthIndex = new Date(`${entry.graduationMonth} 1, 2000`).getMonth();
    const list = readEducation();
    list.push(entry);
    writeEducation(list);
    res.json(entry);
});

// ─── Update an entry ───────────────────────────────────────
app.put('/api/education/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const updated = req.body;
    updated.startMonthIndex = new Date(`${updated.startMonth} 1, 2000`).getMonth();
    updated.graduationMonthIndex = new Date(`${updated.graduationMonth} 1, 2000`).getMonth();
    const list = readEducation().map(item =>
        item.id === id ? { ...updated, id } : item
    );
    writeEducation(list);
    res.json(updated);
});

// ─── Delete an entry ───────────────────────────────────────
app.delete('/api/education/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const list = readEducation().filter(item => item.id !== id);
    writeEducation(list);
    res.json({ message: 'Deleted' });
});


//Skills

const SKILLS_PATH = path.join(__dirname, 'data', 'skills.json');
function readSkills() {
    return JSON.parse(fs.readFileSync(SKILLS_PATH, 'utf-8'));
}
function writeSkills(arr) {
    fs.writeFileSync(SKILLS_PATH, JSON.stringify(arr, null, 2));
}

// Get all skills
app.get('/api/skills', authMiddleware, (req, res) => {
    res.json(readSkills());
});

// Add a skill
app.post('/api/skills', authMiddleware, (req, res) => {
    const skill = { ...req.body, id: Date.now().toString() };
    const list = readSkills();
    list.push(skill);
    writeSkills(list);
    res.json(skill);
});

// Update a skill
app.put('/api/skills/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const updated = req.body;
    const list = readSkills().map(s => s.id === id ? { ...updated, id } : s);
    writeSkills(list);
    res.json(updated);
});

// Delete a skill
app.delete('/api/skills/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    writeSkills(readSkills().filter(s => s.id !== id));
    res.json({ message: 'Deleted' });
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



