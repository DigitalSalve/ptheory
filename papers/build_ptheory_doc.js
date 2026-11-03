const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, Header, Footer, PageNumber, LevelFormat,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak
} = require('docx'); // npm install docx, then: node papers/build_ptheory_doc.js

const outDir = __dirname; // writes the .docx and its charts next to this script
const chartsDir = path.join(outDir, 'ptheory-charts');
fs.mkdirSync(chartsDir, { recursive: true });

const colors = {
  bg: '#171717', box: '#303030', boxStroke: '#555555', text: '#F5F5F5',
  line: '#D7D7D7', architect: '#234E70', operator: '#6B3F24', decision: '#444444',
  advisory: '#E4A853', enforce: '#4EA67A'
};

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function multiline(x, y, lines, opts = {}) {
  const size = opts.size || 18, fill = opts.fill || colors.text, weight = opts.weight || 400;
  const anchor = opts.anchor || 'middle';
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${lines.map((t,i)=>`<tspan x="${x}" dy="${i===0?0:size+4}">${esc(t)}</tspan>`).join('')}</text>`;
}
function box(x,y,w,h,lines,fill=colors.box) {
  const ty = y + h/2 - ((lines.length-1)*11);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${colors.boxStroke}" stroke-width="1.5"/>${multiline(x+w/2,ty,lines,{size:17})}`;
}
function diamond(cx,cy,w,h,lines) {
  return `<polygon points="${cx},${cy-h/2} ${cx+w/2},${cy} ${cx},${cy+h/2} ${cx-w/2},${cy}" fill="${colors.decision}" stroke="${colors.boxStroke}" stroke-width="1.5"/>${multiline(cx,cy-((lines.length-1)*10),lines,{size:16})}`;
}
function arrow(x1,y1,x2,y2,label='',dash=false,color=colors.line) {
  const labelSvg = label ? multiline((x1+x2)/2,(y1+y2)/2-8,[label],{size:14,fill:color}) : '';
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" ${dash?'stroke-dasharray="7 6"':''} marker-end="url(#arrow)"/>${labelSvg}`;
}
function curved(pathD,labelX,labelY,label='',dash=false,color=colors.line) {
  return `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" ${dash?'stroke-dasharray="7 6"':''} marker-end="url(#arrow)"/>${label?multiline(labelX,labelY,[label],{size:14,fill:color}):''}`;
}
function svgWrap(width,height,title,body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><marker id="arrow" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 9 3.5, 0 7" fill="${colors.line}"/></marker></defs><rect width="100%" height="100%" rx="16" fill="${colors.bg}"/>${multiline(36,36,[title],{size:22,weight:700,anchor:'start'})}${body}</svg>`;
}

const charts = [];
charts.push(['complement', svgWrap(1400,260,'How the Architect and Operator complement each other',
  box(40,92,220,78,['INTP Architect','What could work?'],colors.architect)+
  arrow(260,131,320,131)+box(320,92,225,78,['Model or prototype'])+
  arrow(545,131,605,131)+box(605,92,235,78,['ESTJ Operator','Will it reliably work?'],colors.operator)+
  arrow(840,131,900,131)+diamond(985,131,150,116,['Critical gap?'])+
  arrow(1060,131,1130,131,'No')+box(1130,92,230,78,['Stabilize and operate'])+
  curved('M 985 189 C 850 235, 350 235, 150 171',610,226,'Yes')
)]);

charts.push(['parallel', svgWrap(1400,430,'Parallel awareness: protected exploration with an operator alongside',
  `<rect x="35" y="70" width="820" height="310" rx="12" fill="#1C2630" stroke="#315A77" stroke-width="2"/>`+
  multiline(60,102,['ARCHITECT — divergent and reactive'],{size:17,weight:700,anchor:'start',fill:'#8DC7EE'})+
  box(75,155,180,74,['Creative seed'],colors.architect)+arrow(255,192,315,192)+
  box(315,155,180,74,['Explore'],colors.architect)+arrow(495,192,555,192)+
  box(555,155,220,74,['Prototype and learn'],colors.architect)+
  curved('M 665 229 C 665 315, 405 315, 405 229',535,306,'Observe and revise')+
  `<rect x="900" y="70" width="465" height="310" rx="12" fill="#30251D" stroke="#8A5837" stroke-width="2"/>`+
  multiline(925,102,['OPERATOR — convergent and deliberative'],{size:17,weight:700,anchor:'start',fill:'#E8B28B'})+
  box(950,140,365,68,['Observe emerging work'],colors.operator)+
  arrow(1132,208,1132,248)+box(950,248,365,68,['Evaluate against hooks and policies'],colors.operator)+
  arrow(775,172,950,172,'Visibility',true,colors.advisory)+
  curved('M 950 282 C 860 360, 580 365, 490 229',735,357,'Non-blocking guidance',true,colors.advisory)
)]);

charts.push(['timing', svgWrap(1400,330,'Enforcement at the right moment',
  box(45,120,190,76,['Creative seed'],colors.architect)+arrow(235,158,290,158)+
  box(290,120,190,76,['Explore'],colors.architect)+arrow(480,158,535,158)+
  box(535,120,210,76,['Concrete prototype'],colors.architect)+arrow(745,158,805,158)+
  diamond(900,158,170,126,['Commitment','boundary?'])+
  curved('M 900 221 C 850 290, 420 290, 385 196',625,282,'Not yet')+
  arrow(985,158,1050,158,'Yes',false,colors.enforce)+
  box(1050,120,305,76,['Hooks become enforceable'],colors.operator)
)]);

charts.push(['journey', svgWrap(1400,520,'The complete PTheory feedback loop',
  box(55,110,230,72,['Architect creates'],colors.architect)+arrow(285,146,345,146)+
  box(345,110,250,72,['Explore and prototype'],colors.architect)+arrow(595,146,655,146)+
  box(655,110,250,72,['Concrete implementation'])+arrow(905,146,965,146)+
  box(965,110,330,72,['Commitment boundary'])+
  box(410,305,280,72,['Operator observes in parallel'],colors.operator)+
  curved('M 470 182 C 470 225, 500 255, 540 305',430,250,'Emerging context',true,colors.advisory)+
  curved('M 690 341 C 820 335, 845 235, 760 182',820,295,'Advisory feedback',true,colors.advisory)+
  arrow(1130,182,1130,260,'Enforcement begins',false,colors.enforce)+
  box(980,260,300,72,['Inspect, test, validate'],colors.operator)+
  arrow(980,296,905,296)+diamond(815,296,180,126,['Critical gap?'])+
  curved('M 815 359 C 740 465, 230 465, 170 182',470,450,'Yes — focused remediation')+
  arrow(815,359,815,425,'No',false,colors.enforce)+box(680,425,270,64,['Stabilize and operate'],colors.operator)
)]);

for (const [name, svg] of charts) fs.writeFileSync(path.join(chartsDir, `${name}.svg`), svg);

const image = (name, width, height, alt) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 240 },
  children: [new ImageRun({ type: 'svg', data: fs.readFileSync(path.join(chartsDir, `${name}.svg`)), transformation: { width, height }, altText: { title: alt, description: alt, name: alt } })]
});
const p = (text, opts={}) => new Paragraph({ spacing: { after: opts.after ?? 140, line: 300 }, children: [new TextRun({ text, bold: !!opts.bold, italics: !!opts.italics, color: opts.color || '222222', size: opts.size || 22 })] });
const quote = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 180 }, border: { left: { style: BorderStyle.SINGLE, size: 14, color: '315A77', space: 12 } }, children: [new TextRun({ text, bold: true, italics: true, color: '234E70', size: 25 })] });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const bullet = (text) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 90 }, children: [new TextRun({ text, size: 21 })] });

