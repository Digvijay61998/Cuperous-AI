"""Builds the myKONE Assistant knowledge base for bot training.

Outputs (same content, two formats):
  myKONE-Assistant-Knowledge-Base.pdf   upload to the bot's Training Data
  myKONE-Assistant-Knowledge-Base.txt   plain-text alternative (cleanest chunks)

Run: python build_knowledge_pdf.py   (needs reportlab)
"""
import os
import re
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from content import SECTIONS

HERE = os.path.dirname(os.path.abspath(__file__))
PDF = os.path.join(HERE, "myKONE-Assistant-Knowledge-Base.pdf")
TXT = os.path.join(HERE, "myKONE-Assistant-Knowledge-Base.txt")
TITLE = "myKONE Assistant Knowledge Base"
SUBTITLE = "Questions and answers about the myKONE customer portal"

# DejaVu covers curly quotes, dashes and accented characters used in the texts.
FONT_DIR = "/usr/share/fonts/truetype/dejavu"
pdfmetrics.registerFont(TTFont("DV", f"{FONT_DIR}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", f"{FONT_DIR}/DejaVuSans-Bold.ttf"))

NAVY, BLUE, GREY = colors.HexColor("#13234A"), colors.HexColor("#1450F5"), colors.HexColor("#5B6478")
st_title = ParagraphStyle("t", fontName="DVB", fontSize=24, leading=30, textColor=NAVY, spaceAfter=6)
st_sub = ParagraphStyle("s", fontName="DV", fontSize=12, leading=16, textColor=GREY, spaceAfter=18)
st_h1 = ParagraphStyle("h1", fontName="DVB", fontSize=16, leading=21, textColor=BLUE, spaceBefore=6, spaceAfter=4)
st_intro = ParagraphStyle("in", fontName="DV", fontSize=9.5, leading=13, textColor=GREY, spaceAfter=8)
st_q = ParagraphStyle("q", fontName="DVB", fontSize=10.5, leading=14, textColor=NAVY, spaceBefore=7, spaceAfter=2)
st_a = ParagraphStyle("a", fontName="DV", fontSize=10, leading=14, alignment=TA_LEFT, spaceAfter=4)
st_toc = ParagraphStyle("toc", fontName="DV", fontSize=10.5, leading=16)
st_note = ParagraphStyle("n", fontName="DV", fontSize=9.5, leading=13.5, textColor=GREY)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def link(s):
    return re.sub(r"(https?://[^\s)]+?)([.,]?)(?=\s|$|\))",
                  lambda m: f'<link href="{m.group(1)}" color="#1450F5">{m.group(1)}</link>{m.group(2)}', s)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("DV", 8)
    canvas.setFillColor(GREY)
    canvas.drawString(18 * mm, 10 * mm, f"{TITLE}")
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


total = sum(len(e) for _, _, e in SECTIONS)
story = [
    Paragraph(TITLE, st_title),
    Paragraph(SUBTITLE, st_sub),
    Paragraph(
        f"{len(SECTIONS)} topics · {total} questions · Generated {date.today().isoformat()}. "
        "Based on the English texts of the myKONE portal. Features, names and availability can differ by "
        "country, contract and user role. Emergencies (someone trapped or in danger) must always go to KONE's "
        "24/7 emergency service line, never to the portal or chat.", st_note),
    Spacer(1, 10),
    Paragraph("Contents", st_h1),
]
for i, (title, _, entries) in enumerate(SECTIONS, 1):
    story.append(Paragraph(f"{i}. {esc(title)} ({len(entries)})", st_toc))
story.append(PageBreak())

txt = [TITLE, SUBTITLE, ""]
for i, (title, intro, entries) in enumerate(SECTIONS, 1):
    story.append(Paragraph(f"{i}. {esc(title)}", st_h1))
    txt += ["", f"{i}. {title.upper()}", ""]
    if intro:
        story.append(Paragraph(esc(intro), st_intro))
    for q, a in entries:
        # Topic prefix keeps each chunk self-describing for retrieval.
        story.append(KeepTogether([Paragraph(esc(q), st_q), Paragraph(link(esc(a)), st_a)]))
        txt += [f"Q: {q}", f"A: {a}", ""]

doc = SimpleDocTemplate(PDF, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                        topMargin=16 * mm, bottomMargin=18 * mm, title=TITLE, author="JarCube",
                        subject="myKONE customer portal knowledge base for the myKONE Assistant")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
with open(TXT, "w", encoding="utf-8") as fh:
    fh.write("\n".join(txt).strip() + "\n")
print(f"wrote {PDF}\nwrote {TXT}\n{len(SECTIONS)} sections, {total} Q&A")
