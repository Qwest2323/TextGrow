# Chrome Extension Icon Setup

## Quick Fix: Create PNG Icons

You need to create 4 PNG files from the provided `icon.svg`:

### Option 1: Online Converter (Easiest)
1. Go to https://convertio.co/svg-png/
2. Upload `icon.svg`
3. Set custom size and download these 4 files:
   - `icon16.png` (16×16 pixels)
   - `icon32.png` (32×32 pixels)
   - `icon48.png` (48×48 pixels)
   - `icon128.png` (128×128 pixels)

### Option 2: Use Browser (Quick)
1. Open `icon.svg` in Chrome/Firefox
2. Right-click → "Save image as..." → PNG
3. Use image editor to resize to required dimensions
4. Save with correct filenames

### Option 3: Command Line (If available)
```bash
# Install ImageMagick (if not installed)
sudo apt install imagemagick

# Convert SVG to PNG sizes
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 32x32 icon32.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

## Icon Design

The SVG icon features:
- 🔵 Blue gradient background (professional look)
- 📝 Text expansion arrows (shows functionality)
- 🔤 "TG" letters (TextGrow branding)
- ➡️ Shows short text expanding to longer text

## After Creating Icons

1. Place all 4 PNG files in the `chrome-extension/` directory
2. Reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Find TextGrow extension
   - Click the refresh button ⟳
3. The new icon should appear in your toolbar!

## Current Status

✅ `icon.svg` - Source vector icon created
✅ `manifest.json` - Updated to reference new icons  
⏳ `icon16.png, icon32.png, icon48.png, icon128.png` - **Need to be created**

Once you create the PNG files, your extension will have a professional blue icon instead of the default grey "T"!