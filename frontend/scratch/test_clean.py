import numpy as np
from PIL import Image

orig_path = r'C:\Users\LENOVO IP FLEX 5\.gemini\antigravity-ide\brain\a0994910-b87b-4327-a8e9-f33762b83f58\.user_uploaded\media_1793093419219.jpg'
img = Image.open(orig_path).convert('RGB')
arr = np.array(img, dtype=float)

r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
lum = 0.299 * r + 0.587 * g + 0.114 * b

# Background baseline
bg = np.array([10.4, 16.3, 31.8])

# Foreground signal metric:
# Measure excitation above the dark background:
# Gaps have lum <= 38.5, r <= 36, g <= 34.
# Lines have lum >= 55, r >= 46, or g >= 48.
exc_lum = np.maximum(0.0, lum - 38.0)
exc_r   = np.maximum(0.0, r - 36.0)
exc_g   = np.maximum(0.0, g - 34.0)
exc_b   = np.maximum(0.0, b - 110.0) # only blue above the highest gap blue

# Weighted excitation:
signal = exc_lum * 1.5 + exc_r * 1.2 + exc_g * 1.5 + exc_b * 0.8

# Smoothstep ramp:
# Starts at 0 when signal is below 2.0, reaches 1.0 when signal is 35.0
low = 2.0
high = 35.0
t = np.clip((signal - low) / (high - low), 0.0, 1.0)
alpha = t * t * (3.0 - 2.0 * t)

# De-multiply color so there is ZERO black fringing:
# Notice: where alpha is low, subtracting the dark background leaves clean pure saturated hue!
fg = np.zeros_like(arr)
for c in range(3):
    # To prevent division by zero and overshooting:
    fg[:, :, c] = np.clip((arr[:, :, c] - bg[c] * (1.0 - alpha)) / np.maximum(alpha, 0.08), 0, 255)

# Save as RGBA:
rgba = np.dstack([fg, (alpha * 255).astype(np.uint8)]).astype(np.uint8)
out_img = Image.fromarray(rgba, 'RGBA')

# Composite on pure white
white_bg = Image.new('RGB', out_img.size, (255, 255, 255))
white_bg.paste(out_img, mask=out_img.split()[3])
white_bg.save(r'D:\KULIAH\SEMESTER 5\IMPAL\tubes\Streamly\frontend\scratch\test_clean_on_white.png')

# Composite on dark navy (to ensure it still looks gorgeous on dark backgrounds)
dark_bg = Image.new('RGB', out_img.size, (15, 23, 42))
dark_bg.paste(out_img, mask=out_img.split()[3])
dark_bg.save(r'D:\KULIAH\SEMESTER 5\IMPAL\tubes\Streamly\frontend\scratch\test_clean_on_dark.png')

print("Generated test_clean_on_white.png and test_clean_on_dark.png")
