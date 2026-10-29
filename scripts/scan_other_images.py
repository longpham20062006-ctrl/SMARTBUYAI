import os

valid_ext = {'.jpg', '.jpeg', '.png', '.webp', '.avif'}
for root, dirs, files in os.walk('.'):
    # skip node_modules, .git, target, dist
    if any(skip in root for skip in ['node_modules', '.git', 'target', 'dist', '.system_generated']):
        continue
    for f in files:
        if os.path.splitext(f)[1].lower() in valid_ext:
            if not root.startswith('.\\public') and not root.startswith('./public'):
                print(os.path.join(root, f))

