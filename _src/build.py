"""Сборка концептов: подставляет в шаблоны общий <head>, логотип (inline SVG) и подключение скриптов."""
import pathlib, re, sys

SRC = pathlib.Path(__file__).parent
OUT = pathlib.Path(r"C:\Users\idm\Desktop\редизайн сайта\дизайн-концепты")
LOGO = (OUT / "assets" / "logo-mark.svg").read_text(encoding="utf-8")
LOGO_L = (OUT / "assets" / "logo-mark-light.svg").read_text(encoding="utf-8")

HEAD = """<meta name="robots" content="noindex, nofollow">
<script>(function(h){var r=matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]static\\b/.test(location.search);h.classList.add(r?'m-static':'m-anim');setTimeout(function(){if(!window.M){h.classList.remove('m-anim');h.classList.add('m-static')}},4000)})(document.documentElement)</script>
<link rel="stylesheet" href="assets/vendor/lenis.css">
<link rel="stylesheet" href="assets/motion.css">"""

LIBS = """<script src="assets/data.js"></script>
<script src="assets/kz.js"></script>
<script src="assets/vendor/gsap.min.js"></script>
<script src="assets/vendor/ScrollTrigger.min.js"></script>
<script src="assets/vendor/SplitText.min.js"></script>
<script src="assets/vendor/lenis.min.js"></script>"""

MOTION = '<script src="assets/motion.js"></script>'

files = sys.argv[1:] or [p.name for p in SRC.glob("v*.html")]
for name in files:
    t = (SRC / name).read_text(encoding="utf-8")
    t = t.replace("{{HEAD}}", HEAD).replace("{{LIBS}}", LIBS).replace("{{MOTION}}", MOTION)
    t = t.replace("{{LOGO}}", LOGO).replace("{{LOGO_LIGHT}}", LOGO_L)
    left = re.findall(r"\{\{[A-Z_]+\}\}", t)
    assert not left, (name, left)
    (OUT / name).write_text(t, encoding="utf-8")
    print("собран", name, len(t))
