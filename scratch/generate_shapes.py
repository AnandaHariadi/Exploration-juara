import os

shapes_dir = os.path.join('public', 'images', 'shapes')
os.makedirs(shapes_dir, exist_ok=True)

# 1. Shape 1: Serpentine Ribbon (Pristine smooth S-winding wave with uniform width and rounded terminals)
shape1_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" fill="none">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DC2626" />
      <stop offset="50%" stop-color="#B91C1C" />
      <stop offset="100%" stop-color="#991B1B" />
    </linearGradient>
    <filter id="shadow1" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="-2" dy="6" stdDeviation="10" flood-color="#DC2626" flood-opacity="0.18" />
    </filter>
  </defs>
  <path d="M 320 40 
           C 240 40, 140 120, 140 220 
           C 140 320, 280 340, 280 440 
           C 280 540, 80 580, 80 680 
           C 80 740, 120 780, 170 780" 
        stroke="url(#grad1)" 
        stroke-width="54" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        filter="url(#shadow1)" />
</svg>'''

# 2. Shape 2: 3D Infinity Fluid Loop (Dimensional Astra-style twisting ribbon loop with depth & lighting)
shape2_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700" fill="none">
  <defs>
    <linearGradient id="grad2_front" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="40%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#991B1B" />
    </linearGradient>
    <linearGradient id="grad2_back" x1="100%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#7F1D1D" />
      <stop offset="60%" stop-color="#991B1B" />
      <stop offset="100%" stop-color="#B91C1C" />
    </linearGradient>
    <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="4" dy="8" stdDeviation="12" flood-color="#7F1D1D" flood-opacity="0.25" />
    </filter>
  </defs>
  <!-- Back Loop -->
  <path d="M 280 180 
           C 380 100, 440 220, 380 340 
           C 320 460, 140 420, 120 540 
           C 100 660, 220 680, 280 600" 
        stroke="url(#grad2_back)" 
        stroke-width="48" 
        stroke-linecap="round" />
  <!-- Front Overlapping Loop for 3D Interlock -->
  <path d="M 160 80 
           C 240 20, 360 80, 360 200 
           C 360 360, 180 340, 180 480 
           C 180 580, 260 620, 340 560" 
        stroke="url(#grad2_front)" 
        stroke-width="48" 
        stroke-linecap="round" 
        filter="url(#shadow2)" />
</svg>'''

# 3. Shape 3: Aerodynamic Pure Tapered Swoosh (Silky smooth, mathematical Bézier curve without ANY bumpy waves)
shape3_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" fill="none">
  <defs>
    <linearGradient id="grad3" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#991B1B" />
      <stop offset="35%" stop-color="#DC2626" />
      <stop offset="75%" stop-color="#EF4444" />
      <stop offset="100%" stop-color="#B91C1C" />
    </linearGradient>
    <filter id="shadow3" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="-4" dy="8" stdDeviation="12" flood-color="#DC2626" flood-opacity="0.18" />
    </filter>
  </defs>
  <path d="M 380 30 
           C 340 160, 270 300, 200 440 
           C 140 560, 80 670, 20 780 
           C 120 780, 210 740, 270 670 
           C 310 520, 345 340, 370 180 
           C 378 120, 380 70, 380 30 Z" 
        fill="url(#grad3)" 
        filter="url(#shadow3)" />
</svg>'''

# 4. Shape 4: Double Dynamic Wave (Harmonic parallel fluid ribbons conveying speed & momentum)
shape4_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 750" fill="none">
  <defs>
    <linearGradient id="grad4_a" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="100%" stop-color="#B91C1C" />
    </linearGradient>
    <linearGradient id="grad4_b" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>
    <filter id="shadow4" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="-3" dy="6" stdDeviation="8" flood-color="#DC2626" flood-opacity="0.16" />
    </filter>
  </defs>
  <!-- Primary Ribbon -->
  <path d="M 380 60 
           C 280 120, 160 220, 180 360 
           C 200 500, 340 540, 300 680 
           C 280 740, 220 760, 160 720" 
        stroke="url(#grad4_a)" 
        stroke-width="36" 
        stroke-linecap="round" 
        filter="url(#shadow4)" />
  <!-- Companion Echo Ribbon -->
  <path d="M 420 160 
           C 330 230, 250 310, 260 410 
           C 270 510, 380 560, 350 670" 
        stroke="url(#grad4_b)" 
        stroke-width="20" 
        stroke-linecap="round" 
        opacity="0.75" />
</svg>'''

# 5. Shape 5: Orbital Helix Arch (Clean architectural semi-circle with elegant taper)
shape5_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" fill="none">
  <defs>
    <linearGradient id="grad5" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7F1D1D" />
      <stop offset="40%" stop-color="#B91C1C" />
      <stop offset="70%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#F87171" />
    </linearGradient>
    <filter id="shadow5" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="4" dy="6" stdDeviation="10" flood-color="#991B1B" flood-opacity="0.2" />
    </filter>
  </defs>
  <path d="M 80 520 
           C 60 380, 140 180, 260 100 
           C 380 20, 480 80, 460 220 
           C 440 340, 340 440, 220 460 
           C 140 480, 80 440, 100 360 
           C 120 280, 200 240, 280 260" 
        stroke="url(#grad5)" 
        stroke-width="40" 
        stroke-linecap="round" 
        filter="url(#shadow5)" />
</svg>'''

# 6. Shape 6: Ascending Crest Flourish (Sharp, dynamic fintech crest flourish evoking momentum & institutional excellence)
shape6_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 700" fill="none">
  <defs>
    <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DC2626" />
      <stop offset="50%" stop-color="#B91C1C" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>
    <filter id="shadow6" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="-4" dy="8" stdDeviation="12" flood-color="#DC2626" flood-opacity="0.18" />
    </filter>
  </defs>
  <path d="M 40 640 
           C 120 620, 220 540, 280 420 
           C 340 300, 360 160, 400 40 
           C 360 140, 300 250, 220 330 
           C 150 400, 80 460, 30 520 
           C 10 560, 20 610, 40 640 Z" 
        fill="url(#grad6)" 
        filter="url(#shadow6)" />
</svg>'''

files = {
    'shape1_serpentine.svg': shape1_svg,
    'shape2_infinity_loop.svg': shape2_svg,
    'shape3_tapered_swoosh.svg': shape3_svg,
    'shape4_double_wave.svg': shape4_svg,
    'shape5_orbital_arch.svg': shape5_svg,
    'shape6_crest_flourish.svg': shape6_svg,
}

for filename, content in files.items():
    filepath = os.path.join(shapes_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f"Created {filename}")

print("All 6 vector shapes created successfully!")
