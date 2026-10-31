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
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')


def sync_quiz_kraft(root_dir):
    print("\n==================================================")
    print("🔄 Synkroniserer: Quiz Kraft (RanheimGeriljaTV/Quiz-Kraft)")
    print("==================================================")
    temp_dir = tempfile.mkdtemp(prefix="sync_quiz_")
    try:
        cmd = ["git", "clone", "--depth", "1", "https://github.com/RanheimGeriljaTV/Quiz-Kraft.git", temp_dir]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        assets_quiz = os.path.join(root_dir, "assets", "quiz")
        os.makedirs(assets_quiz, exist_ok=True)

        # 1. Kopier alle CSS-filer
        src_css = os.path.join(temp_dir, "css")
        if os.path.exists(src_css):
            for f in os.listdir(src_css):
                shutil.copy2(os.path.join(src_css, f), os.path.join(assets_quiz, f))
                print(f"  ✓ css/{f} -> assets/quiz/{f}")

        # 2. Kopier alle JS-filer
        src_js = os.path.join(temp_dir, "js")
        if os.path.exists(src_js):
            for f in os.listdir(src_js):
                shutil.copy2(os.path.join(src_js, f), os.path.join(assets_quiz, f))
                print(f"  ✓ js/{f} -> assets/quiz/{f}")

        # 3. Kopier vendor (xlsx.full.min.js)
        src_vendor = os.path.join(temp_dir, "vendor")
        if os.path.exists(src_vendor):
            for f in os.listdir(src_vendor):
                shutil.copy2(os.path.join(src_vendor, f), os.path.join(assets_quiz, f))
                print(f"  ✓ vendor/{f} -> assets/quiz/{f}")

        # 4. Post-prosessering for app.js (trygg oppstart)
        app_js_path = os.path.join(assets_quiz, "app.js")
        if os.path.exists(app_js_path):
            with open(app_js_path, "r", encoding="utf-8") as f:
                code = f.read()

            # Sikre readyState runner
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

            # Sikre nøyaktig enkle backticks på font scale
            code = code.replace("``${px}px``", "`${px}px`")
            if "`${px}px`" not in code:
                code = code.replace("${px}px", "`${px}px`")

            with open(app_js_path, "w", encoding="utf-8") as f:
                f.write(code)
            print("  ✓ Kjørt post-prosessering for app.js")

        # 5. Post-prosessering for excel-export.js (korrekt sti til ExcelJS / SheetJS)
        excel_path = os.path.join(assets_quiz, "excel-export.js")
        if os.path.exists(excel_path):
            with open(excel_path, "r", encoding="utf-8") as f:
                e_code = f.read()
            e_code = e_code.replace("vendor/xlsx.full.min.js", "assets/quiz/xlsx.full.min.js")
            e_code = e_code.replace("vendor/exceljs.min.js", "assets/quiz/exceljs.min.js")
            with open(excel_path, "w", encoding="utf-8") as f:
                f.write(e_code)

        # 6. Post-prosessering for print.css og style.css
        style_css = os.path.join(assets_quiz, "style.css")
        if os.path.exists(style_css):
            with open(style_css, "r", encoding="utf-8") as f:
                s_code = f.read()
            stray = "  font-weight: 700;\n  padding: 0.35rem 0.6rem;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.15s ease;\n}"
            s_code = s_code.replace(stray, "")
            s_code = s_code.replace(stray.replace("\n", "\r\n"), "")
            with open(style_css, "w", encoding="utf-8") as f:
                f.write(s_code)

        print_css = os.path.join(assets_quiz, "print.css")
        if os.path.exists(print_css):
            with open(print_css, "r", encoding="utf-8") as f:
                p_code = f.read()
            if ".site-header" not in p_code:
                p_code = p_code.replace(
                    ".no-print,",
                    ".no-print,\n  .site-header,\n  .site-nav,\n  .site-footer,\n  #vipps-widget,\n  #feedback-modal,"
                )
                with open(print_css, "w", encoding="utf-8") as f:
                    f.write(p_code)

        # 7. Oppdater HTML-strukturen i quiz.html
        quiz_html_path = os.path.join(root_dir, "quiz.html")
        src_index_path = os.path.join(temp_dir, "index.html")

        if os.path.exists(quiz_html_path) and os.path.exists(src_index_path):
            with open(src_index_path, "r", encoding="utf-8") as f:
                src_html = f.read()

            # Trekk ut innholdet inni <div class="app-container" ...> ... </div>
            m = re.search(r'(<div class="app-container"[^>]*>[\s\S]*?</div>\s*<!-- \s*Skript og biblioteker|<div class="app-container"[^>]*>[\s\S]*?</div>\s*<script)', src_html)
            if not m:
                # Fallback: trekk ut alt mellom body start og script start
                m = re.search(r'<body>([\s\S]*?)<script src="vendor/', src_html)

            app_container_html = ""
            if m:
                extracted = m.group(1)
                # Kutt eventuell script-kommentar i slutten
                for end_marker in ["<!--  Skript", "<!-- Skript", "<script"]:
                    if end_marker in extracted:
                        extracted = extracted[:extracted.find(end_marker)].strip()
                app_container_html = extracted

            if app_container_html:
                # Bygg komplett oppdatert quiz.html
                with open(quiz_html_path, "r", encoding="utf-8") as f:
                    current_quiz_html = f.read()

                # Finn header og footer
                header_part = current_quiz_html[:current_quiz_html.find("  <!-- SELVE QUIZ KRAFT APPLIKASJONEN -->")]
                footer_idx = current_quiz_html.find("  <!-- BUNNSEKSJON (VIPPS, FEEDBACK, FOOTER) -->")
                footer_part = current_quiz_html[footer_idx:]

                # Oppdater skriptliste i footer_part hvis nye skript mangler
                script_tags = """  <!-- Skript og biblioteker (100 % lokalt og offline) -->
  <script src="assets/quiz/exceljs.min.js"></script>
  <script src="assets/quiz/xlsx.full.min.js"></script>
  <script src="assets/quiz/confetti.js"></script>
  <script src="assets/quiz/scoring.js"></script>
  <script src="assets/quiz/round-analysis.js"></script>
  <script src="assets/quiz/storage.js"></script>
  <script src="assets/quiz/excel-export.js"></script>
  <script src="assets/quiz/spreadsheet.js"></script>
  <script src="assets/quiz/app.js"></script>
  <script defer src="assets/vipps.js"></script>
  <script defer src="assets/feedback.js"></script>
  <script>
    const yEl = document.getElementById('year');
    if (yEl) yEl.textContent = new Date().getFullYear();
  </script>
</body>
</html>"""

                footer_part = footer_part[:footer_part.find("  <!-- Skript og biblioteker")] + script_tags

                new_quiz_html = header_part + "  <!-- SELVE QUIZ KRAFT APPLIKASJONEN -->\n  " + app_container_html + "\n\n" + footer_part

                with open(quiz_html_path, "w", encoding="utf-8") as f:
                    f.write(new_quiz_html)
                print("  ✓ Oppdatert quiz.html med nyeste HTML-struktur og skript")

        print("✅ Quiz Kraft er 100 % synkronisert!")

    except Exception as e:
        print(f"❌ Feil ved synkronisering av Quiz Kraft: {e}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def sync_qr_kraft(root_dir):
    print("\n==================================================")
    print("🔄 Synkroniserer: QR Kraft (RanheimGeriljaTV/QR-Kraft)")
    print("==================================================")
    temp_dir = tempfile.mkdtemp(prefix="sync_qr_")
    try:
        cmd = ["git", "clone", "--depth", "1", "https://github.com/RanheimGeriljaTV/QR-Kraft.git", temp_dir]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        mappings = [
            ("assets/css/style.css", "assets/qr-style.css"),
            ("assets/js/qr-engine.js", "assets/qr-js/qr-engine.js"),
            ("assets/vendor/qr-code-styling.js", "assets/vendor/qr-code-styling.js"),
        ]

        copied_count = 0
        for src_rel, dst_rel in mappings:
            src_path = os.path.join(temp_dir, src_rel)
            dst_path = os.path.join(root_dir, dst_rel)
            if os.path.exists(src_path):
                os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                shutil.copy2(src_path, dst_path)
                copied_count += 1
                print(f"  ✓ {src_rel} -> {dst_rel}")

        print(f"✅ QR Kraft: {copied_count} filer synkronisert.")

    except Exception as e:
        print(f"❌ Feil ved synkronisering av QR Kraft: {e}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def sync_tabell_kraft(root_dir):
    print("\n==================================================")
    print("🔄 Synkroniserer: Tabell Kraft (RanheimGeriljaTV/Kraft-Tabell-tips)")
    print("==================================================")
    temp_dir = tempfile.mkdtemp(prefix="sync_tabell_")
    try:
        cmd = ["git", "clone", "--depth", "1", "https://github.com/RanheimGeriljaTV/Kraft-Tabell-tips.git", temp_dir]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        dst_tabell = os.path.join(root_dir, "tabell")
        os.makedirs(dst_tabell, exist_ok=True)

        # 1. css
        src_css = os.path.join(temp_dir, "css")
        if os.path.exists(src_css):
            dst_css = os.path.join(dst_tabell, "css")
            os.makedirs(dst_css, exist_ok=True)
            for f in os.listdir(src_css):
                shutil.copy2(os.path.join(src_css, f), os.path.join(dst_css, f))
                print(f"  ✓ css/{f} -> tabell/css/{f}")

        # 2. js
        src_js = os.path.join(temp_dir, "js")
        if os.path.exists(src_js):
            dst_js = os.path.join(dst_tabell, "js")
            os.makedirs(dst_js, exist_ok=True)
            for f in os.listdir(src_js):
                shutil.copy2(os.path.join(src_js, f), os.path.join(dst_js, f))
                print(f"  ✓ js/{f} -> tabell/js/{f}")

        # 3. index.html med Umami Analytics
        src_html = os.path.join(temp_dir, "index.html")
        if os.path.exists(src_html):
            with open(src_html, "r", encoding="utf-8") as f:
                html = f.read()

            # Umami analytics
            if "cloud.umami.is" not in html:
                umami_tag = '\n  <!-- Umami Analytics -->\n  <script defer src="https://cloud.umami.is/script.js" data-website-id="7618ae03-9bb8-4228-87cc-14ec10f0fcf0"></script>'
                html = html.replace('</head>', f'{umami_tag}\n</head>')

            dst_html = os.path.join(dst_tabell, "index.html")
            with open(dst_html, "w", encoding="utf-8") as f:
                f.write(html)
            print("  ✓ index.html -> tabell/index.html")

        print("✅ Tabell Kraft synkronisert.")

    except Exception as e:
        print(f"❌ Feil ved synkronisering av Tabell Kraft: {e}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser(description="Synkroniser subprosjekter for ranheimkraft.no")
    parser.add_argument("--project", default="all", help="Prosjekt-ID (f.eks. 'quiz', 'qr', 'tabell' eller 'all')")
    args = parser.parse_args()

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    print(f"Arbeidsområde: {root_dir}")

    target = args.project.lower().strip()

    if target in ("all", "quiz", "quiz-kraft"):
        sync_quiz_kraft(root_dir)

    if target in ("all", "qr", "qr-kraft"):
        sync_qr_kraft(root_dir)

    if target in ("all", "tabell", "tabell-kraft", "tipping"):
        sync_tabell_kraft(root_dir)

    print("\n🎉 Synkroniseringskjøring fullført!")


if __name__ == "__main__":
    main()
