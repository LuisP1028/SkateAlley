import os

def lowercase_everything(root_dir):
    for root, dirs, files in os.walk(root_dir, topdown=False):
        # Rename files
        for name in files:
            old_path = os.path.join(root, name)
            new_path = os.path.join(root, name.lower())
            if old_path != new_path:
                os.rename(old_path, new_path)
        
        # Rename directories
        for name in dirs:
            old_path = os.path.join(root, name)
            new_path = os.path.join(root, name.lower())
            if old_path != new_path:
                os.rename(old_path, new_path)

if __name__ == "__main__":
    if os.path.exists("vcsky"):
        print("Starting lowercase conversion...")
        lowercase_everything("vcsky")
        print("Conversion complete.")