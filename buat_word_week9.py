from pathlib import Path
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

base=Path(__file__).parent
lines=(base/'TUGAS_WEEK_9_DEFENSIVE_PROGRAMMING.md').read_text(encoding='utf-8').splitlines()
doc=Document(); section=doc.sections[0]
section.orientation=WD_ORIENT.LANDSCAPE
section.page_width=Inches(11.69); section.page_height=Inches(8.27)
section.left_margin=section.right_margin=Inches(.7)
section.top_margin=section.bottom_margin=Inches(.65)
styles=doc.styles
normal=styles['Normal']; normal.font.name='Calibri'; normal.font.size=Pt(10)
normal.paragraph_format.space_after=Pt(6)
for name,size in [('Title',20),('Heading 1',14)]:
 s=styles[name]; s.font.name='Calibri'; s.font.size=Pt(size); s.font.color.rgb=RGBColor(0,0,0)

def inline(p,text):
 for piece in re.split(r'(\*\*.*?\*\*|`[^`]*`|\*[^*]+\*)',text):
  if not piece: continue
  if piece.startswith('**') and piece.endswith('**'):
   r=p.add_run(piece[2:-2]); r.bold=True
  elif piece.startswith('`') and piece.endswith('`'):
   r=p.add_run(piece[1:-1]); r.font.name='Consolas'; r.font.size=Pt(9)
  elif piece.startswith('*') and piece.endswith('*'):
   r=p.add_run(piece[1:-1]); r.italic=True
  else: p.add_run(piece)

def shade(cell,color):
 tcPr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),color); tcPr.append(shd)

def add_table(rows):
 t=doc.add_table(rows=0,cols=5); t.autofit=False
 widths=[.65,2.4,2.3,3.25,1.7]
 for col,w in zip(t.columns,widths): col.width=Inches(w)
 borders=OxmlElement('w:tblBorders')
 for edge in ('top','left','bottom','right','insideH','insideV'):
  e=OxmlElement('w:'+edge); e.set(qn('w:val'),'single'); e.set(qn('w:sz'),'4'); e.set(qn('w:color'),'D9D9D9'); borders.append(e)
 t._tbl.tblPr.append(borders)
 for idx,row in enumerate(rows):
  cells=t.add_row().cells
  trpr=cells[0]._tc.getparent().get_or_add_trPr()
  if idx==0: trpr.append(OxmlElement('w:tblHeader'))
  trpr.append(OxmlElement('w:cantSplit'))
  for j,(cell,txt) in enumerate(zip(cells,row)):
   cell.width=Inches(widths[j]); cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
   shade(cell,'234663' if idx==0 else ('F1F5F8' if idx%2==0 else 'FFFFFF'))
   p=cell.paragraphs[0]; p.paragraph_format.space_after=Pt(4); p.paragraph_format.space_before=Pt(4)
   inline(p,txt.strip())
   for run in p.runs:
    if idx==0: run.bold=True; run.font.color.rgb=RGBColor(255,255,255)
    if run.font.size is None: run.font.size=Pt(9)
 doc.add_paragraph().paragraph_format.space_after=Pt(1)

i=0
while i<len(lines):
 line=lines[i].strip()
 if not line: i+=1; continue
 if line.startswith('|'):
  rows=[]
  while i<len(lines) and lines[i].strip().startswith('|'):
   row=[x.strip() for x in lines[i].strip().strip('|').split('|')]
   if not all(re.fullmatch(r'[-: ]+',x or ' ') for x in row): rows.append(row)
   i+=1
  add_table(rows); continue
 if line.startswith('# '):
  p=doc.add_paragraph(style='Title'); inline(p,line[2:].replace(' — ',' '))
 elif line.startswith('## '):
  p=doc.add_paragraph(style='Heading 1'); inline(p,line[3:])
 else:
  p=doc.add_paragraph(); inline(p,line)
 i+=1
doc.save(base/'TUGAS_WEEK_9_DEFENSIVE_PROGRAMMING.docx')
