# Slowloris Tool
![Logo](https://github.com/sarthakpriyadarshi/Slowloris-Tool/blob/main/images/Slowloris-Tool.png?raw=true)

## Overview

This project consists of a FastAPI backend and a React (Next.js) frontend for performing network diagnostics, analyzing server response behavior, and simulating high-traffic conditions.

## Backend (FastAPI)

📌 Features

Supports multiple target domains/IPs

Adjustable parameters: connection limits, request intervals, and timeouts

Asynchronous execution using multi-threading

RESTful API with /start/, /stop/, and /status/ endpoints

## 🚀 Installation & Setup

Clone the repository

```shell
git clone https://github.com/sarthakpriyadarshi/Slowloris-Tool.git
cd backend
```

Create a virtual environment (optional but recommended)

```python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies

```shell
pip install -r requirements.txt
```

## Run the server

```shell
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API Documentation (Swagger UI)

Open your browser and go to: http://127.0.0.1:8000/docs

Frontend (Next.js + Tailwind)

## 📌 Features

- Simple UI for interacting with the backend

- Form-based input for network diagnostics

- Displays active processes and allows stopping them

- Uses shadcn/ui components for a modern look

## 🚀 Installation & Setup

Navigate to the frontend directory

```shell
cd frontend
```

Install dependencies

```shell
npm install
```

Run the frontend

```shell
npm run dev
```

Access the UI

Open your browser and go to: http://localhost:3000

## API Endpoints

| Method | Endpoint   | Description                  |
|--------|------------|------------------------------|
| POST   | /start/    | Start a diagnostic process   |
| POST   | /stop/     | Stop a specific process      |
| GET    | /status/   | Get list of active processes |

Dependencies

Backend:

- fastapi

- uvicorn

- httpx

- asyncio

Frontend:

- next.js

- react

- tailwindcss

- shadcn/ui

- clsx

- axios
