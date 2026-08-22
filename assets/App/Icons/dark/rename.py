#!/usr/bin/env python3
import os
import sys

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.heic', '.heif'}

def rename_images():
    folder = os.path.dirname(os.path.abspath(__file__))

    name = input("Enter a name prefix: ").strip()
    if not name:
        print("No name entered. Exiting.")
        sys.exit(1)

    # Collect image files only
    images = [
        f for f in os.listdir(folder)
        if os.path.isfile(os.path.join(folder, f))
        and os.path.splitext(f)[1].lower() in IMAGE_EXTENSIONS
    ]

    if not images:
        print("No images found in this folder. Exiting.")
        sys.exit(0)

    # Sort by modification time (oldest first)
    images.sort(key=lambda f: os.path.getmtime(os.path.join(folder, f)))

    print(f"\nFound {len(images)} image(s). Renaming...")

    for i, filename in enumerate(images, start=1):
        ext = os.path.splitext(filename)[1]
        new_name = f"{name}{i}{ext}"
        src = os.path.join(folder, filename)
        dst = os.path.join(folder, new_name)

        if os.path.exists(dst) and src != dst:
            print(f"  Skipped: '{new_name}' already exists (would overwrite).")
            continue

        os.rename(src, dst)
        print(f"  {filename} → {new_name}")

    print("\nDone.")

if __name__ == "__main__":
    rename_images()
