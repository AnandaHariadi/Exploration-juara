import os

shapes_dir = os.path.join('public', 'images', 'shapes')
os.makedirs(shapes_dir, exist_ok=True)

# Function to create an Astra-grade multi-layer executive ribbon SVG
def create_ribbon_svg(path_under, path_main, path_spine, path_stream, dx, dy, stroke_w=5):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 850" fill="none">
  <defs>
    <linearGradient id="baseGrad" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" stop-opacity="0.95" />
      <stop offset="35%" stop-color="#DC2626" stop-opacity="0.98" />
      <stop offset="70%" stop-color="#B91C1C" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#7F1D1D" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCA5A5" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#F87171" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#DC2626" stop-opacity="0.15" />
    </linearGradient>
    <linearGradient id="transGrad" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#DC2626" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#991B1B" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#7F1D1D" stop-opacity="0.0" />
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="{dx}" dy="{dy}" stdDeviation="16" flood-color="#991B1B" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- 1. Ambient Under-wing -->
  <path d="{path_under}" fill="url(#transGrad)" />

  <!-- 2. Main Solid 3D Flow Ribbon -->
  <path d="{path_main}" fill="url(#baseGrad)" filter="url(#softShadow)" />

  <!-- 3. Luminous Edge Spine -->
  <path d="{path_spine}" stroke="url(#glowGrad)" stroke-width="{stroke_w}" stroke-linecap="round" />

  <!-- 4. Micro-dot Financial Stream Accent -->
  <path d="{path_stream}" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="1.5" stroke-dasharray="4 6" stroke-linecap="round" />
