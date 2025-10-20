"""
EAILI5 Backend Startup Script
Ensures uvicorn runs from the correct backend directory with virtual environment
"""
import os
import sys
import subprocess
import uvicorn

# Ensure we're in the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

# Add backend directory to Python path
sys.path.insert(0, backend_dir)

print(f"Starting EAILI5 backend from: {backend_dir}")
print(f"Python path: {sys.path[0]}")

# Check if virtual environment exists
venv_path = os.path.join(backend_dir, ".venv")
if not os.path.exists(venv_path):
    print("ERROR: Virtual environment not found. Please run 'python -m venv .venv' first.")
    sys.exit(1)

# Use the virtual environment's Python executable
venv_python = os.path.join(venv_path, "Scripts", "python.exe")
if not os.path.exists(venv_python):
    print("ERROR: Virtual environment Python executable not found.")
    sys.exit(1)

print(f"Using virtual environment Python: {venv_python}")

if __name__ == "__main__":
    # Use subprocess to run uvicorn with the virtual environment
    subprocess.run([
        venv_python, "-m", "uvicorn", 
        "main:app", 
        "--host", "127.0.0.1", 
        "--port", "8000", 
        "--reload"
    ], cwd=backend_dir)