const border = { style: BorderStyle.SINGLE, size: 1, color: 'C8D1D8' };
const borders = { top:border,bottom:border,left:border,right:border };
const cell = (text,width,fill,bold=false) => new TableCell({ width:{size:width,type:WidthType.DXA}, borders, shading:{fill,type:ShadingType.CLEAR}, margins:{top:100,bottom:100,left:140,right:140}, children:[new Paragraph({children:[new TextRun({text,bold,size:20})]})] });

const children = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 900, after: 260 }, children: [new TextRun({ text: 'PTheory', bold: true, size: 54, color: '234E70' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: 'Parallel Architecture and Operations', bold: true, size: 34, color: '222222' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 520 }, children: [new TextRun({ text: 'Divergent discovery, convergent readiness, and enforcement at the right moment', italics: true, size: 24, color: '555555' })] }),
  quote('Parallel awareness. Protected exploration. Timely enforcement.'),
  new Paragraph({ children: [new PageBreak()] }),

  h1('1. The Core Principle'),
  p('PTheory allows the Architect and Operator to work in parallel without forcing them to use the same reasoning mode at the same time. The Architect remains contextually aware of the hooks, policies, readiness criteria, and operational constraints that guide the Operator. During the initial creative seed, those controls provide context rather than enforcement.'),
  quote('Awareness without premature enforcement.'),
  image('complement', 650, 121, 'How the Architect and Operator complement each other'),

  h1('2. Two Complementary Reasoning Modes'),
  h2('The Architect: divergent and reactive'),
  p('The Architect expands the possibility space. The work begins with a seed, then develops through experimentation, immediate feedback, pattern recognition, and revision.'),
  bullet('Generates multiple possibilities and challenges assumptions.'),
  bullet('Learns by making ideas concrete through models and prototypes.'),
  bullet('Changes direction as new information appears.'),
  bullet('Keeps downstream operational requirements visible without letting them dominate discovery.'),
  h2('The Operator: convergent and deliberative'),
  p('The Operator narrows the possibility space. Established knowledge, evidence, standards, and repeatability are used to determine whether an emerging solution can be operated safely.'),
  bullet('Applies policies, hooks, security requirements, and known failure modes.'),
  bullet('Checks completeness, ownership, evidence, and repeatability.'),
  bullet('Identifies risks that must be resolved before commitment.'),
  bullet('Stabilizes the result for dependable operation.'),

  h1('3. Why the Modes Should Not Be Forced Together'),
  p('Divergence requires openness and tolerance for ambiguity. Convergence requires judgment, elimination, and commitment. Asking one person or process to perform both continuously creates an internal conflict: each new possibility is judged before it has enough time to develop.'),
  p('This is premature convergence. It can produce creative shutdown, hesitation, perfectionism, excessive analysis, conventional answers, or the loss of the original creative seed.'),
  p('Many people can use both modes, but switching between them has a cognitive cost. The system works better when it provides a clear transition: the Architect discovers what should exist; the Operator determines whether it can exist safely, reliably, and repeatedly.'),

  h1('4. INTP and ESTJ as an Illustrative Pair'),
  p('The Architect–Operator distinction can be illustrated through INTP and ESTJ preferences. MBTI describes preferences rather than fixed abilities, so this is a useful analogy—not a limit on what either type can do.'),
  new Table({ width:{size:9360,type:WidthType.DXA}, columnWidths:[4680,4680], rows:[
    new TableRow({children:[cell('INTP-like Architect',4680,'DCEAF4',true),cell('ESTJ-like Operator',4680,'F2E2D7',true)]}),
    new TableRow({children:[cell('Asks: What could work?',4680,'F7FAFC'),cell('Asks: Will it reliably work?',4680,'FCF8F5')]}),
    new TableRow({children:[cell('Diverges, models, experiments, and revises.',4680,'F7FAFC'),cell('Organizes, verifies, standardizes, and stabilizes.',4680,'FCF8F5')]}),
    new TableRow({children:[cell('Risk: exploration without commitment.',4680,'F7FAFC'),cell('Risk: structure before understanding.',4680,'FCF8F5')]})
  ]}),
  p('The productive tension is essential: the Architect questions whether the current assumptions are correct; the Operator requires the new solution to demonstrate evidence, ownership, and repeatability.',{after:220}),
  image('complement', 650, 121, 'INTP Architect and ESTJ Operator feedback loop'),

  h1('5. Parallel Theory'),
  p('The Operator does not need to wait until exploration ends. Both roles can work concurrently, but the authority of the feedback changes by phase. During exploration, Operator feedback is advisory. The Architect can incorporate it when useful without losing momentum or being forced into convergence.'),
  image('parallel', 650, 200, 'Parallel architect exploration and operator awareness'),
  p('This creates parallel development: the Architect keeps building while the Operator develops production awareness alongside the work. The Architect sees likely future blockers early, yet the creative seed remains protected.'),

  h1('6. Enforcement at the Right Moment'),
  p('PTheory does not remove hooks or weaken governance. It separates visibility from authority. Hooks and policies are visible from the beginning, but they become enforceable only when the work reaches a meaningful commitment boundary.'),
  image('timing', 650, 153, 'Enforcement timing in PTheory'),
  h2('Before the commitment boundary'),
  bullet('Hooks provide context, warnings, readiness previews, and non-blocking specialist advice.'),
  bullet('Change remains inexpensive and divergence remains protected.'),
  bullet('The Architect leads discovery while understanding future production expectations.'),
  h2('At the commitment boundary'),
  bullet('Tests, security validation, stable interfaces, and documentation become required.'),
  bullet('Critical findings may block progression until they are remediated.'),
  bullet('The Operator owns readiness, repeatability, sign-off, deployment, and rollback evidence.'),
  quote('Inform early. Enforce when commitment begins.'),

  h1('7. The Complete PTheory Journey'),
  image('journey', 650, 241, 'Complete PTheory feedback journey'),
  p('A critical finding does not invalidate the creative process. It reopens a focused Architect loop. The Architect responds to concrete evidence, revises the implementation, and returns it to the Operator. When no critical gap remains, the Operator stabilizes and operationalizes the result.'),

  h1('8. Final Principle'),
  p('PTheory is not a choice between creativity and governance. It is a timing model for both. The Architect is contextually aware of the Operator’s controls but is not prematurely governed by them. The Operator works in parallel, develops production awareness, and provides advisory feedback without interrupting the creative seed.'),
  quote('The Architect discovers what should exist. The Operator determines whether it can exist safely, reliably, and repeatedly.'),
  p('In short: parallel awareness, protected exploration, and timely enforcement.',{bold:true,size:24})
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22, color: '222222' } } },
    paragraphStyles: [
      { id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,run:{font:'Arial',size:32,bold:true,color:'234E70'},paragraph:{spacing:{before:300,after:160},outlineLevel:0,border:{bottom:{style:BorderStyle.SINGLE,size:6,color:'93B7CF',space:4}}} },
      { id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,run:{font:'Arial',size:26,bold:true,color:'5B3A26'},paragraph:{spacing:{before:220,after:120},outlineLevel:1} }
    ]
  },
  numbering: { config: [{ reference:'bullets',levels:[{level:0,format:LevelFormat.BULLET,text:'•',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:540,hanging:280}}}}] }] },
  sections: [{
    properties: { page: { size: { width:12240,height:15840 }, margin:{top:1080,right:1440,bottom:1080,left:1440,header:500,footer:500} } },
    headers: { default: new Header({ children:[new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:'93B7CF',space:4}},children:[new TextRun({text:'PTHEORY  |  PARALLEL ARCHITECTURE AND OPERATIONS',size:17,bold:true,color:'555555'})]})] }) },
    footers: { default: new Footer({ children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:'Page ',size:18,color:'777777'}),new TextRun({children:[PageNumber.CURRENT],size:18,color:'777777'})]})] }) },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(path.join(outDir, 'PTheory-Parallel-Architecture-and-Operations.docx'), buffer);
  console.log(path.join(outDir, 'PTheory-Parallel-Architecture-and-Operations.docx'));
});
