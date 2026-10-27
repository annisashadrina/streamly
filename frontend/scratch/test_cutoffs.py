import numpy as np
from PIL import Image

orig_path = r'C:\Users\LENOVO IP FLEX 5\.gemini\antigravity-ide\brain\a0994910-b87b-4327-a8e9-f33762b83f58\.user_uploaded\media_1793093419219.jpg'
img = Image.open(orig_path).convert('RGB')
arr = np.array(img, dtype=float)

# Background color in corners
bg = np.array([10.4, 16.3, 31.8])

r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
lum = 0.299 * r + 0.587 * g + 0.114 * b

# In the center haze, r~25, g~25, b~95, lum~33.
# The lines have:
# r > 45 (pink/magenta), g > 50 (cyan), or (b > 130 and (r > 35 or g > 35)).
# Let's define line_strength strictly:
excess_r = np.maximum(0, r - 35)
excess_g = np.maximum(0, g - 35)
# In haze b is up to 95. So excess_b should only start above 95!
excess_b = np.maximum(0, b - 95)
excess_lum = np.maximum(0, lum - 38)

line_strength = 2.0 * excess_r + 2.0 * excess_g + 1.0 * excess_b + 2.0 * excess_lum

for low, high in [(10, 45), (15, 55), (20, 60), (25, 70)]:
    t = np.clip((line_strength - low) / (high - low), 0.0, 1.0)
    alpha = t * t * (3.0 - 2.0 * t)
    # Check center gap (y=440:500, x=460:500)
    center_gap_alpha = alpha[440:490, 460:490].mean()
    # Check actual line (y=432, x=488)
    line_alpha = alpha[432, 488]
    print(f'Cutoff ({low}, {high}): center gap alpha={center_gap_alpha:.4f}, line alpha={line_alpha:.4f}')
