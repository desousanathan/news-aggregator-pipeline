import subprocess
import sys
import time
import os

def run(cmd, cwd=None):
    print(f"\n{'='*50}")
    print(f"Running: {' '.join(cmd)}")
    print('='*50)
    result = subprocess.run(cmd, cwd=cwd)
    if result.returncode != 0:
        print(f"\n❌ Failed: {' '.join(cmd)}")
        sys.exit(1)
    print(f"✅ Done: {' '.join(cmd)}")

if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # 3. Start FastAPI in background
    print("\n" + "="*50)
    print("Starting FastAPI server...")
    api = subprocess.Popen([sys.executable, "app.py"], cwd=os.path.join(base, "MongoDB"))
    time.sleep(3)
    print("✅ API running on http://localhost:8000")

    # 4. Start Next.js
    print("\n" + "="*50)
    print("Starting Next.js...")
    try:
        next_proc = subprocess.Popen(["npm", "run", "dev"], cwd=os.path.join(base, "news-dashboard"))
        next_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        api.terminate()
        print("✅ All processes stopped.")