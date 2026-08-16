/**
 * PCDS - PREDICTIVE CYBER DEFENCE SYSTEM (SERVER)
 * -----------------------------------------------
 * Architecture:
 * - Runtime: Node.js
 * - Auth: JWT
 * - Caching/Counters: REAL Redis (Required)
 * - Storage: REAL Elasticsearch (Required)
 * - Ingestion: Logstash (Simulated via TCP push)
 * - Dashboard: Socket.io
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { createClient } = require('redis');
const { Client } = require('@elastic/elasticsearch');
const net = require('net');
const path = require('path');

// --- CONFIGURATION ---
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const ADMIN_PASS = process.env.ADMIN_PASS;
const LOGSTASH_HOST = 'localhost';
const LOGSTASH_PORT = 5000;

// --- INITIALIZATION ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const redisClient = createClient();
const esClient = new Client({ node: 'http://localhost:9200' });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend_victim')));
app.use('/hacker', express.static(path.join(__dirname, '../frontend_hacker')));
app.use('/admin', express.static(path.join(__dirname, '../frontend_admin')));

// 3. LOGSTASH INGESTOR
function sendToLogstash(data) {
    const client = new net.Socket();
    client.connect(LOGSTASH_PORT, LOGSTASH_HOST, () => {
        client.write(JSON.stringify(data) + '\n');
        client.end();
    });
    client.on('error', () => { });
}

// --- DEFENSE MIDDLEWARE ---
const pcdsMiddleware = async (req, res, next) => {
    // 0. WHITELIST ADMIN (CRITICAL FIX: Allow Admin to bypass checks)
    if (req.path.startsWith('/admin')) {
        return next();
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    try {
        // A. Blacklist Check
        const banReason = await redisClient.get(`blacklist:${ip}`);
        if (banReason) {
            broadcastLog(ip, 'BLOCKED_HIT', `Rejected: ${banReason}`, 'BLOCKED');
            return res.status(403).json({ error: "ACCESS_DENIED", message: `Your IP is blocked. Reason: ${banReason}` });
        }

        // B. Rate Limiting
        const reqCount = await redisClient.incr(`rate:${ip}`);
        if (reqCount === 1) await redisClient.expire(`rate:${ip}`, 1);

        if (reqCount > 10) {
            await triggerBan(ip, "DDoS Traffic Spike");
            return res.status(429).json({ error: "TRAFFIC_ANOMALY" });
        }

        // C. Signature Analysis
        const payload = JSON.stringify(req.body || "").toUpperCase();
        if (payload.includes("' OR '1'='1") || payload.includes("<SCRIPT>")) {
            await triggerBan(ip, "Malicious Payload Signature");
            return res.status(403).json({ error: "THREAT_DETECTED" });
        }

        broadcastLog(ip, 'HTTP_REQ', `${req.method} ${req.path}`, 'ALLOW');
        next();
    } catch (err) {
        console.error("Middleware Error:", err);
        next();
    }
};

// Helper: Ban Logic
async function triggerBan(ip, reason) {
    await redisClient.set(`blacklist:${ip}`, reason);
    const alert = { '@timestamp': new Date().toISOString(), ip, type: 'CRITICAL', message: reason };
    try { await esClient.index({ index: 'pcds-alerts', document: alert }); } catch (e) { }
    sendToLogstash({ ...alert, level: 'error' });
    io.emit('alert', { timestamp: new Date(), ip, message: reason });
    io.emit('log', { time: new Date().toLocaleTimeString(), ip, type: 'DEFENSE_ACTION', status: 'BLOCKED', details: reason });
    io.emit('refresh_blocks');
}

function broadcastLog(ip, type, details, status) {
    io.emit('log', { time: new Date().toLocaleTimeString(), ip, type, details, status });
}

app.use(pcdsMiddleware);

// --- ROUTES ---

// 1. SIGNUP API
app.post('/api/signup', async (req, res) => {
    const { username, password, fullName } = req.body;
    if (!username || !password || !fullName) return res.status(400).json({ error: "Missing fields" });

    try {
        // Check if user exists
        const exists = await redisClient.hExists('users', username);
        if (exists) return res.status(400).json({ error: "User already exists" });

        // Store user in Redis Hash (JSON string)
        const userData = JSON.stringify({ password, fullName });
        await redisClient.hSet('users', username, userData);
        res.json({ success: true, message: "Account created successfully" });
    } catch (e) {
        res.status(500).json({ error: "Database error" });
    }
});

// 2. LOGIN API (Updated to check Redis)
app.post('/api/login', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { username, password } = req.body;

    // Check Redis for user
    const storedData = await redisClient.hGet('users', username);
    let storedPass = null;
    let fullName = "User";

    if (storedData) {
        try {
            // Try parsing as JSON (new format)
            const parsed = JSON.parse(storedData);
            storedPass = parsed.password;
            fullName = parsed.fullName;
        } catch (e) {
            // Fallback for old format (plain string password)
            storedPass = storedData;
        }
    }

    // Auth logic: Check Redis OR Hardcoded user (fallback)
    const isAuthenticated = (storedPass && storedPass === password) || (username === "user" && password === "pass");

    if (!isAuthenticated) {
        const fails = await redisClient.incr(`failed_login:${ip}`);
        if (fails >= 10) {
            await triggerBan(ip, "Brute Force Attack");
            return res.status(403).json({ error: "ACCOUNT_LOCKED" });
        }
        return res.status(401).json({ error: "Invalid Credentials" });
    }
    // Reset fail count on success
    await redisClient.del(`failed_login:${ip}`);
    res.json({ success: true, token: "mock-jwt-token", user: { username, fullName } });
});

app.post('/admin/auth', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === ADMIN_PASS) {
        const token = jwt.sign({ role: 'admin' }, SECRET_KEY);
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false });
    }
});

app.get('/admin/blocked-ips', async (req, res) => {
    try {
        const keys = await redisClient.keys('blacklist:*');
        const blockedUsers = [];
        for (const key of keys) {
            const ip = key.split(':')[1];
            const reason = await redisClient.get(key);
            blockedUsers.push({ ip, reason });
        }
        res.json(blockedUsers);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/unban', async (req, res) => {
    try {
        await redisClient.del(`blacklist:${req.body.ip}`);
        await redisClient.del(`rate:${req.body.ip}`);
        await redisClient.del(`failed_login:${req.body.ip}`);
        io.emit('log', { time: new Date().toLocaleTimeString(), ip: 'ADMIN', type: 'MANUAL', status: 'SUCCESS', details: `Unbanned ${req.body.ip}` });
        io.emit('refresh_blocks');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- STARTUP ---
(async () => {
    try {
        await redisClient.connect();
        console.log("✅ Redis Connected");
        server.listen(PORT, () => {
            console.log(`\n🛡️  PCDS Server Online Port ${PORT}`);
            console.log(`   - Victim Site: http://localhost:${PORT}`);
            console.log(`   - Admin Console: http://localhost:${PORT}/admin/login.html`);
            console.log(`   - Hacker Console: http://localhost:${PORT}/hacker`);
        });
    } catch (e) { console.error("❌ Redis Error:", e.message); }
})();