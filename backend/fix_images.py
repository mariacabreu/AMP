
import re

# Read the app.py file
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all image_url with external URLs to empty strings
pattern = r"'image_url':\s*'https?://[^']*'"
replacement = "'image_url': ''"
new_content = re.sub(pattern, replacement, content)

# Write back to app.py
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced all external image URLs!")
