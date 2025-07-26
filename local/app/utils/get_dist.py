import os
import shutil
import subprocess
from pathlib import Path

def build_and_move_dist():
    target_parent = Path(__file__).parent.parent.resolve()
    target_dist = target_parent / "dist"

    if target_dist.exists():
        print("The ../dist folder already exists. Done.")
        return "Done"

    frontend_dir = (Path(__file__).parent.parent.parent / "frontend").resolve()

    if not frontend_dir.exists():
        raise FileNotFoundError(f"Frontend directory {frontend_dir} does not exist.")

    print(f"Changing to {frontend_dir} and running 'npm install' and 'npm run build'...")
    npm_command = "npm.cmd" if os.name == "nt" else "npm"
    subprocess.check_call([npm_command, "install"], cwd=frontend_dir)
    subprocess.check_call([npm_command, "run", "build"], cwd=frontend_dir)


    dist_folder = frontend_dir / "dist"
    if not dist_folder.exists():
        raise FileNotFoundError("dist folder not found after build.")

    print(f"Moving {dist_folder} to {target_parent}...")
    shutil.move(str(dist_folder), str(target_parent))

    print("Process completed.")
    return "Done"