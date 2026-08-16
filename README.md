# 🛡️ Predictive Cyber Defence System (PCDS)

An end-to-end cybersecurity platform designed to monitor suspicious activity, detect common attack patterns, analyze security events, and automatically respond to malicious traffic.

## 📌 Overview

The **Predictive Cyber Defence System (PCDS)** is a cybersecurity monitoring and defensive-response platform built around a Node.js backend and multiple web interfaces.

The system simulates a real-world security environment containing:

* A protected victim application
* An administrative security console
* A controlled attacker/hacker interface
* Real-time security event monitoring
* Automated IP blocking
* Request rate limiting
* Malicious-payload detection
* Security-log ingestion and analysis

The project was developed to understand how defensive security mechanisms can work together to detect and respond to suspicious activity.

## 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │   Hacker Interface   │
                         │ Attack Simulations   │
                         └──────────┬───────────┘
                                    │
                                    ▼
┌──────────────────┐      ┌──────────────────────┐
│ Victim Web App   │─────▶│   Node.js / Express  │
│ User Operations  │      │      Backend         │
└──────────────────┘      └──────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌──────────┐    ┌────────────┐    ┌───────────┐
              │  Redis   │    │ Socket.IO  │    │ Logstash  │
              │          │    │ Real-time  │    │ TCP Logs  │
              │ Rate     │    │ Events     │    │           │
              │ Limits   │    │            │    │           │
              │ IP Bans  │    │            │    │           │
              └──────────┘    └────────────┘    └─────┬─────┘
                                                      │
                                                      ▼
                                               ┌──────────────┐
                                               │ Elasticsearch│
                                               │ Security     │
                                               │ Events       │
                                               └──────┬───────┘
                                                      │
                                                      ▼
                                               ┌──────────────┐
                                               │ Admin        │
                                               │ Dashboard    │
                                               └──────────────┘
```

## 🔐 Key Features

### 1. Request Monitoring

The backend monitors incoming HTTP requests and records relevant security events.

### 2. IP Blacklisting

Suspicious IP addresses can be automatically added to a Redis-based blacklist.

Blocked requests are rejected before reaching protected application routes.

### 3. Rate Limiting

Redis is used to maintain per-IP request counters.

When an IP exceeds the configured request threshold, the system identifies the activity as a traffic anomaly and triggers a defensive response.

### 4. Malicious Payload Detection

The defensive middleware checks incoming request payloads for known malicious signatures, including patterns associated with:

* SQL injection
* Cross-site scripting (XSS)

Detected malicious traffic can trigger automatic IP blocking.

### 5. Brute-Force Protection

Repeated failed login attempts are tracked using Redis.

Excessive failed attempts can trigger an automatic IP block.

### 6. Real-Time Security Monitoring

Socket.IO provides real-time communication between the backend and the security dashboard.

Security events can include:

* HTTP requests
* blocked requests
* defense actions
* traffic anomalies
* manual administrative actions

### 7. Security Log Pipeline

Security events can be forwarded through Logstash using TCP and JSON Lines.

Logstash processes the events and forwards them to Elasticsearch for storage and analysis.

### 8. Administrative Console

The administrative interface provides security-management capabilities such as:

* Viewing blocked IP addresses
* Unblocking IP addresses
* Monitoring security events
* Observing defensive actions

### 9. Multiple Application Interfaces

The project contains three interfaces:

| Interface | Purpose                                  |
| --------- | ---------------------------------------- |
| Victim    | Simulated protected application          |
| Hacker    | Controlled attack simulation environment |
| Admin     | Security monitoring and response console |

## 🛠️ Technology Stack

### Backend

* Node.js
* Express.js
* Socket.IO
* JSON Web Tokens (JWT)

### Security & Detection

* IP blacklisting
* Rate limiting
* Malicious payload signature detection
* Brute-force detection
* Automated defensive response

### Data & Logging

* Redis
* Elasticsearch
* Logstash

### Frontend

* HTML
* CSS
* JavaScript

### Development

* Git
* GitHub
* Docker

## 📂 Project Structure

```text
PCDS/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── logstash.conf
│   └── .env.example
│
├── frontend_admin/
│   ├── index.html
│   └── login.html
│
├── frontend_hacker/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── frontend_victim/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── accounts.html
│   ├── transfers.html
│   ├── reports.html
│   └── settings.html
│
├── .gitignore
└── README.md
```

## ⚙️ Prerequisites

The project requires:

* Node.js
* npm
* Redis
* Elasticsearch
* Logstash

## 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/rohithkumardev/predictive-cyber-defence-system.git
cd predictive-cyber-defence-system
```

Install backend dependencies:

```bash
cd backend
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Configure the required environment variables in `.env`.

Example:

```env
SECRET_KEY=your-secret-key
ADMIN_PASS=your-admin-password
```

> Never commit the `.env` file to GitHub.

## ▶️ Running the Backend

From the `backend` directory:

```bash
npm start
```

The server runs on:

```text
http://localhost:3000
```

Available interfaces:

```text
Victim Application:
http://localhost:3000

Admin Console:
http://localhost:3000/admin/login.html

Hacker Interface:
http://localhost:3000/hacker
```

## 📊 Logging Pipeline

PCDS can send security events through the following pipeline:

```text
Node.js Backend
      │
      ▼
TCP / JSON Lines
      │
      ▼
   Logstash
      │
      ▼
Elasticsearch
      │
      ▼
Security Monitoring
```

The included `logstash.conf` defines the TCP input and Elasticsearch output configuration.

## 🧪 Security Scenarios

The project provides a controlled environment for demonstrating defensive mechanisms against scenarios including:

* SQL injection-style payloads
* XSS-style payloads
* Request flooding
* Brute-force login attempts
* Suspicious IP activity

These simulations are intended for controlled local testing and demonstration.

## 🔒 Security Considerations

Sensitive configuration values are stored using environment variables rather than committed directly to the repository.

The repository intentionally excludes:

```text
.env
node_modules/
*.db
*.sqlite
```

A `.env.example` file is provided to document the required configuration without exposing actual credentials.

## 🎯 Learning Outcomes

Through this project, the following concepts were explored and implemented:

* Backend development with Node.js and Express
* REST API development
* Authentication using JWT
* Redis-based caching and counters
* Rate limiting
* IP-based threat response
* Security event logging
* Real-time communication using Socket.IO
* Log ingestion using Logstash
* Security-event storage using Elasticsearch
* Web application security concepts
* Git and GitHub project management

## 👨‍💻 Author

**Konda Rohith Kumar**

B.Tech — Computer Science Engineering
Keshav Memorial Institute of Technology (KMIT)

GitHub: https://github.com/rohithkumardev
LinkedIn: https://www.linkedin.com/in/rohith-kumar-11aa04399/
