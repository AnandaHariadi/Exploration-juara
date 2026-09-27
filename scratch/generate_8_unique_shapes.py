import os

shapes_dir = os.path.join('public', 'images', 'shapes')
os.makedirs(shapes_dir, exist_ok=True)

# 1. Tentang Yupiens - LEFT: Diagonal Cascade Wave
# A diagonal flowing corporate wave sweeping from upper-left down smoothly.
tentang_left = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" fill="none">
  <defs>
    <linearGradient id="tL_base" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="40%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>
    <linearGradient id="tL_glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCA5A5" />
      <stop offset="100%" stop-color="#DC2626" stop-opacity="0.2" />
    </linearGradient>
    <filter id="tL_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="-6" dy="10" stdDeviation="14" flood-color="#7F1D1D" flood-opacity="0.22" />
    </filter>
  </defs>
  <!-- Ambient Translucent Layer -->
  <path d="M 20 60 C 140 180, 280 320, 240 520 C 200 700, 60 760, 20 720 C 80 620, 160 500, 140 360 C 120 220, 40 140, 20 60 Z" 
        fill="#DC2626" fill-opacity="0.18" />
  <!-- Main Solid Flow Ribbon -->
  <path d="M 40 80 C 160 200, 260 350, 210 520 C 170 660, 70 720, 40 680 C 90 600, 150 480, 130 360 C 110 240, 60 160, 40 80 Z" 
        fill="url(#tL_base)" filter="url(#tL_shadow)" />
  <!-- Luminous Spine -->
  <path d="M 40 80 C 160 200, 260 350, 210 520 C 170 660, 70 720, 40 680" 
        stroke="url(#tL_glow)" stroke-width="4.5" stroke-linecap="round" />
  <!-- FinTech Micro-dots -->
  <path d="M 65 110 C 170 220, 240 360, 190 510 C 160 620, 85 670, 60 650" 
        stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="4 6" stroke-linecap="round" />
</svg>'''

# 2. Tentang Yupiens - RIGHT: Floating 3D Helix Loop
# A twisting dimensional infinity-style loop with interlocking depth.
tentang_right = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750" fill="none">
  <defs>
    <linearGradient id="tR_front" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="50%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#991B1B" />
    </linearGradient>
    <linearGradient id="tR_back" x1="100%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#7F1D1D" />
      <stop offset="70%" stop-color="#991B1B" />
      <stop offset="100%" stop-color="#B91C1C" />
    </linearGradient>
    <filter id="tR_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="6" dy="12" stdDeviation="16" flood-color="#7F1D1D" flood-opacity="0.25" />
    </filter>
  </defs>
  <!-- Ambient Translucent Oval -->
  <path d="M 360 140 C 440 260, 420 440, 320 540 C 220 640, 140 560, 180 440 C 220 320, 320 220, 360 140 Z" 
        fill="#DC2626" fill-opacity="0.14" />
  <!-- Back Loop -->
  <path d="M 320 200 C 420 120, 480 260, 410 400 C 340 540, 160 500, 150 620 C 140 700, 240 710, 310 630" 
        stroke="url(#tR_back)" stroke-width="44" stroke-linecap="round" />
  <!-- Front Interlocking 3D Loop -->
  <path d="M 180 110 C 270 40, 390 110, 380 250 C 370 410, 190 390, 200 520 C 210 610, 290 640, 360 580" 
        stroke="url(#tR_front)" stroke-width="44" stroke-linecap="round" filter="url(#tR_shadow)" />
  <!-- Highlight Crest -->
  <path d="M 200 100 C 280 40, 380 110, 375 230" 
        stroke="#FCA5A5" stroke-width="4" stroke-linecap="round" />
</svg>'''

