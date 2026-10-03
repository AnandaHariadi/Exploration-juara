# Generate full Clara SOPHIE-style logo with organic cut-paper edge displacement
import os

svg_code = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 220" fill="none">
  <defs>
    <!-- Papercut / Screenprint edge texture filter matching the SOPHIE typography -->
    <filter id="cutPaperEdge" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="12" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
    </filter>
    <filter id="cutPaperEdgeWhite" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="12" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
    </filter>
  </defs>

  <g filter="url(#cutPaperEdge)" fill="#D31D24">
    <!-- C (x: 45 to 155) -->
    <path d="M 148 55 
             L 100 52 
             C 80 52, 60 62, 52 82 
             L 46 138 
             C 52 165, 75 178, 102 178 
             L 148 175 
             L 146 142 
             L 108 143 
             C 96 143, 90 136, 88 125 
             L 88 105 
             C 90 94, 96 87, 108 87 
             L 146 88 
             Z" />

    <!-- L (x: 172 to 260) -->
    <path d="M 174 44 
             L 218 43 
             L 216 138 
             L 262 137 
             L 260 178 
             L 172 179 
             Z" />

    <!-- A (x: 278 to 388) -->
    <path d="M 324 42 
             L 348 42 
             C 356 46, 362 55, 366 68 
             L 388 178 
             L 348 179 
             L 340 142 
             L 322 142 
             L 316 179 
             L 278 178 
             L 304 68 
             C 308 55, 316 45, 324 42 
             Z 
             M 326 78 
             L 318 116 
             L 344 116 
             L 336 78 
             Z" />

    <!-- R (x: 404 to 518) -->
    <path d="M 406 43 
             L 476 42 
             C 504 42, 518 56, 518 84 
             C 518 106, 506 118, 484 124 
             L 518 178 
             L 476 179 
             L 452 132 
             L 446 132 
             L 446 178 
             L 404 179 
             Z 
             M 446 72 
             L 446 104 
             L 468 104 
             C 478 104, 484 98, 484 88 
             C 484 78, 478 72, 468 72 
             Z" />

    <!-- A (x: 532 to 642) -->
    <path d="M 578 42 
             L 602 42 
             C 610 46, 616 55, 620 68 
             L 642 178 
             L 602 179 
             L 594 142 
             L 576 142 
             L 570 179 
             L 532 178 
             L 558 68 
             C 562 55, 570 45, 578 42 
             Z 
             M 580 78 
             L 572 116 
             L 598 116 
             L 590 78 
             Z" />
  </g>
</svg>
'''

with open(r'c:\Users\ASUS TUF\OneDrive\Dokumen\Exploration\public\images\clara_logo.svg', 'w', encoding='utf-8') as f:
    f.write(svg_code)

white_svg = svg_code.replace('#D31D24', '#FFFFFF')
with open(r'c:\Users\ASUS TUF\OneDrive\Dokumen\Exploration\public\images\clara_logo_white.svg', 'w', encoding='utf-8') as f:
    f.write(white_svg)

print("Both red and white CLARA logos updated successfully!")
