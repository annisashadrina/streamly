import numpy as np
from PIL import Image, ImageFilter

orig_path = r'C:\Users\LENOVO IP FLEX 5\.gemini\antigravity-ide\brain\a0994910-b87b-4327-a8e9-f33762b83f58\.user_uploaded\media_1793093419219.jpg'
im = Image.open(orig_path).convert('RGB')
arr = np.array(im, dtype=float)

# Background color in corners
bg = np.array([10.4, 16.3, 31.8])

# 1. Morphological opening for the wave section (y < 645)
# Using MinFilter(7) then MaxFilter(7)
im_wave = im.crop((0, 0, 1024, 645))
opened_wave = im_wave.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))
arr_wave = np.array(im_wave, dtype=float)
opened_arr_wave = np.array(opened_wave, dtype=float)

tophat_wave = np.maximum(0, arr_wave - opened_arr_wave)
tophat_wave_lum = 0.299 * tophat_wave[:,:,0] + 0.587 * tophat_wave[:,:,1] + 0.114 * tophat_wave[:,:,2]

# Also combine with raw line luminance excitation to keep smooth antialiased outer curves
lum_wave = 0.299 * arr_wave[:,:,0] + 0.587 * arr_wave[:,:,1] + 0.114 * arr_wave[:,:,2]
r_w, g_w, b_w = arr_wave[:,:,0], arr_wave[:,:,1], arr_wave[:,:,2]
raw_exc = np.maximum(0, lum_wave - 42.0) + 0.5 * np.maximum(0, r_w - 42.0) + 0.5 * np.maximum(0, g_w - 42.0)

# Wave signal: Tophat dominates in high-density center, raw_exc preserves delicate tips
wave_signal = tophat_wave_lum * 0.8 + raw_exc * 0.7

low_w, high_w = 6.0, 32.0
t_w = np.clip((wave_signal - low_w) / (high_w - low_w), 0.0, 1.0)
alpha_wave = t_w * t_w * (3.0 - 2.0 * t_w)

# Color recovery for wave:
fg_wave = np.zeros_like(arr_wave)
for c in range(3):
    fg_wave[:, :, c] = np.clip((arr_wave[:, :, c] - bg[c] * (1.0 - alpha_wave)) / np.maximum(alpha_wave, 0.05), 0, 255)

rgba_wave = np.dstack([fg_wave, (alpha_wave * 255).astype(np.uint8)]).astype(np.uint8)

# 2. Text section (y >= 645)
im_text = im.crop((0, 645, 1024, 1024))
arr_text = np.array(im_text, dtype=float)
r_t, g_t, b_t = arr_text[:,:,0], arr_text[:,:,1], arr_text[:,:,2]
lum_text = 0.299 * r_t + 0.587 * g_t + 0.114 * b_t

# Letters have lum > 80, cloud is < 45
low_t, high_t = 48.0, 95.0
t_t = np.clip((lum_text - low_t) / (high_t - low_t), 0.0, 1.0)
alpha_text = t_t * t_t * (3.0 - 2.0 * t_t)

fg_text_white = np.zeros_like(arr_text)
for c in range(3):
    fg_text_white[:, :, c] = np.clip((arr_text[:, :, c] - bg[c] * (1.0 - alpha_text)) / np.maximum(alpha_text, 0.05), 0, 255)

# Text for light backgrounds: elegant gradient from dark slate #0f172a to deep purple #3b0764
# We can create a crisp dark version of text
fg_text_dark = np.zeros_like(arr_text)
# Gradient along x from 200 to 800:
x_norm = np.clip((np.arange(1024)[None, :] - 200) / 600.0, 0, 1)
# slate-900 (15, 23, 42) -> purple-950 (59, 7, 100) -> fuchsia-950 (74, 4, 78)
for y_idx in range(arr_text.shape[0]):
    for c, (val_start, val_end) in enumerate([(15, 65), (23, 10), (42, 90)]):
        fg_text_dark[y_idx, :, c] = val_start + x_norm[0] * (val_end - val_start)

# Assemble full images
full_alpha = np.vstack([alpha_wave, alpha_text])
full_fg_white = np.vstack([fg_wave, fg_text_white])
full_fg_dark = np.vstack([fg_wave, fg_text_dark])

rgba_full_white = np.dstack([full_fg_white, (full_alpha * 255).astype(np.uint8)]).astype(np.uint8)
rgba_full_dark = np.dstack([full_fg_dark, (full_alpha * 255).astype(np.uint8)]).astype(np.uint8)

img_full_white = Image.fromarray(rgba_full_white, 'RGBA')
img_full_dark = Image.fromarray(rgba_full_dark, 'RGBA')
img_icon = Image.fromarray(rgba_wave, 'RGBA')

# Crop to non-transparent bounding box
bbox_icon = img_icon.getbbox()
print("Icon bbox:", bbox_icon)
cropped_icon = img_icon.crop(bbox_icon)
# Add small padding (16px)
pad = 20
padded_icon = Image.new('RGBA', (cropped_icon.width + 2*pad, cropped_icon.height + 2*pad), (0,0,0,0))
padded_icon.paste(cropped_icon, (pad, pad))

bbox_full = img_full_dark.getbbox()
print("Full bbox:", bbox_full)
cropped_full_dark = img_full_dark.crop(bbox_full)
padded_full_dark = Image.new('RGBA', (cropped_full_dark.width + 2*pad, cropped_full_dark.height + 2*pad), (0,0,0,0))
padded_full_dark.paste(cropped_full_dark, (pad, pad))

cropped_full_white = img_full_white.crop(bbox_full)
padded_full_white = Image.new('RGBA', (cropped_full_white.width + 2*pad, cropped_full_white.height + 2*pad), (0,0,0,0))
padded_full_white.paste(cropped_full_white, (pad, pad))

# Save all variants
padded_icon.save(r'D:\KULIAH\SEMESTER 5\IMPAL\tubes\Streamly\frontend\scratch\clean_icon.png')
padded_full_dark.save(r'D:\KULIAH\SEMESTER 5\IMPAL\tubes\Streamly\frontend\scratch\clean_logo_dark.png')
padded_full_white.save(r'D:\KULIAH\SEMESTER 5\IMPAL\tubes\Streamly\frontend\scratch\clean_logo_white.png')

# Composite on white to inspect
white_test_icon = Image.new('RGB', padded_icon.size, (255, 255, 255))
white_test_icon.paste(padded_icon, mask=padded_icon.split()[3])
white_test_icon.save(r'D:\KULIAH\SEMESTER 5\IMPAL\tubes\Streamly\frontend\scratch\inspect_icon_on_white.png')

white_test_logo = Image.new('RGB', padded_full_dark.size, (255, 255, 255))
white_test_logo.paste(padded_full_dark, mask=padded_full_dark.split()[3])
white_test_logo.save(r'D:\KULIAH\SEMESTER 5\IMPAL\tubes\Streamly\frontend\scratch\inspect_logo_on_white.png')

print("All test images generated successfully!")
