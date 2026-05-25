import argparse
import os
import re
import subprocess
import tempfile

# import pytest

N_CARDS = 2

SCRIPT_DIR = os.path.dirname((os.path.realpath(__file__)))
NOTE_DIR = os.path.join(SCRIPT_DIR, "../note")
CARD_TEMPLATE = os.path.join(NOTE_DIR, "plot_card{n}_{face}.html")


# IMG_PATH = os.path.join(SCRIPT_DIR, "test_img.jpeg")

TEST_DATA = {
    "plot1": {
        "Function": "SYM[b]x + SYM[c]",
        "Javascript": "SYM[b] * x + SYM[c]",
        "Vars": """a,b,c=1:10""",
    },
    "plot2": {
        "Function": "SYM[a]x^2 + SYM[b]x + SYM[c]",
        "Javascript": "SYM[a] * x**2 + SYM[b] * x + SYM[c]",
        "Vars": """a,b,c=1:10""",
    },
}  # TODO: (Malcolm 2024-01-07)

DEFAULT_TEST_DATA_KEY = "plot1"


def get_abs_js_paths(html_content):
    js_re = re.compile(r"injectScript\(['\"]([A-Za-z0-9_.-]+\.js)['\"]")
    print(re.findall(js_re, html_content))
    html_content = re.sub(
        js_re,
        lambda m: "injectScript('" + os.path.join(NOTE_DIR, m.group(1)) + "'",
        html_content,
    )
    js_re = re.compile(
        r"(?P<prefix><script type=['\"]text/javascript['\"] src=['\"])(?P<path>[A-Za-z0-9_.-]+\.js)(?P<postfix>['\"])"
    )
    html_content = re.sub(
        js_re,
        lambda m: m.group("prefix")
        + os.path.join(NOTE_DIR, m.group("path"))
        + m.group("postfix"),
        html_content,
    )
    return html_content


CSS_PATH = os.path.join(NOTE_DIR, "styling.css")
HEADER = f"""
<head>
    <link rel="stylesheet" href="{CSS_PATH}">
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script
      id="MathJax-script"
      async
      src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
    ></script>
</head>\n<div class="card">"""
FOOTER = "</div>"


def replace_anki_conditionals(content, test_data):
    for field_name, field_value in test_data.items():
        content = re.sub(
            r"{{#" + field_name + r"}}(?P<content>.*?){{/" + field_name + r"}}",
            r"\g<content>" if field_value else "",
            content,
            flags=re.DOTALL,
        )
        content = re.sub(
            r"{{\^" + field_name + r"}}(?P<content>.*?){{/" + field_name + r"}}",
            r"\g<content>" if not field_value else "",
            content,
            flags=re.DOTALL,
        )
    return content


def test_card(card, test_data_key):
    test_data = TEST_DATA[test_data_key]
    with open(card, "r", encoding="utf-8") as inf:
        content = inf.read()
    for name, val in test_data.items():
        content = content.replace("{{" + name + "}}", val)
    content = get_abs_js_paths(content)
    content = replace_anki_conditionals(content, test_data)
    _, temppath = tempfile.mkstemp(suffix=".html")
    with open(temppath, "w", encoding="utf-8") as tempf:
        tempf.write(HEADER)
        tempf.write(content)
        tempf.write(FOOTER)
    subprocess.run(["open", temppath])
    input("Press enter to delete temp file")
    os.remove(temppath)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-c", "--card", choices=tuple(i + 1 for i in range(N_CARDS)), type=int
    )
    parser.add_argument("-f", "--face", choices=("f", "b"))
    parser.add_argument(
        "-d",
        "--test-data",
        choices=tuple(TEST_DATA.keys()),
        default=DEFAULT_TEST_DATA_KEY,
    )
    args = parser.parse_args()
    for i in range(1, N_CARDS + 1):
        if args.card in (None, i):
            if args.face in ("f", None):
                test_card(CARD_TEMPLATE.format(n=i, face="front"), args.test_data)
            if args.face in ("b", None):
                test_card(CARD_TEMPLATE.format(n=i, face="back"), args.test_data)
