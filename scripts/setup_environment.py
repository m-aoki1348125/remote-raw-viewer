#!/usr/bin/env python3
"""
Setup development environment for Remote Raw Viewer using uv
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path
import click


class EnvironmentSetup:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.backend_dir = project_root / "backend"
        self.frontend_dir = project_root / "frontend"
        self.logs_dir = project_root / "logs"
        self.venv_dir = project_root / ".venv"
        self.node_dir = project_root / ".node"
        
    def create_directories(self):
        """Create necessary directories"""
        dirs = [self.logs_dir, self.node_dir]
        for d in dirs:
            d.mkdir(exist_ok=True)
            click.echo(f"✅ Created directory: {d}")
    
    def setup_python_env(self):
        """Setup Python virtual environment with uv"""
        click.echo("🐍 Setting up Python environment with uv...")
        
        # Create virtual environment
        subprocess.run(["uv", "venv"], check=True, cwd=self.project_root)
        
        # Install Python dependencies
        subprocess.run(["uv", "pip", "install", "-e", ".[dev]"], 
                      check=True, cwd=self.project_root)
        
        click.echo("✅ Python environment ready")
    
    def setup_node_env(self):
        """Setup Node.js environment"""
        click.echo("📦 Setting up Node.js environment...")
        
        # Check if node is available
        if not shutil.which("node"):
            click.echo("❌ Node.js not found. Installing via nodeenv...")
            # Use nodeenv to install Node.js locally
            subprocess.run([
                sys.executable, "-m", "nodeenv", 
                "--node=18.18.0", str(self.node_dir)
            ], check=True)
            
            # Add node to PATH for this session
            node_bin = self.node_dir / "bin"
            os.environ["PATH"] = f"{node_bin}:{os.environ.get('PATH', '')}"
        
        # Install backend dependencies
        click.echo("📦 Installing backend dependencies...")
        subprocess.run(["npm", "install"], check=True, cwd=self.backend_dir)
        
        # Install frontend dependencies
        click.echo("🌐 Installing frontend dependencies...")
        subprocess.run(["npm", "install"], check=True, cwd=self.frontend_dir)
        
        click.echo("✅ Node.js environment ready")
    
    def create_env_files(self):
        """Create environment configuration files"""
        # Backend .env
        backend_env = self.backend_dir / ".env"
        if not backend_env.exists():
            backend_env.write_text("""PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
""")
            click.echo(f"✅ Created {backend_env}")
        
        # Frontend .env
        frontend_env = self.frontend_dir / ".env"
        if not frontend_env.exists():
            frontend_env.write_text("""VITE_API_URL=http://localhost:8000/api
""")
            click.echo(f"✅ Created {frontend_env}")
    
    def setup_ssh_test_server(self):
        """Setup SSH test server if needed"""
        setup_script = self.project_root / "setup-test-server-fixed.sh"
        if setup_script.exists() and setup_script.is_file():
            click.echo("🔐 Setting up SSH test server...")
            try:
                subprocess.run(["bash", str(setup_script)], check=True)
                click.echo("✅ SSH test server configured")
            except subprocess.CalledProcessError:
                click.echo("⚠️  SSH test server setup failed (may require sudo)")
    
    def run(self):
        """Run complete setup"""
        click.echo("🚀 Setting up Remote Raw Viewer development environment")
        click.echo("=" * 50)
        
        self.create_directories()
        self.setup_python_env()
        self.setup_node_env()
        self.create_env_files()
        self.setup_ssh_test_server()
        
        click.echo("\n✅ Environment setup complete!")
        click.echo("\n📋 Next steps:")
        click.echo("1. Activate the environment: source .venv/bin/activate")
        click.echo("2. Start development: uv run start-dev")
        click.echo("3. Or manually:")
        click.echo("   - Backend: cd backend && npm run dev")
        click.echo("   - Frontend: cd frontend && npm run dev")


@click.command()
@click.option('--project-root', 
              default='.',
              type=click.Path(exists=True, file_okay=False, dir_okay=True),
              help='Project root directory')
def main(project_root):
    """Setup Remote Raw Viewer development environment"""
    setup = EnvironmentSetup(Path(project_root).resolve())
    try:
        setup.run()
    except Exception as e:
        click.echo(f"❌ Setup failed: {e}", err=True)
        sys.exit(1)


if __name__ == "__main__":
    main()