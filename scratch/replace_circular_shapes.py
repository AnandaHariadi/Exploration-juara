import os

shapes_dir = os.path.join('public', 'images', 'shapes')
os.makedirs(shapes_dir, exist_ok=True)

# 1. Alur Penagihan - RIGHT: Ascending Aerodynamic Stream Ribbon (NO CIRCLES, NO DONUTS)
# An open, sweeping, dynamic fluid ribbon that glides upwards with elegant Bézier curvature.
alur_right_flowing = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 850" fill="none">
  <defs>
    <linearGradient id="aR_flow_grad" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="40%" stop-color="#DC2626" />
      <stop offset="80%" stop-color="#B91C1C" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>
    <linearGradient id="aR_flow_glow" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FCA5A5" />
      <stop offset="50%" stop-color="#F87171" />
      <stop offset="100%" stop-color="#DC2626" stop-opacity="0.1" />
    </linearGradient>
    <filter id="aR_flow_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="6" dy="12" stdDeviation="16" flood-color="#991B1B" flood-opacity="0.22" />
    </filter>
  </defs>
  <!-- Ambient Translucent Flow -->
  <path d="M 400 40 
           C 270 160, 200 340, 290 520 
           C 360 660, 440 730, 390 820 
           C 320 830, 230 740, 180 600 
           C 130 420, 210 200, 340 40 Z" 
        fill="#DC2626" fill-opacity="0.16" />

  <!-- Main Open Aerodynamic Flow Ribbon (Open Wave, No Circle) -->
  <path d="M 380 70 
           C 260 190, 210 350, 280 520 
           C 330 630, 410 700, 370 790 
           C 310 800, 250 720, 210 610 
           C 170 480, 230 270, 330 70 Z" 
        fill="url(#aR_flow_grad)" filter="url(#aR_flow_shadow)" />

  <!-- Luminous Edge Spine -->
  <path d="M 380 70 C 260 190, 210 350, 280 520 C 330 630, 410 700, 370 790" 
        stroke="url(#aR_flow_glow)" stroke-width="4.5" stroke-linecap="round" />

  <!-- FinTech Trajectory Stream Accent -->
  <path d="M 345 110 C 245 220, 220 360, 275 510 C 310 600, 375 660, 345 750" 
        stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="1.5" stroke-dasharray="4 6" stroke-linecap="round" />
</svg>'''

# 2. Tentang Yupiens - RIGHT: Open Ascending Ribbon Flourish (NO CLOSED LOOPS, NO DONUTS)
tentang_right_open = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 850" fill="none">
  <defs>
    <linearGradient id="tR_open_grad" x1="80%" y1="0%" x2="20%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="45%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>
    <filter id="tR_open_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="6" dy="10" stdDeviation="15" flood-color="#DC2626" flood-opacity="0.2" />
    </filter>
  </defs>
  <!-- Open Fluid S-Ribbon -->
  <path d="M 390 60 
           C 280 180, 160 280, 220 440 
           C 280 600, 410 660, 360 800 
           C 300 810, 220 720, 180 580 
           C 140 420, 220 230, 340 60 Z" 
        fill="url(#tR_open_grad)" filter="url(#tR_open_shadow)" />
  <!-- Luminous Edge -->
  <path d="M 390 60 C 280 180, 160 280, 220 440 C 280 600, 410 660, 360 800" 
        stroke="#FCA5A5" stroke-width="4" stroke-linecap="round" />
  <!-- Dotted Stream -->
  <path d="M 350 100 C 255 210, 185 300, 230 440 C 270 560, 360 620, 330 740" 
        stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="4 6" />
</svg>'''

# 3. Kategori Klien - RIGHT: Slender Horizon Flow Wave (NO CIRCLE, NO RING)
kategori_right_open = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 850" fill="none">
  <defs>
    <linearGradient id="kR_open_grad" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="50%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#991B1B" />
    </linearGradient>
    <filter id="kR_open_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="6" dy="12" stdDeviation="15" flood-color="#7F1D1D" flood-opacity="0.22" />
    </filter>
  </defs>
  <!-- Sweeping Open Wave -->
  <path d="M 410 90 
           C 290 200, 190 360, 260 530 
           C 320 670, 410 730, 370 810 
           C 310 820, 240 730, 200 610 
           C 150 460, 220 260, 350 90 Z" 
        fill="url(#kR_open_grad)" filter="url(#kR_open_shadow)" />
  <path d="M 410 90 C 290 200, 190 360, 260 530 C 320 670, 410 730, 370 810" 
        stroke="#FCA5A5" stroke-width="4.5" stroke-linecap="round" />
  <path d="M 370 130 C 270 230, 205 375, 260 515 C 300 620, 365 675, 340 755" 
        stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="4 6" />
</svg>'''

updates = {
    'shape_alur_right.svg': alur_right_flowing,
    'shape_tentang_right.svg': tentang_right_open,
    'shape_kategori_right.svg': kategori_right_open,
}

for fname, code in updates.items():
    with open(os.path.join(shapes_dir, fname), 'w', encoding='utf-8') as f:
        f.write(code.strip())
    print(f"Updated {fname} with open aerodynamic wave (NO CIRCLES)")

print("All circular shapes successfully replaced with open fluid waves!")
