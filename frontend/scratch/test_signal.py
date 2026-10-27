import numpy as np
from PIL import Image

orig_path = r'C:\Users\LENOVO IP FLEX 5\.gemini\antigravity-ide\brain\a0994910-b87b-4327-a8e9-f33762b83f58\.user_uploaded\media_1793093419219.jpg'
img = Image.open(orig_path).convert('RGB')
arr = np.array(img, dtype=float)

# Background color estimate
bg = np.array([10.4, 16.3, 31.8])

# Let's compute color distance and also color elevation over background
diff = arr - bg

# In dark background or dark center glow:
# Even in the center glow, max(R,G) is <= 35, and B is <= 105.
# For lines:
# Cyan/blue lines: G > 45, B > 120.
# Pink/magenta lines: R > 50, B > 50.
# White text: R > 150, G > 150, B > 150.
# Electric blue lines: B > 140 and G > 35.

# Let's compute a line feature response:
# Brightness above dark background:
r = arr[:, :, 0]
g = arr[:, :, 1]
b = arr[:, :, 2]
lum = 0.299 * r + 0.587 * g + 0.114 * b

# In the center background haze, R~25, G~25, B~95, lum~33.
# Let's penalize non-saturated dark blues:
# Notice that for background haze, it's dark (lum < 40) AND low saturation or low R+G.
# Excess brightness:
excess_r = np.maximum(0, r - 32)
excess_g = np.maximum(0, g - 32)
excess_b = np.maximum(0, b - 50)
excess_lum = np.maximum(0, lum - 35)

# Combined strength:
# We want pink/magenta (high excess_r), cyan/blue (high excess_g or high excess_b with good excess_g),
# and white (high all).
# Notice: the dark haze has excess_r ~ 0, excess_g ~ 0, and excess_b ~ 45, excess_lum ~ 0.
# If we weight excess_r*1.8 + excess_g*2.0 + excess_b*0.8 + excess_lum*1.5:
signal = 1.8 * excess_r + 2.0 * excess_g + 0.8 * excess_b + 1.5 * excess_lum

# Check signal distribution in center haze vs lines:
center_haze = signal[450:500, 470:500]
center_line = signal[520:540, 520:540]
border = signal[:50, :50]

print('Border signal max:', border.max())
print('Center haze signal min/mean/max:', center_haze.min(), center_haze.mean(), center_haze.max())
print('Center line signal min/mean/max:', center_line.min(), center_line.mean(), center_line.max())
