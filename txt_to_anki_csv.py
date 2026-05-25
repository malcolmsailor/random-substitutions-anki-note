#!/usr/bin/env python3
"""Convert plain text card definitions to Anki-importable tab-separated file.

Input format (cards separated by blank lines):

    Front:
    What is 2+2?
    Back:
    4
    Vars:
    x=2
    y=2

Output: tab-separated file with Anki #header directives.
"""

import argparse
import sys
from pathlib import Path

SECTION_NAMES = ("Front", "Back", "Vars")
DEFAULT_DECK = "Practice::Math"
DEFAULT_NOTETYPE = "Math card with substitutions"
DEFAULT_OUTPUT = Path("~/tmp/math.csv").expanduser()


def parse_cards(text: str) -> list[dict[str, str]]:
    cards: list[dict[str, str]] = []
    current_card: dict[str, str] = {}
    current_section: str | None = None
    current_lines: list[str] = []

    def _flush_section() -> None:
        if current_section is not None:
            current_card[current_section] = "\n".join(current_lines).strip()

    for line in text.split("\n"):
        stripped = line.strip()
        if stripped.endswith(":") and stripped[:-1] in SECTION_NAMES:
            section_name = stripped[:-1]
            _flush_section()
            if section_name == "Front" and current_card:
                cards.append(current_card)
                current_card = {}
            current_section = section_name
            current_lines = []
        elif current_section is None:
            # Between cards (blank lines, etc.)
            continue
        else:
            current_lines.append(line)

    _flush_section()
    if current_card:
        cards.append(current_card)

    return cards


def validate_cards(cards: list[dict[str, str]]) -> None:
    for i, card in enumerate(cards):
        assert "Front" in card, f"Card {i + 1} is missing a 'Front:' section"
        assert "Back" in card, f"Card {i + 1} is missing a 'Back:' section"


def card_to_row(card: dict[str, str], columns: list[str]) -> list[str]:
    return [card.get(col, "") for col in columns]


def escape_field(field: str, sep: str) -> str:
    if sep in field or '"' in field or "\n" in field:
        return '"' + field.replace('"', '""') + '"'
    return field


def write_output(
    cards: list[dict[str, str]],
    columns: list[str],
    *,
    deck: str | None = None,
    notetype: str | None = None,
    out: object = sys.stdout,
) -> None:
    sep = "\t"
    print("#separator:Tab", file=out)
    print("#html:true", file=out)
    if deck:
        print(f"#deck:{deck}", file=out)
    if notetype:
        print(f"#notetype:{notetype}", file=out)
    print(f"#columns:{sep.join(columns)}", file=out)

    for card in cards:
        row = card_to_row(card, columns)
        print(sep.join(escape_field(f, sep) for f in row), file=out)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert plain text card definitions to Anki-importable format."
    )
    parser.add_argument("input", type=Path, help="Input text file")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output file (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--deck", default=DEFAULT_DECK, help=f"Anki deck name (default: {DEFAULT_DECK})"
    )
    parser.add_argument(
        "--notetype",
        default=DEFAULT_NOTETYPE,
        help=f"Anki note type name (default: {DEFAULT_NOTETYPE})",
    )
    args = parser.parse_args()

    text = args.input.read_text(encoding="utf-8")
    cards = parse_cards(text)

    assert cards, f"No cards found in {args.input}"
    validate_cards(cards)

    has_vars = any("Vars" in card for card in cards)
    columns = ["Front", "Back"] + (["Vars"] if has_vars else [])

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            write_output(cards, columns, deck=args.deck, notetype=args.notetype, out=f)
    else:
        write_output(cards, columns, deck=args.deck, notetype=args.notetype)


if __name__ == "__main__":
    main()