# 3. Kategori Klien - LEFT: Architectural Curved Wing
# A sweeping, bold architectural wing with aerodynamic fins.
kategori_left = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 800" fill="none">
  <defs>
    <linearGradient id="kL_base" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#991B1B" />
      <stop offset="40%" stop-color="#DC2626" />
      <stop offset="85%" stop-color="#EF4444" />
      <stop offset="100%" stop-color="#F87171" />
    </linearGradient>
    <filter id="kL_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="-4" dy="8" stdDeviation="12" flood-color="#DC2626" flood-opacity="0.2" />
    </filter>
  </defs>
  <!-- Ambient Wing Fan -->
  <path d="M 20 480 C 140 400, 280 260, 380 80 C 300 180, 180 320, 20 420 Z" 
        fill="#DC2626" fill-opacity="0.2" />
  <!-- Main Solid Wing Arc -->
  <path d="M 30 720 C 120 640, 260 480, 340 280 C 390 160, 400 60, 410 30 C 370 120, 300 240, 220 380 C 140 520, 60 640, 30 720 Z" 
        fill="url(#kL_base)" filter="url(#kL_shadow)" />
  <!-- Speed Line Accents -->
  <path d="M 70 700 C 150 620, 260 470, 340 270" 
        stroke="#FCA5A5" stroke-width="3" stroke-linecap="round" />
  <path d="M 110 680 C 180 610, 270 480, 320 320" 
        stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="3 5" />
</svg>'''

# 4. Kategori Klien - RIGHT: Geometric Horizon Arch
# An expansive, horizontal-to-vertical orbital crest curving gracefully along the right flank.
kategori_right = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 800" fill="none">
  <defs>
    <linearGradient id="kR_base" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="45%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>
    <filter id="kR_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="8" dy="10" stdDeviation="16" flood-color="#991B1B" flood-opacity="0.22" />
    </filter>
  </defs>
  <!-- Sweeping Double Contour -->
  <path d="M 440 80 C 300 160, 160 300, 220 500 C 270 660, 420 720, 470 680 C 380 650, 270 560, 240 440 C 200 320, 320 180, 440 80 Z" 
        fill="url(#kR_base)" filter="url(#kR_shadow)" />
  <!-- Echo Ring -->
  <path d="M 470 160 C 360 230, 240 340, 280 500 C 310 600, 420 660, 480 640" 
        stroke="#FCA5A5" stroke-width="4" stroke-linecap="round" opacity="0.8" />
  <!-- Precision Dots -->
  <path d="M 450 120 C 330 200, 220 320, 255 470" 
        stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="4 6" />
</svg>'''

# 5. Alur Penagihan - LEFT: Stepped Progressive Milestone Wave
# An undulating progressive wave that steps sequentially downwards matching steps 01-04.
alur_left = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 850" fill="none">
  <defs>
    <linearGradient id="aL_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DC2626" />
      <stop offset="35%" stop-color="#EF4444" />
      <stop offset="70%" stop-color="#B91C1C" />
      <stop offset="100%" stop-color="#991B1B" />
    </linearGradient>
    <filter id="aL_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="-5" dy="8" stdDeviation="12" flood-color="#7F1D1D" flood-opacity="0.2" />
    </filter>
  </defs>
  <!-- Multi-node Progressive Ribbon -->
  <path d="M 60 40 
           C 160 80, 240 180, 200 280 
           C 160 380, 280 440, 240 560 
           C 200 660, 100 720, 40 800 
           C 90 750, 170 650, 160 550 
           C 150 440, 80 360, 100 260 
           C 120 160, 60 100, 60 40 Z" 
        fill="url(#aL_grad)" filter="url(#aL_shadow)" />
  <!-- Luminescent Trajectory Line -->
  <path d="M 60 40 C 160 80, 240 180, 200 280 C 160 380, 280 440, 240 560 C 200 660, 100 720, 40 800" 
        stroke="#FCA5A5" stroke-width="4" stroke-linecap="round" />
  <!-- Step Milestone Nodes -->
  <circle cx="160" cy="180" r="7" fill="#FFFFFF" stroke="#DC2626" stroke-width="3" />
  <circle cx="210" cy="400" r="7" fill="#FFFFFF" stroke="#DC2626" stroke-width="3" />
  <circle cx="215" cy="580" r="7" fill="#FFFFFF" stroke="#DC2626" stroke-width="3" />
