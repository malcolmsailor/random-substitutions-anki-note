import io
import textwrap

from txt_to_anki_csv import card_to_row, parse_cards, validate_cards, write_output


class TestParseCards:
    def test_single_card(self):
        text = textwrap.dedent("""\
            Front:
            What is 2+2?
            Back:
            4
        """)
        cards = parse_cards(text)
        assert len(cards) == 1
        assert cards[0]["Front"] == "What is 2+2?"
        assert cards[0]["Back"] == "4"

    def test_two_cards(self):
        text = textwrap.dedent("""\
            Front:
            Q1
            Back:
            A1

            Front:
            Q2
            Back:
            A2
        """)
        cards = parse_cards(text)
        assert len(cards) == 2
        assert cards[0]["Front"] == "Q1"
        assert cards[1]["Front"] == "Q2"

    def test_with_vars(self):
        text = textwrap.dedent("""\
            Front:
            Question
            Back:
            Answer
            Vars:
            x=1
            y=2
        """)
        cards = parse_cards(text)
        assert len(cards) == 1
        assert cards[0]["Vars"] == "x=1\ny=2"

    def test_multiline_content(self):
        text = textwrap.dedent("""\
            Front:
            Line 1
            Line 2

            Line 3
            Back:
            Answer
        """)
        cards = parse_cards(text)
        assert len(cards) == 1
        assert cards[0]["Front"] == "Line 1\nLine 2\n\nLine 3"

    def test_multiple_blank_lines_between_cards(self):
        text = textwrap.dedent("""\
            Front:
            Q1
            Back:
            A1



            Front:
            Q2
            Back:
            A2
        """)
        cards = parse_cards(text)
        assert len(cards) == 2

    def test_vars_optional(self):
        text = textwrap.dedent("""\
            Front:
            Q1
            Back:
            A1
            Vars:
            x=1

            Front:
            Q2
            Back:
            A2
        """)
        cards = parse_cards(text)
        assert len(cards) == 2
        assert "Vars" in cards[0]
        assert "Vars" not in cards[1]


class TestCardToRow:
    def test_basic(self):
        card = {"Front": "Q", "Back": "A"}
        row = card_to_row(card, ["Front", "Back"])
        assert row == ["Q", "A"]

    def test_newlines_preserved(self):
        card = {"Front": "Line 1\nLine 2", "Back": "A"}
        row = card_to_row(card, ["Front", "Back"])
        assert row == ["Line 1\nLine 2", "A"]

    def test_missing_column_gives_empty(self):
        card = {"Front": "Q", "Back": "A"}
        row = card_to_row(card, ["Front", "Back", "Vars"])
        assert row == ["Q", "A", ""]


class TestWriteOutput:
    def test_headers_and_data(self):
        cards = [{"Front": "Q", "Back": "A"}]
        buf = io.StringIO()
        write_output(
            cards, ["Front", "Back"], deck="TestDeck", notetype="Basic", out=buf
        )
        output = buf.getvalue()
        assert "#separator:Tab\n" in output
        assert "#html:true\n" in output
        assert "#deck:TestDeck\n" in output
        assert "#notetype:Basic\n" in output
        assert "#columns:Front\tBack\n" in output
        assert "Q\tA\n" in output

    def test_multiline_fields_quoted(self):
        cards = [{"Front": "Line 1\nLine 2", "Back": "A"}]
        buf = io.StringIO()
        write_output(cards, ["Front", "Back"], out=buf)
        output = buf.getvalue()
        assert '"Line 1\nLine 2"\tA' in output

    def test_quotes_in_fields_escaped(self):
        cards = [{"Front": 'She said "hello"', "Back": "A"}]
        buf = io.StringIO()
        write_output(cards, ["Front", "Back"], out=buf)
        lines = buf.getvalue().split("\n")
        data_lines = [l for l in lines if not l.startswith("#") and l.strip()]
        assert data_lines[0] == '"She said ""hello"""\tA'

    def test_no_deck_or_notetype(self):
        cards = [{"Front": "Q", "Back": "A"}]
        buf = io.StringIO()
        write_output(cards, ["Front", "Back"], out=buf)
        output = buf.getvalue()
        assert "#deck:" not in output
        assert "#notetype:" not in output


class TestValidateCards:
    def test_valid(self):
        validate_cards([{"Front": "Q", "Back": "A"}])

    def test_missing_front(self):
        try:
            validate_cards([{"Back": "A"}])
            assert False, "Should have raised"
        except AssertionError:
            pass

    def test_missing_back(self):
        try:
            validate_cards([{"Front": "Q"}])
            assert False, "Should have raised"
        except AssertionError:
            pass
