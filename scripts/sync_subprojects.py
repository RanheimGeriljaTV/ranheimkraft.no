#!/usr/bin/env python3
"""
Ranheim Kraft – Felles synkroniseringsmotor for subprosjekter.
Holder frittstående klientside-verktøy (Quiz-Kraft, QR-Kraft, m.fl.)
100 % oppdatert mot oppstrøms GitHub-repositorier.
"""

import os
import sys
import shutil
import tempfile
import subprocess
import argparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# =========================================================================
# KONFIGURASJON AV SUBPROSJEKTER
# For å legge til nye fremtidige prosjekter: legg til en ny blokk i listen under!
# =========================================================================
SUBPROJECTS = [
    {
        "id": "quiz",
        "name": "Quiz Kraft",
        "repo": "https://github.com/RanheimGeriljaTV/Quiz-Kraft.git",
        "branch": "main",
        "mappings": [
            ("css/style.css", "assets/quiz/style.css"),
            ("css/print.css", "assets/quiz/print.css"),
            ("vendor/xlsx.full.min.js", "assets/quiz/xlsx.full.min.js"),
            ("js/scoring.js", "assets/quiz/scoring.js"),
            ("js/storage.js", "assets/quiz/storage.js"),
            ("js/excel-export.js", "assets/quiz/excel-export.js"),
            ("js/spreadsheet.js", "assets/quiz/spreadsheet.js"),
            ("js/app.js", "assets/quiz/app.js"),
        ],
        "post_process": "quiz"
    },
    {
        "id": "qr",
        "name": "QR Kraft",
        "repo": "https://github.com/RanheimGeriljaTV/QR-Kraft.git",
        "branch": "main",
        "mappings": [
            ("assets/css/style.css", "assets/qr-style.css"),
            ("assets/js/qr-engine.js", "assets/qr-js/qr-engine.js"),
            ("assets/vendor/qr-code-styling.js", "assets/vendor/qr-code-styling.js"),
        ],
        "post_process": "qr"
    }
]


def post_process_quiz(target_dir):
    """
    Sørger for at Quiz Kraft beholder feilrettinger (TDZ for applyFontScale,
    sikker readyState-kjører og print-selektorer for site-header).
    """
    app_js_path = os.path.join(target_dir, "assets", "quiz", "app.js")
    if os.path.exists(app_js_path):
        with open(app_js_path, "r", encoding="utf-8") as f:
            code = f.read()

        # 1. Sikre trygg readyState-starter
        if "document.addEventListener('DOMContentLoaded', () => {" in code:
            code = code.replace(
                "document.addEventListener('DOMContentLoaded', () => {",
                "function initQuizApp() {"
            )
            last_idx = code.rfind("});")
            if last_idx != -1:
                runner = """}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuizApp);
} else {
  initQuizApp();
}
"""
                code = code[:last_idx] + runner + code[last_idx + 3:]

        # 2. Sikre seksjon 7 uten Temporal Dead Zone ReferenceError
        idx7 = code.find("  // 7. Tekststørrelse-skalering")
        idx8 = code.find("  // 8. Lys / Mørk modus")
        if idx7 != -1 and idx8 != -1:
            clean_sec7 = """  // 7. Tekststørrelse-skalering (A+ / A-)
  const fontSteps = [15, 18, 22, 26, 30, 35];
  let currentFontIndex = 1; // Standard 18px

  const btnFontLarger = document.getElementById('btn-font-larger');
  const btnFontSmaller = document.getElementById('btn-font-smaller');

  function applyFontScale(px) {
    document.documentElement.style.setProperty('--font-scale', `${px}px`);
    localStorage.setItem('quiz_kraft_font_scale', px);
    if (btnFontSmaller) btnFontSmaller.disabled = (currentFontIndex === 0);
    if (btnFontLarger) btnFontLarger.disabled = (currentFontIndex === fontSteps.length - 1);
  }

  // Les lagret tekststørrelse hvis finnes
  const savedFont = parseInt(localStorage.getItem('quiz_kraft_font_scale'), 10);
  if (!isNaN(savedFont)) {
    const foundIdx = fontSteps.indexOf(savedFont);
    if (foundIdx !== -1) {
      currentFontIndex = foundIdx;
    }
  }
  applyFontScale(fontSteps[currentFontIndex]);

  if (btnFontLarger) {
    btnFontLarger.addEventListener('click', () => {
      if (currentFontIndex < fontSteps.length - 1) {
        currentFontIndex++;
        applyFontScale(fontSteps[currentFontIndex]);
      }
    });
  }

  if (btnFontSmaller) {
    btnFontSmaller.addEventListener('click', () => {
      if (currentFontIndex > 0) {
        currentFontIndex--;
        applyFontScale(fontSteps[currentFontIndex]);
      }
    });
  }
"""
            code = code[:idx7] + clean_sec7 + "\n" + code[idx8:]

        with open(app_js_path, "w", encoding="utf-8") as f:
            f.write(code)

    # 3. Oppdater print.css til å skjule nettstedsrammen
    print_css_path = os.path.join(target_dir, "assets", "quiz", "print.css")
    if os.path.exists(print_css_path):
        with open(print_css_path, "r", encoding="utf-8") as f:
            p_code = f.read()
        if ".site-header" not in p_code:
            p_code = p_code.replace(
                ".no-print,",
                ".no-print,\n  .site-header,\n  .site-nav,\n  .site-footer,\n  #vipps-widget,\n  #feedback-modal,"
            )
            with open(print_css_path, "w", encoding="utf-8") as f:
                f.write(p_code)

    # 4. Oppdater excel-export.js sti
    excel_js_path = os.path.join(target_dir, "assets", "quiz", "excel-export.js")
    if os.path.exists(excel_js_path):
        with open(excel_js_path, "r", encoding="utf-8") as f:
            e_code = f.read()
        e_code = e_code.replace("vendor/xlsx.full.min.js", "assets/quiz/xlsx.full.min.js")
        with open(excel_js_path, "w", encoding="utf-8") as f:
            f.write(e_code)


