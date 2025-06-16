#!/usr/bin/env python3
"""
Start development servers for Remote Raw Viewer
"""
import os
import sys
import subprocess
import time
import signal
import atexit
from pathlib import Path
from typing import List, Optional
import click
import requests


class DevelopmentServer:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.backend_dir = project_root / "backend"
        self.frontend_dir = project_root / "frontend"
        self.logs_dir = project_root / "logs"
        self.processes: List[subprocess.Popen] = []
        
        # Ensure logs directory exists
        self.logs_dir.mkdir(exist_ok=True)
        
        # Register cleanup on exit
        atexit.register(self.cleanup)
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        click.echo("\n🛑 Shutting down servers...")
        self.cleanup()
        sys.exit(0)
    
    def cleanup(self):
        """Clean up all processes"""
        for proc in self.processes:
            if proc.poll() is None:
                click.echo(f"  Stopping process {proc.pid}...")
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
    
    def check_port(self, port: int) -> bool:
        """Check if a port is available"""
        try:
            response = requests.get(f"http://localhost:{port}", timeout=1)
            return True
        except:
            return False
    
    def wait_for_server(self, name: str, url: str, timeout: int = 30) -> bool:
        """Wait for a server to start"""
        click.echo(f"⏳ Waiting for {name} to start...")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = requests.get(url, timeout=2)
                if response.status_code < 500:
                    click.echo(f"✅ {name} is running at {url}")
                    return True
            except requests.exceptions.RequestException:
                pass
            time.sleep(2)
        
        click.echo(f"❌ {name} failed to start within {timeout} seconds")
        # Show log snippet for debugging
        log_file = self.logs_dir / f"{name.lower()}.log"
        if log_file.exists():
            click.echo(f"📝 Last few lines from {log_file}:")
            try:
                with open(log_file, 'r') as f:
                    lines = f.readlines()
                    for line in lines[-5:]:
                        click.echo(f"   {line.rstrip()}")
            except:
                pass
        return False
    
    def start_backend(self) -> Optional[subprocess.Popen]:
        """Start backend server"""
        click.echo("📦 Starting backend server...")
        
        # Check if already running
        if self.check_port(8000):
            click.echo("⚠️  Backend already running on port 8000")
            return None
        
        # Setup environment
        env = os.environ.copy()
        node_bin = self.project_root / ".node" / "bin"
        if node_bin.exists():
            env["PATH"] = f"{node_bin}:{env.get('PATH', '')}"
        
        # Start backend
        log_file = open(self.logs_dir / "backend.log", "w")
        proc = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=self.backend_dir,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            env=env
        )
        
        self.processes.append(proc)
        
        # Wait for backend to be ready
        if self.wait_for_server("Backend", "http://localhost:8000/health"):
            return proc
        else:
            proc.terminate()
            return None
    
    def start_frontend(self) -> Optional[subprocess.Popen]:
        """Start frontend server"""
        click.echo("🌐 Starting frontend server...")
        
        # Check if already running
        if self.check_port(3000):
            click.echo("⚠️  Frontend already running on port 3000")
            return None
        
        # Setup environment
        env = os.environ.copy()
        node_bin = self.project_root / ".node" / "bin"
        if node_bin.exists():
            env["PATH"] = f"{node_bin}:{env.get('PATH', '')}"
        
        # Start frontend
        log_file = open(self.logs_dir / "frontend.log", "w")
        proc = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=self.frontend_dir,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            env=env
        )
        
        self.processes.append(proc)
        
        # Wait for frontend to be ready (longer timeout for Vite)
        if self.wait_for_server("Frontend", "http://localhost:3000", timeout=60):
            return proc
        else:
            proc.terminate()
            return None
    
    def start(self):
        """Start all development servers"""
        click.echo("🚀 Starting Remote Raw Viewer development servers")
        click.echo("=" * 50)
        
        # Start servers
        backend_proc = self.start_backend()
        frontend_proc = self.start_frontend()
        
        if not backend_proc or not frontend_proc:
            click.echo("\n❌ Failed to start all servers")
            self.cleanup()
            sys.exit(1)
        
        # Success message
        click.echo("\n✅ All servers running!")
        click.echo("=" * 50)
        click.echo("🌐 Frontend:  http://localhost:3000")
        click.echo("📦 Backend:   http://localhost:8000")
        click.echo("📊 Health:    http://localhost:8000/health")
        click.echo("\n📝 Logs:")
        click.echo(f"  Backend:  tail -f {self.logs_dir}/backend.log")
        click.echo(f"  Frontend: tail -f {self.logs_dir}/frontend.log")
        click.echo("\n🛑 Press Ctrl+C to stop all servers")
        
        # Keep running
        try:
            while True:
                # Check if processes are still running
                for proc in self.processes:
                    if proc.poll() is not None:
                        click.echo(f"\n⚠️  Process {proc.pid} has stopped")
                        self.cleanup()
                        sys.exit(1)
                time.sleep(1)
        except KeyboardInterrupt:
            pass


@click.command()
@click.option('--project-root', 
              default='.',
              type=click.Path(exists=True, file_okay=False, dir_okay=True),
              help='Project root directory')
def main(project_root):
    """Start Remote Raw Viewer development servers"""
    server = DevelopmentServer(Path(project_root).resolve())
    server.start()


if __name__ == "__main__":
    main()