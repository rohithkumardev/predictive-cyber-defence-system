const TARGET_URL = 'http://localhost:3000';

function log(elementId, message, type = 'info') {
    const logWindow = document.getElementById(elementId);
    const entry = document.createElement('span');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logWindow.appendChild(entry);
    logWindow.scrollTop = logWindow.scrollHeight;
}

// 1. BRUTE FORCE ATTACK
// 1. BRUTE FORCE ATTACK
async function startBruteForce() {
    const username = document.getElementById('bf-username').value;
    const logId = 'bf-log';
    const passwords = [
        '123456', 'password', 'admin', 'qwerty', 'welcome',
        'login', 'pass123', 'admin123', 'root', 'toor',
        'master', 'ninja', 'secret', 'access', '111111',
        'user', 'guest', 'hello', 'football', 'dragon'
    ];

    log(logId, `Creating dictionary attack on user: ${username}...`);

    for (const pass of passwords) {
        log(logId, `Trying password: ${pass}...`);
        try {
            const res = await fetch(`${TARGET_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: pass })
            });

            if (res.ok) {
                log(logId, `SUCCESS! Password found: ${pass}`, 'success');
                break;
            } else {
                const data = await res.json();
                if (data.error === 'ACCOUNT_LOCKED') {
                    log(logId, `FAILED: Account Locked by Defense System`, 'error');
                    break;
                }
                log(logId, `Failed: ${data.error}`, 'error');
            }
        } catch (e) {
            log(logId, `Connection Error: ${e.message}`, 'error');
        }
        await new Promise(r => setTimeout(r, 200)); // Faster delay (200ms)
    }
}

// 2. DDoS FLOOD
async function startDDoS() {
    const logId = 'ddos-log';
    log(logId, "Initiating High-Frequency Request Flood...");

    let blocked = false;
    for (let i = 0; i < 20; i++) {
        if (blocked) break;

        fetch(`${TARGET_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'ddos_bot', password: 'pwd' })
        }).then(async res => {
            if (res.status === 429 || res.status === 403) {
                log(logId, `REQUEST BLOCKED: ${res.statusText}`, 'error');
                blocked = true;
            } else {
                log(logId, `Request ${i + 1} sent... OK`);
            }
        }).catch(e => log(logId, "Network Error (Server might be down)", 'error'));

        await new Promise(r => setTimeout(r, 50)); // Fast interval
    }
}

// 3. SQL INJECTION
async function launchSQLi() {
    const logId = 'sqli-log';
    const payloads = ["' OR '1'='1", "admin' --", "' UNION SELECT 1,2,3--"];

    log(logId, "Injecting SQL Payloads...");

    for (const payload of payloads) {
        log(logId, `Payload: ${payload}`);
        try {
            const res = await fetch(`${TARGET_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: payload, password: 'password' })
            });

            if (res.status === 403) {
                const data = await res.json();
                log(logId, `BLOCKED: ${data.message || data.error}`, 'error');
            } else {
                log(logId, `Server Response: ${res.status}`);
            }
        } catch (e) {
            log(logId, `Error: ${e.message}`, 'error');
        }
    }
}

// 4. XSS ATTACK
async function launchXSS() {
    const logId = 'xss-log';
    const payload = "<script>alert('XSS')</script>";

    log(logId, `Injecting Script: ${payload}`);

    try {
        const res = await fetch(`${TARGET_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: payload, password: 'password' })
        });

        if (res.status === 403) {
            const data = await res.json();
            log(logId, `BLOCKED: ${data.message || data.error}`, 'error');
        } else {
            log(logId, `Server Response: ${res.status}`);
        }
    } catch (e) {
        log(logId, `Error: ${e.message}`, 'error');
    }
}
