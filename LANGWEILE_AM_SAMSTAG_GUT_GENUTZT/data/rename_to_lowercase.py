import os

def rename_files_to_lowercase(folder_path):
    for filename in os.listdir(folder_path):
        replaces = [
            (" ", "_"),
            (".", ""),
            ("card_", ""),
            ("_alpha", ""),
            ("_glow", ""),
            ("_frameepic", ""),
            ("_purple", ""),
            ("_frame", ""),
            ("_01", ""),
            ("_2025", ""),
            ("png", ".png")
        ]
        lower_filename = filename.lower()
        for old, new in replaces:
            lower_filename = lower_filename.replace(old, new)
        src = os.path.join(folder_path, filename)
        dst = os.path.join(folder_path, lower_filename)
        if filename != lower_filename:
            os.rename(src, dst)
            print(f"Renamed: {filename} -> {lower_filename}")

if __name__ == "__main__":
    rename_files_to_lowercase(r"C:\Users\grego\Desktop\CR Wordle\images")