def post_process_qr(target_dir):
    """Eventuelle etterjusteringer for QR Kraft."""
    pass


def sync_project(proj, root_dir):
    name = proj["name"]
    repo_url = proj["repo"]
    branch = proj.get("branch", "main")
    mappings = proj.get("mappings", [])

    print(f"\n==================================================")
    print(f"🔄 Synkroniserer: {name} ({repo_url})")
    print(f"==================================================")

    temp_dir = tempfile.mkdtemp(prefix=f"sync_{proj['id']}_")
    try:
        cmd = ["git", "clone", "--depth", "1", "--branch", branch, repo_url, temp_dir]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        copied_count = 0
        for src_rel, dst_rel in mappings:
            src_path = os.path.join(temp_dir, src_rel)
            dst_path = os.path.join(root_dir, dst_rel)

            if not os.path.exists(src_path):
                print(f"⚠️  Kilde finnes ikke: {src_rel} (hoppes over)")
                continue

            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            shutil.copy2(src_path, dst_path)
            copied_count += 1
            print(f"  ✓ {src_rel} -> {dst_rel}")

        # Kjør eventuell post-processing
        if proj.get("post_process") == "quiz":
            post_process_quiz(root_dir)
            print("  ✓ Kjørt post-prosessering for Quiz Kraft")
        elif proj.get("post_process") == "qr":
            post_process_qr(root_dir)

        print(f"✅ {name}: {copied_count} filer synkronisert.")

    except subprocess.CalledProcessError as e:
        print(f"❌ Feil ved kloning av {name}: {e.stderr.decode('utf-8', errors='ignore')}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser(description="Synkroniser subprosjekter for ranheimkraft.no")
    parser.add_argument("--project", default="all", help="Prosjekt-ID (f.eks. 'quiz', 'qr' eller 'all')")
    args = parser.parse_args()

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    print(f"Arbeidsområde: {root_dir}")

    target = args.project.lower().strip()
    synced_any = False

    for proj in SUBPROJECTS:
        if target in ("all", proj["id"], proj["name"].lower()):
            sync_project(proj, root_dir)
            synced_any = True

    if not synced_any:
        print(f"Fant ingen prosjekter med ID '{args.project}'. Tilgjengelige: {[p['id'] for p in SUBPROJECTS]}")
        sys.exit(1)

    print("\n🎉 Synkroniseringskjøring fullført!")


if __name__ == "__main__":
    main()