</svg>'''

# 6. Alur Penagihan - RIGHT: Circular Milestone Completion Orbit
# An open dynamic orbital disc/ribbon evoking completion of workflow.
alur_right = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 800" fill="none">
  <defs>
    <linearGradient id="aR_grad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="50%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>
    <filter id="aR_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="6" dy="10" stdDeviation="14" flood-color="#DC2626" flood-opacity="0.2" />
    </filter>
  </defs>
  <!-- Orbiting Torus Ribbon Arc -->
  <path d="M 440 200 
           C 400 80, 260 40, 160 120 
           C 60 200, 60 380, 150 480 
           C 250 580, 420 540, 460 400 
           C 470 340, 440 320, 400 360 
           C 360 430, 240 450, 170 380 
           C 110 310, 120 200, 180 150 
           C 240 100, 340 120, 390 190 Z" 
        fill="url(#aR_grad)" filter="url(#aR_shadow)" />
  <!-- Core Radial Glow Arc -->
  <path d="M 420 180 C 370 100, 260 70, 180 130 C 100 200, 100 340, 160 430 C 230 510, 380 500, 430 380" 
        stroke="#FCA5A5" stroke-width="3" stroke-linecap="round" />
</svg>'''

# 7. FAQ - LEFT: Shield Crest Dynamic Ribbon
# An authoritative, institutional shield-arc ribbon symbolizing trust & security.
faq_left = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 800" fill="none">
  <defs>
    <linearGradient id="fL_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="60%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#991B1B" />
    </linearGradient>
    <filter id="fL_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="-6" dy="12" stdDeviation="15" flood-color="#991B1B" flood-opacity="0.22" />
    </filter>
  </defs>
  <!-- Broad Shield Flange -->
  <path d="M 40 100 
           C 120 80, 260 140, 320 280 
           C 380 420, 320 600, 180 720 
           C 220 620, 260 480, 220 380 
           C 180 280, 100 200, 40 100 Z" 
        fill="url(#fL_grad)" filter="url(#fL_shadow)" />
  <!-- Translucent Under-shield -->
  <path d="M 60 160 C 150 140, 280 220, 320 360 C 350 490, 280 620, 160 700 C 120 680, 200 560, 180 440 C 160 320, 100 240, 60 160 Z" 
        fill="#DC2626" fill-opacity="0.16" />
  <!-- Luminous Edge -->
  <path d="M 40 100 C 120 80, 260 140, 320 280 C 380 420, 320 600, 180 720" 
        stroke="#FCA5A5" stroke-width="4.5" stroke-linecap="round" />
</svg>'''

# 8. FAQ - RIGHT: Elegantly Tapered Serpentine Ribbon
# A tall, slender serpentine ribbon that dances gracefully along the right flank.
faq_right = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 850" fill="none">
  <defs>
    <linearGradient id="fR_grad" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="40%" stop-color="#DC2626" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>
    <filter id="fR_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="6" dy="10" stdDeviation="14" flood-color="#DC2626" flood-opacity="0.2" />
    </filter>
  </defs>
  <!-- Slender Serpentine Spine -->
  <path d="M 400 50 
           C 290 140, 180 260, 240 400 
           C 300 540, 420 620, 360 780 
           C 340 820, 280 840, 240 800 
           C 280 760, 320 680, 280 580 
           C 240 460, 150 360, 210 240 
           C 260 130, 340 80, 400 50 Z" 
        fill="url(#fR_grad)" filter="url(#fR_shadow)" />
  <!-- Highlight Crest -->
  <path d="M 400 50 C 290 140, 180 260, 240 400 C 300 540, 420 620, 360 780" 
        stroke="#FCA5A5" stroke-width="4" stroke-linecap="round" />
  <!-- Precision Dotted Micro-flow -->
  <path d="M 360 90 C 265 175, 175 285, 220 410 C 265 525, 360 595, 325 725" 
        stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="1.5" stroke-dasharray="4 6" />
</svg>'''

shapes = {
    'shape_tentang_left.svg': tentang_left,
    'shape_tentang_right.svg': tentang_right,
    'shape_kategori_left.svg': kategori_left,
    'shape_kategori_right.svg': kategori_right,
    'shape_alur_left.svg': alur_left,
    'shape_alur_right.svg': alur_right,
    'shape_faq_left.svg': faq_left,
    'shape_faq_right.svg': faq_right,
}

for name, code in shapes.items():
    with open(os.path.join(shapes_dir, name), 'w', encoding='utf-8') as f:
        f.write(code.strip())
    print(f"Created {name}")

print("All 8 completely distinct shapes created successfully!")
