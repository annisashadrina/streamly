import numpy as np
from PIL import Image, ImageFilter

orig_path = r'C:\Users\LENOVO IP FLEX 5\.gemini\antigravity-ide\brain\a0994910-b87b-4327-a8e9-f33762b83f58\.user_uploaded\media_1793093419219.jpg'
img = Image.open(orig_path).convert('RGB')
arr = np.array(img, dtype=float)

# Background estimation:
# In areas where there are no bright lines, what is the background?
# Notice: the lines have sharp edges and high gradients or high color saturation/luminance.
# But let's also look at the color:
# Background is dark blue: R is low, G is low, B is low-moderate.
# Specifically, for background:
# R <= 35, G <= 35, and (B - R) is <= 70 or lum <= 38.
# Whereas for any line or glow that belongs to the logo:
# Either:
# 1. R >= 50 (pink, magenta, violet, white)
# 2. G >= 50 (cyan, blue, white)
# 3. B >= 120 (rich electric blue/violet) with R or G elevated
# 4. Lum >= 42

# Let's test this mask!
mask_lines = (arr[:,:,0] > 45) | (arr[:,:,1] > 45) | (arr[:,:,2] > 115) | (0.299*arr[:,:,0] + 0.587*arr[:,:,1] + 0.114*arr[:,:,2] > 40)

print("Percent kept in center with basic test:", mask_lines[400:600, 400:650].mean())
print("Percent kept in pure background (0:100, 0:100):", mask_lines[:100, :100].mean())