</svg>'''

# 1. Tentang Yupiens (About Section)
# Left: Flowing curve with gentle arch
about_l_under = "M 50 60 C 170 150, 260 310, 200 500 C 140 680, 20 750, 70 830 C 140 840, 240 750, 280 600 C 320 430, 230 220, 100 60 Z"
about_l_main = "M 70 90 C 180 180, 245 320, 185 500 C 135 650, 35 720, 75 810 C 125 820, 200 750, 235 630 C 270 490, 205 280, 115 90 Z"
about_l_spine = "M 70 90 C 180 180, 245 320, 185 500 C 135 650, 35 720, 75 810"
about_l_stream = "M 105 120 C 195 205, 225 330, 180 490 C 145 605, 70 670, 95 775"

# Right: Dynamic rising curve
about_r_under = "M 400 60 C 280 150, 190 310, 250 500 C 310 680, 430 750, 380 830 C 310 840, 210 750, 170 600 C 130 430, 220 220, 350 60 Z"
about_r_main = "M 380 90 C 270 180, 205 320, 265 500 C 315 650, 415 720, 375 810 C 325 820, 250 750, 215 630 C 180 490, 245 280, 335 90 Z"
about_r_spine = "M 380 90 C 270 180, 205 320, 265 500 C 315 650, 415 720, 375 810"
about_r_stream = "M 345 120 C 255 205, 225 330, 270 490 C 305 605, 380 670, 355 775"

# 2. Kategori Klien (Client Scale Section) - Wider, energetic wing sweep
scale_l_under = "M 40 100 C 190 180, 290 360, 230 550 C 170 720, 40 780, 90 850 C 170 850, 270 760, 310 620 C 350 460, 250 250, 100 100 Z"
scale_l_main = "M 60 130 C 195 210, 265 370, 210 540 C 160 685, 60 745, 95 820 C 150 820, 230 750, 265 635 C 300 505, 225 310, 120 130 Z"
scale_l_spine = "M 60 130 C 195 210, 265 370, 210 540 C 160 685, 60 745, 95 820"
scale_l_stream = "M 95 160 C 205 235, 245 370, 205 520 C 170 635, 90 690, 115 775"

scale_r_under = "M 410 100 C 260 180, 160 360, 220 550 C 280 720, 410 780, 360 850 C 280 850, 180 760, 140 620 C 100 460, 200 250, 350 100 Z"
scale_r_main = "M 390 130 C 255 210, 185 370, 240 540 C 290 685, 390 745, 355 820 C 300 820, 220 750, 185 635 C 150 505, 225 310, 330 130 Z"
scale_r_spine = "M 390 130 C 255 210, 185 370, 240 540 C 290 685, 390 745, 355 820"
scale_r_stream = "M 355 160 C 245 235, 205 370, 245 520 C 280 635, 360 690, 335 775"

# 3. Alur Penagihan (Workflow Steps) - Progressive sequential sweep
flow_l_under = "M 60 40 C 170 120, 250 260, 190 440 C 130 620, 30 710, 70 800 C 140 810, 230 730, 270 590 C 310 420, 230 220, 110 40 Z"
flow_l_main = "M 80 70 C 175 150, 235 280, 180 440 C 130 590, 45 670, 80 760 C 130 770, 195 710, 230 595 C 265 460, 205 270, 125 70 Z"
flow_l_spine = "M 80 70 C 175 150, 235 280, 180 440 C 130 590, 45 670, 80 760"
flow_l_stream = "M 115 100 C 190 170, 215 285, 175 430 C 140 545, 75 615, 100 720"

flow_r_under = "M 390 40 C 280 120, 200 260, 260 440 C 320 620, 420 710, 380 800 C 310 810, 220 730, 180 590 C 140 420, 220 220, 340 40 Z"
flow_r_main = "M 370 70 C 275 150, 215 280, 270 440 C 320 590, 405 670, 370 760 C 320 770, 255 710, 220 595 C 185 460, 245 270, 325 70 Z"
flow_r_spine = "M 370 70 C 275 150, 215 280, 270 440 C 320 590, 405 670, 370 760"
flow_r_stream = "M 335 100 C 260 170, 235 285, 275 430 C 310 545, 375 615, 350 720"

# 4. FAQ Section - Harmonic subtle flank
faq_l_under = "M 50 80 C 160 160, 240 300, 180 480 C 120 650, 30 730, 70 810 C 140 820, 220 740, 260 610 C 300 440, 220 240, 100 80 Z"
faq_l_main = "M 70 110 C 165 190, 225 315, 175 475 C 125 615, 45 690, 80 770 C 125 780, 190 720, 225 610 C 260 475, 200 290, 120 110 Z"
faq_l_spine = "M 70 110 C 165 190, 225 315, 175 475 C 125 615, 45 690, 80 770"
faq_l_stream = "M 105 140 C 180 210, 210 320, 170 465 C 135 570, 75 635, 100 730"

faq_r_under = "M 400 80 C 290 160, 210 300, 270 480 C 330 650, 420 730, 380 810 C 310 820, 230 740, 190 610 C 150 440, 230 240, 350 80 Z"
faq_r_main = "M 380 110 C 285 190, 225 315, 275 475 C 325 615, 405 690, 370 770 C 325 780, 260 720, 225 610 C 190 475, 250 290, 330 110 Z"
faq_r_spine = "M 380 110 C 285 190, 225 315, 275 475 C 325 615, 405 690, 370 770"
faq_r_stream = "M 345 140 C 270 210, 240 320, 280 465 C 315 570, 375 635, 350 730"

sections = {
    'ribbon_about_left.svg': (about_l_under, about_l_main, about_l_spine, about_l_stream, -6, 12),
    'ribbon_about_right.svg': (about_r_under, about_r_main, about_r_spine, about_r_stream, 6, 12),
    'ribbon_scale_left.svg': (scale_l_under, scale_l_main, scale_l_spine, scale_l_stream, -6, 12),
    'ribbon_scale_right.svg': (scale_r_under, scale_r_main, scale_r_spine, scale_r_stream, 6, 12),
    'ribbon_flow_left.svg': (flow_l_under, flow_l_main, flow_l_spine, flow_l_stream, -6, 12),
    'ribbon_flow_right.svg': (flow_r_under, flow_r_main, flow_r_spine, flow_r_stream, 6, 12),
    'ribbon_faq_left.svg': (faq_l_under, faq_l_main, faq_l_spine, faq_l_stream, -6, 12),
    'ribbon_faq_right.svg': (faq_r_under, faq_r_main, faq_r_spine, faq_r_stream, 6, 12),
}

for name, (u, m, s, st, dx, dy) in sections.items():
    svg_code = create_ribbon_svg(u, m, s, st, dx, dy)
    with open(os.path.join(shapes_dir, name), 'w', encoding='utf-8') as f:
        f.write(svg_code.strip())
    print(f"Created {name}")

print("All section-specific executive ribbons generated successfully!")
