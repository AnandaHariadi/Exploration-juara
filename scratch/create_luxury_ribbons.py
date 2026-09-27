import os

shapes_dir = os.path.join('public', 'images', 'shapes')
os.makedirs(shapes_dir, exist_ok=True)

# 1. Executive Dynamic Ribbon (Left Flank)
# An authentic, elegant, multi-layered flowing corporate ribbon.
# It has a rich crimson body, translucent ambient glow layer, and a delicate metallic light spine.
# Completely unambiguous: clearly recognized as a luxury corporate ribbon (like Astra's "Semangat Astra").
ribbon_left_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 850" fill="none">
  <defs>
    <linearGradient id="execBaseL" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" stop-opacity="0.95" />
      <stop offset="35%" stop-color="#DC2626" stop-opacity="0.98" />
      <stop offset="70%" stop-color="#B91C1C" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#7F1D1D" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="execGlowL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCA5A5" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#F87171" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#DC2626" stop-opacity="0.1" />
    </linearGradient>
    <linearGradient id="execTransL" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#DC2626" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#991B1B" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#7F1D1D" stop-opacity="0.0" />
    </linearGradient>
    <filter id="execShadowL" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="-6" dy="12" stdDeviation="16" flood-color="#991B1B" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Ambient Flow Layer (Translucent Under-wing) -->
  <path d="M 60 50 
           C 180 140, 270 300, 210 490 
           C 150 670, 30 740, 80 820 
           C 150 830, 250 740, 290 590 
           C 330 420, 240 210, 110 50 Z" 
        fill="url(#execTransL)" />

  <!-- Main Solid 3D Flow Ribbon -->
  <path d="M 80 80 
           C 190 170, 255 310, 195 490 
           C 145 640, 45 710, 85 800 
           C 135 810, 210 740, 245 620 
           C 280 480, 215 270, 125 80 Z" 
        fill="url(#execBaseL)" 
        filter="url(#execShadowL)" />

  <!-- Luminous Edge Spine (Highlights 3D Curvature) -->
  <path d="M 80 80 
           C 190 170, 255 310, 195 490 
           C 145 640, 45 710, 85 800" 
        stroke="url(#execGlowL)" 
        stroke-width="5" 
        stroke-linecap="round" />

  <!-- Micro-dot Financial Stream Accent -->
  <path d="M 115 110 
           C 205 195, 235 320, 190 480 
           C 155 595, 80 660, 105 765" 
        stroke="#FFFFFF" 
        stroke-opacity="0.28" 
        stroke-width="1.5" 
        stroke-dasharray="4 6" 
        stroke-linecap="round" />
</svg>'''

# 2. Executive Dynamic Ribbon (Right Flank)
# Symmetrically harmonized yet dynamically poised on the right side.
# Sweeps with graceful upward momentum, echoing Astra's iconic motion.
ribbon_right_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 850" fill="none">
  <defs>
    <linearGradient id="execBaseR" x1="90%" y1="0%" x2="10%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" stop-opacity="0.95" />
      <stop offset="35%" stop-color="#DC2626" stop-opacity="0.98" />
      <stop offset="70%" stop-color="#B91C1C" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#7F1D1D" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="execGlowR" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FCA5A5" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#F87171" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#DC2626" stop-opacity="0.1" />
    </linearGradient>
    <linearGradient id="execTransR" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DC2626" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#991B1B" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#7F1D1D" stop-opacity="0.0" />
    </linearGradient>
    <filter id="execShadowR" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="6" dy="12" stdDeviation="16" flood-color="#991B1B" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Ambient Flow Layer (Translucent Under-wing) -->
  <path d="M 390 50 
           C 270 140, 180 300, 240 490 
           C 300 670, 420 740, 370 820 
           C 300 830, 200 740, 160 590 
           C 120 420, 210 210, 340 50 Z" 
        fill="url(#execTransR)" />

  <!-- Main Solid 3D Flow Ribbon -->
  <path d="M 370 80 
           C 260 170, 195 310, 255 490 
           C 305 640, 405 710, 365 800 
           C 315 810, 240 740, 205 620 
           C 170 480, 235 270, 325 80 Z" 
        fill="url(#execBaseR)" 
        filter="url(#execShadowR)" />

  <!-- Luminous Edge Spine -->
  <path d="M 370 80 
           C 260 170, 195 310, 255 490 
           C 305 640, 405 710, 365 800" 
        stroke="url(#execGlowR)" 
        stroke-width="5" 
        stroke-linecap="round" />

  <!-- Micro-dot Financial Stream Accent -->
  <path d="M 335 110 
           C 245 195, 215 320, 260 480 
           C 295 595, 370 660, 345 765" 
        stroke="#FFFFFF" 
        stroke-opacity="0.28" 
        stroke-width="1.5" 
        stroke-dasharray="4 6" 
        stroke-linecap="round" />
</svg>'''

# 3. Horizon Wave Banner Ribbon (for section transitions / About / Workflow)
# A wide, horizontal sweeping corporate ribbon that frames containers gracefully.
ribbon_horizon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" fill="none">
  <defs>
    <linearGradient id="horizonGrad" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#DC2626" stop-opacity="0.0" />
      <stop offset="25%" stop-color="#EF4444" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#DC2626" stop-opacity="0.65" />
      <stop offset="75%" stop-color="#B91C1C" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#7F1D1D" stop-opacity="0.0" />
    </linearGradient>
    <linearGradient id="horizonHighlight" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="10%" stop-color="#FCA5A5" stop-opacity="0.0" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.6" />
      <stop offset="90%" stop-color="#FCA5A5" stop-opacity="0.0" />
    </linearGradient>
  </defs>
  <!-- Broad Silky Flow -->
  <path d="M 0 180 
           C 300 280, 500 60, 800 160 
           C 1000 240, 1100 140, 1200 120 
           L 1200 160 
           C 1080 180, 960 280, 780 200 
           C 480 80, 320 320, 0 220 Z" 
        fill="url(#horizonGrad)" />
  <!-- Sharp Precision Luminous Line -->
  <path d="M 0 180 
           C 300 280, 500 60, 800 160 
           C 1000 240, 1100 140, 1200 120" 
        stroke="url(#horizonHighlight)" 
        stroke-width="2.5" />
</svg>'''

files = {
    'yupiens_ribbon_left.svg': ribbon_left_svg,
    'yupiens_ribbon_right.svg': ribbon_right_svg,
    'yupiens_ribbon_horizon.svg': ribbon_horizon_svg,
}

for fname, content in files.items():
    fpath = os.path.join(shapes_dir, fname)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f"Created {fname}")

print("All luxury ribbons created successfully!")
