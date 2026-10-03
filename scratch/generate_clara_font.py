# Script to generate handcrafted cutout-style CLARA logo matching the SOPHIE typography reference
import re

# We will create an SVG with organic, bold, condensed cutout letterforms for C-L-A-R-A
# Color: vibrant rich red (#DC2626 / #D91A23) matching the reference

svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 230" fill="none">
  <!-- CLARA - Chunky Organic Cutout / Linocut Typography (Inspired by SOPHIE lettering) -->
  <g fill="#D81B24">
    <!-- C (x: 40 to 145) -->
    <path d="M 142 62 
             C 140 48, 126 40, 102 41 
             C 74 42, 54 52, 45 74 
             C 38 92, 38 136, 44 158 
             C 52 181, 72 192, 100 192 
             C 126 192, 141 184, 144 168 
             L 115 167 
             C 112 173, 106 175, 96 174 
             C 80 173, 72 163, 69 146 
             C 66 127, 66 102, 70 85 
             C 73 69, 82 58, 97 58 
             C 107 58, 114 62, 116 68 
             Z" />

    <!-- L (x: 165 to 255) -->
    <path d="M 166 43 
             L 198 42 
             L 196 160 
             L 254 159 
             C 257 168, 258 181, 255 191 
             L 165 192 
             C 164 175, 166 60, 166 43 
             Z" />

    <!-- A (x: 275 to 385) -->
    <path d="M 322 41 
             C 334 41, 342 46, 347 56 
             L 384 191 
             L 353 192 
             L 343 155 
             L 306 156 
             L 297 192 
             L 267 191 
             L 303 56 
             C 308 46, 314 41, 322 41 
             Z 
             M 324 77 
             L 312 133 
             L 337 132 
             L 326 77 
             Z" />

    <!-- R (x: 405 to 515) -->
    <path d="M 406 43 
             L 468 41 
             C 498 41, 513 54, 513 78 
             C 513 97, 502 110, 482 118 
             L 517 191 
             L 484 192 
             L 453 125 
             L 437 126 
             L 435 191 
             L 405 192 
             Z 
             M 436 64 
             L 436 104 
             L 463 103 
             C 475 103, 483 97, 483 83 
             C 483 71, 475 64, 462 64 
             Z" />

    <!-- A (x: 535 to 645) -->
    <path d="M 582 41 
             C 594 41, 602 46, 607 56 
             L 644 191 
             L 613 192 
             L 603 155 
             L 566 156 
             L 557 192 
             L 527 191 
             L 563 56 
             C 568 46, 574 41, 582 41 
             Z 
             M 584 77 
             L 572 133 
             L 597 132 
             L 586 77 
             Z" />
  </g>
</svg>'''

with open(r'c:\Users\ASUS TUF\OneDrive\Dokumen\Exploration\public\images\clara_logo_test.svg', 'w') as f:
    f.write(svg_content)

print("SVG test written successfully")
