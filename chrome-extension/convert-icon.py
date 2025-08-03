#!/usr/bin/env python3
"""
Convert SVG icon to multiple PNG sizes for Chrome extension
Run: python3 convert-icon.py
Requires: pip install cairosvg
"""

try:
    import cairosvg
    import os
    
    # Define required sizes for Chrome extension
    sizes = [16, 32, 48, 128]
    
    svg_file = "icon.svg"
    
    if not os.path.exists(svg_file):
        print(f"Error: {svg_file} not found!")
        exit(1)
    
    print("Converting SVG icon to PNG sizes...")
    
    for size in sizes:
        output_file = f"icon{size}.png"
        print(f"Creating {output_file} ({size}x{size})")
        
        cairosvg.svg2png(
            url=svg_file,
            write_to=output_file,
            output_width=size,
            output_height=size
        )
    
    print("\n✅ All icon sizes created successfully!")
    print("Icons created: icon16.png, icon32.png, icon48.png, icon128.png")
    
except ImportError:
    print("❌ cairosvg not installed. Please run:")
    print("pip install cairosvg")
    print("\nOr manually convert icon.svg to PNG files using any online converter:")
    print("- icon16.png (16x16)")
    print("- icon32.png (32x32)")  
    print("- icon48.png (48x48)")
    print("- icon128.png (128x128)")
    
except Exception as e:
    print(f"❌ Error converting icon: {e}")
    print("\nAlternatively, use an online SVG to PNG converter:")
    print("1. Go to https://convertio.co/svg-png/ or similar")
    print("2. Upload icon.svg")
    print("3. Download PNG versions in sizes: 16x16, 32x32, 48x48, 128x128")
    print("4. Rename files to: icon16.png, icon32.png, icon48.png, icon128.png")