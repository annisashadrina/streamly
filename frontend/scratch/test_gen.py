import numpy as np
from PIL import Image

orig_path = r'C:\Users\LENOVO IP FLEX 5\.gemini\antigravity-ide\brain\a0994910-b87b-4327-a8e9-f33762b83f58\.user_uploaded\media_1793093419219.jpg'
img = Image.open(orig_path).convert('RGB')
arr = np.array(img, dtype=float)

# Background color in corners
bg = np.array([10.4, 16.3, 31.8])

# Let's test a clean alpha extraction:
# Luminance and max channel:
r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
lum = 0.299 * r + 0.587 * g + 0.114 * b
mx = np.maximum.reduce([r, g, b])

# In the haze, mx is around 70-100 (mostly blue), but lum is < 45.
# For lines:
# - Pink/magenta lines: r is 150-255, lum is 70-180
# - Cyan/blue lines: g is 100-200, b is 200-255, lum is 90-180
# - Indigo lines: b is 150-240, r is 60-120, lum is 60-120
# - White text: r, g, b are all 200-255, lum is 200-255

# Let's define an effective brightness:
# Subtract dark background component:
# Pure background has r~10, g~16, b~32.
# Ambient haze has r~25, g~25, b~95.
# If we define line_strength:
line_strength = np.maximum(0, lum - 35) + 0.5 * np.maximum(0, r - 35) + 0.5 * np.maximum(0, g - 35) + 0.2 * np.maximum(0, b - 80)

# Smoothstep alpha from line_strength:
low = 10.0
high = 50.0
t = np.clip((line_strength - low) / (high - low), 0.0, 1.0)
alpha = t * t * (3.0 - 2.0 * t)

# For foreground color:
# De-multiply against background to prevent dark fringes:
# For areas where alpha is small, blend smoothly to line color
fg = np.zeros_like(arr)
mask = alpha > 0.01
# Background to subtract: where there is haze, background is higher, but even subtracting dark bg removes black fringing
for c in range(3):
    fg[:, :, c] = np.clip((arr[:, :, c] - bg[c] * (1.0 - alpha)) / np.maximum(alpha, 0.05), 0, 255)

# Boost colors slightly on light background so neon colors pop vibrantly without being washed out:
# Neon colors look amazing on white when saturation is rich!

# Save transparent RGBA
rgba = np.dstack([fg, (alpha * 255).astype(np.uint8)]).astype(np.uint8)
test_out = Image.fromarray(rgba, 'RGBA')
test_out.save(r'D:\KULIAH\SEMESTER 5\IMPAL\tubes\Streamly\frontend\scratch\test_transparent.png')

# Also composite onto pure white and save:
white_bg = Image.new('RGB', test_out.size, (255, 255, 255))
white_bg.paste(test_out, mask=test_out.split()[3])
white_bg.save(r'D:\KULIAH\SEMESTER 5\IMPAL\tubes\Streamly\frontend\scratch\test_on_white.png')

print("Saved test_transparent.png and test_on_white.png")
