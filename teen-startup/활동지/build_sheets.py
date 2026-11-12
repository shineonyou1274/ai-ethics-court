import copy, os, sys, zipfile, shutil
from lxml import etree
S = '/tmp/teen-startup-sheets'
REF = '/home/user/ai-ethics-court/life-drama/인생드라마_활동지_사후.hwpx'
OUT = '/home/user/ai-ethics-court/teen-startup/활동지'
L = lambda e: etree.QName(e.tag).localname
W = 51024

def build(fname, tag, title, right, blocks):
    work = os.path.join(S, 'work'); shutil.rmtree(work, ignore_errors=True)
    with zipfile.ZipFile(REF) as z: z.extractall(work)
    sp = os.path.join(work, 'Contents', 'section0.xml')
    tree = etree.parse(sp); sec = tree.getroot(); ch = list(sec)
    P = {k: copy.deepcopy(ch[i]) for k, i in dict(title=1, intro=2, note=3, head=4, tbl=7, date=23).items()}
    tc0 = next(x for x in P['tbl'].iter() if L(x) == 'tc')
    cellp0 = next(x for x in tc0.iter() if L(x) == 'p')
    for c in ch[1:]: sec.remove(c)
    nid = [3000]
    def newid(e):
        nid[0] += 1; e.set('id', str(nid[0])); return e
    def settext(p, texts):
        runs = [r for r in p if L(r) == 'run']
        for r, t in zip(runs, texts):
            for x in r:
                if L(x) == 't': x.text = t
    def para(kind, texts, pb=False):
        p = newid(copy.deepcopy(P[kind])); settext(p, texts); p.set('pageBreak', '1' if pb else '0'); sec.append(p)
    def cellp(pp, cp, text):
        p = newid(copy.deepcopy(cellp0)); p.set('paraPrIDRef', str(pp))
        r = [x for x in p if L(x) == 'run'][0]; r.set('charPrIDRef', str(cp))
        t = [x for x in r if L(x) == 't']
        if t: t[0].text = text
        return p
    STY = {'h': (21, 13), 'l': (20, 10), 's': (20, 11), 'b': (20, 9), 'c': (21, 16), 'cb': (21, 9)}
    def table(widths, rows, into=None):
        """rows: (height, [cell,...]); cell = (bf, [(style, text), ...])"""
        p = newid(copy.deepcopy(P['tbl'])); tbl = next(x for x in p.iter() if L(x) == 'tbl'); newid(tbl)
        for tr in [x for x in tbl if L(x) == 'tr']: tbl.remove(tr)
        tbl.set('rowCnt', str(len(rows))); tbl.set('colCnt', str(len(widths)))
        sz = next(x for x in tbl if L(x) == 'sz'); sz.set('width', str(sum(widths))); sz.set('height', str(sum(r[0] for r in rows)))
        for ri, (h, cells) in enumerate(rows):
            tr = etree.SubElement(tbl, tc0.getparent().tag)
            assert len(cells) == len(widths), (fname, ri, cells)
            for ci, (bf, paras) in enumerate(cells):
                tc = copy.deepcopy(tc0); tc.set('borderFillIDRef', str(bf))
                sl = next(x for x in tc if L(x) == 'subList')
                for x in list(sl): sl.remove(x)
                for sty, text in paras: sl.append(cellp(*STY[sty], text))
                for x in tc:
                    if L(x) == 'cellAddr': x.set('colAddr', str(ci)); x.set('rowAddr', str(ri))
                    if L(x) == 'cellSz': x.set('width', str(widths[ci])); x.set('height', str(h))
                tr.append(tc)
        sec.append(p)
    # 머리
    settext(ch[0], [None, tag]) if False else None
    for r in [x for x in ch[0] if L(x) == 'run'][1:]:
        for x in r:
            if L(x) == 't': x.text = tag
    p = newid(copy.deepcopy(P['title'])); ts = [x for x in p.iter() if L(x) == 't']; ts[0].text = title; ts[1].text = right; sec.append(p)
    total = 0
    for b in blocks:
        k = b[0]
        if k == 'intro': para('intro', [b[1]])
        elif k == 'note': para('note', [b[1]])
        elif k == 'head': para('head', [b[1] + '  ', ' ' + b[2]], pb=len(b) > 3)
        elif k == 'date': para('date', ['날짜             년        월        일                '])
        elif k == 'label':  # (label, color, height, [(제목, 설명), ...])
            table([15307, 35717], [(b[2], [(b[1], [('l', t), ('s', s)]), (3, [('b', '')])]) for t, s in b[3]])
        elif k == 'filled':  # 낱말 풀이처럼 오른쪽이 채워진 표
            table([12000, 39024], [(b[2], [(b[1], [('l', t)]), (3, [('b', s)])]) for t, s in b[3]])
        elif k == 'grid':  # (grid, widths, header, rowheight, color, rows) 각 행은 문자열 목록, 첫 칸은 색 칸
            rows = [(2551, [(9, [('h', t)]) for t in b[2]])]
            for r in b[5]:
                cells = []
                for ci, t in enumerate(r):
                    if ci == 0 and t is not None: cells.append((b[4], [('l', t)] if not isinstance(t, tuple) else [('l', t[0]), ('s', t[1])]))
                    else: cells.append((3, [('b', t or '')]))
                rows.append((b[3], cells))
            table(b[1], rows)
        elif k == 'scale':
            rows = [(2551, [(9, [('h', '문항')]), (9, [('h', '전혀 아니다 ← → 매우 그렇다')])])]
            rows += [(2267, [(b[1], [('b', q)]), (3, [('c', '1      2      3      4      5')])]) for q in b[2]]
            table([31634, 19390], rows)
    enc = tree.docinfo.encoding or 'UTF-8'
    tree.write(sp, xml_declaration=True, encoding=enc, standalone=tree.docinfo.standalone)
    lines = []
    for p in sec.iter():
        if L(p) == 'p':
            t = ''.join(x.text or '' for r in p if L(r) == 'run' for x in r if L(x) == 't')
            if t: lines.append(t)
    with open(os.path.join(work, 'Preview', 'PrvText.txt'), 'w', encoding='utf-16-le') as f: f.write('\r\n'.join(lines)[:2048])
    os.makedirs(OUT, exist_ok=True); out = os.path.join(OUT, fname)
    with zipfile.ZipFile(REF) as z: order = [i.filename for i in z.infolist()]
    with zipfile.ZipFile(out, 'w') as zf:
        zf.write(os.path.join(work, 'mimetype'), 'mimetype', compress_type=zipfile.ZIP_STORED)
        for arc in order:
            if arc != 'mimetype' and not arc.endswith('/'): zf.write(os.path.join(work, arc), arc, compress_type=zipfile.ZIP_DEFLATED)
    print('만듦:', out)

Q = ['1. 나는 어려운 일도 결국 해낼 수 있다고 믿는다 (자기유능감)', '2. 시키지 않아도 할 일을 스스로 정하고 시작한다 (자기주도성)',
     '3. 지금보다 나아지려고 새로운 것을 배운다 (성장의지)', '4. 실패할 수 있어도 해 보고 싶은 일에 나선다 (도전정신)',
     '5. 남들과 다른 방법을 떠올려 보는 편이다 (혁신적사고)', '6. 다른 사람과 힘을 모아 일하는 것이 편하다 (협업능력)',
     '7. 문제가 생기면 까닭을 찾아 해결 방법을 세운다 (문제해결)']
CARDS = ['튀김기, 중고냐 새것이냐', '치킨 한 마리, 얼마 받을까', '배달 앱에 들어갈까', '"사장님, 주휴수당은요?"', '닭고기 값이 30% 뛰었다', '별점 1점 리뷰',
         '길 건너에 대형 치킨집이 생겼다', '동네 축제로 300만 원이 생겼다', '포장 쓰레기 민원', '유통 기한이 하루 지난 소스', '단체 주문 30마리가 빠졌다', '내년에는 어떤 가게가 될까']
NAME = '학번 ____________   이름 ____________'

build('치킨집사장님_활동지_사전.hwpx', 'TEEN STARTUP · 사전 활동지', '치킨집 사장님, 되기 전에', NAME, [
    ('intro', '오늘 여러분은 치킨집 사장님이 되어 열두 달 동안 가게를 꾸립니다. 문을 열기 전에 지금의 생각을 적어 둡니다.'),
    ('note', '정답은 없습니다. 지금 떠오르는 대로 적으면 됩니다. 1번의 오른쪽 칸과 5번은 게임을 하면서 채웁니다.'),
    ('head', '1', '내 예상   한 달에 치킨을 1,000만 원어치 팔면 얼마가 남을까요'),
    ('grid', [15307, 17858, 17859], ['나가는 돈', '내 예상 (만 원)', '1개월 차 가계부 (게임에서 확인)'], 2409, 4,
     [['재료비 (닭·기름·포장)', '', ''], ['인건비 (알바 2명)', '', ''], ['임대료', '', ''], ['배달 수수료와 그 밖의 돈', '', ''], ['사장님에게 남는 돈', '', '']]),
    ('head', '2', '나의 경영 원칙   어떤 사장님이 되고 싶은가요'),
    ('label', 6, 3401, [('가장 중요하게 여길 것', '돈·손님·직원·동네 가운데 하나와 그 까닭'), ('절대 하지 않을 일', '돈을 더 벌 수 있어도 하지 않을 것'), ('나의 원칙 한 줄', '"나는 ○○한 사장님이 되겠다"')]),
    ('head', '3', '미리 보는 낱말   게임 속 가계부에 나오는 말입니다'),
    ('filled', 7, 1984, [('매출', '물건을 팔아서 들어온 돈 전체'), ('이익', '매출에서 쓴 돈을 모두 빼고 남은 돈'), ('원가', '물건 하나를 만드는 데 드는 돈'),
                         ('고정비', '장사가 잘되든 안되든 매달 나가는 돈 (임대료, 인건비 등)'), ('수수료', '다른 회사의 서비스를 쓴 값으로 떼어 주는 돈'), ('기회비용', '하나를 고르느라 포기한 것 가운데 가장 아까운 것')]),
    ('head', '4', '지금의 나   창업가에게 필요한 일곱 가지 힘, 해당하는 숫자에 ○', True),
    ('scale', 8, Q),
    ('head', '5', '사장님 일지   게임을 하면서 달마다 적습니다'),
    ('grid', [4535, 17008, 6236, 23245], ['달', '이달의 고민', '고른 번호', '그렇게 고른 까닭 한마디'], 3118, 5, [[str(i + 1), c, '', ''] for i, c in enumerate(CARDS)]),
    ('label', 5, 2835, [('가게 키우기 기록', '새 단장·2층·채용을 몇 개월 차에')]),
])

build('치킨집사장님_활동지_사후.hwpx', 'TEEN STARTUP · 사후 활동지', '치킨집 사장님, 1년을 마치고', NAME, [
    ('intro', '열두 달 동안 가게를 꾸려 보았습니다. 사전 활동지와 사장님 일지를 옆에 두고, 내가 내린 결정을 천천히 되짚어 적습니다.'),
    ('note', '가게가 잘됐는지보다 왜 그렇게 골랐는지가 중요합니다. 문을 닫은 사장님도 똑같이 적을 수 있습니다.'),
    ('head', '1', '나의 1년 결산   마지막 화면을 보고 옮겨 적습니다'),
    ('label', 4, 3118, [('사장님 유형', '화면에 나온 이름과, 그 이름이 마음에 드는지'), ('가장 잘된 달, 힘들었던 달', '몇 개월 차였고, 까닭은')]),
    ('head', '2', '나의 창업가 역량 도형   5점이 가장 높습니다'),
    ('grid', [10204] + [5831] * 6 + [5834], ['', '자기유능감', '자기주도성', '성장의지', '도전정신', '혁신적사고', '협업능력', '문제해결'], 2409, 5,
     [['게임이 그려 준 점수'] + [''] * 7, ['내가 매긴 점수 (사전 4번)'] + [''] * 7]),
    ('label', 5, 22677, [('역량 도형 옮겨 그리기', '화면의 도형을 옮겨 그리고, 내가 매긴 점수를 다른 색으로 겹쳐 그립니다')]),
    ('label', 5, 3401, [('가장 빛난 힘', '그 힘이 드러난 선택은 무엇이었나요'), ('다음에 길러 볼 힘', '학교생활에서 기를 방법 한 가지')]),
    ('head', '3', '원칙과 선택   사전 활동지 2번과 견주어 봅니다', True),
    ('grid', [10204, 12245, 12245, 16330], ['', '시작 전에 적은 것', '실제로 한 선택', '달라졌다면 그 까닭'], 3968, 6, [[('가장 중요하게 여긴 것', '돈·손님·직원·동네'), '', '', ''], [('하지 않겠다고 한 일', '끝까지 지켰나요'), '', '', '']]),
    ('label', 6, 3401, [('가장 오래 고민한 선택', '무엇과 무엇 사이에서 망설였나요')]),
    ('head', '4', '갈림길 토론   모둠에서 선택이 가장 갈린 카드 두 장을 고릅니다'),
    ('grid', [12245, 14286, 24493], ['카드', '우리 모둠의 선택 (1·2·3번 몇 명씩)', '가장 설득력 있던 의견'], 3685, 7, [['', '', ''], ['', '', '']]),
    ('label', 7, 3401, [('이익과 옳음이 달랐던 때', '돈이 남는 선택과 옳다고 본 선택이 달랐던 순간')]),
    ('head', '5', '달라진 나   사전과 같은 문항입니다. 숫자가 달라진 문항에 ✓'),
    ('scale', 8, Q),
    ('head', '6', '교실 밖으로   오늘 배운 눈으로 세상을 봅니다'),
    ('label', 4, 3118, [('우리 동네 가게 한 곳', '그 사장님이 요즘 할 법한 고민 한 가지'), ('내가 차리고 싶은 가게', '무엇을, 누구에게 팔고 싶은가요'), ('이번 주에 해 볼 일 하나', '길러 볼 힘을 위해 언제, 무엇을')]),
    ('date',),
])

build('치킨집사장님_교사용_안내.hwpx', 'TEEN STARTUP · 교사용 안내', '치킨집 사장님 수업 안내', '중·고 공통  |  2차시 권장', [
    ('intro', '학생이 치킨집 사장이 되어 열두 달 동안 달마다 한 가지씩 결정을 내리는 창업 체험 게임입니다. 게임만 하면 재미로 끝나므로, 선택의 까닭을 말로 꺼내는 사전·사후 활동을 함께 진행합니다.'),
    ('note', '준비물: 학생 기기(폰·크롬북·PC)와 teen-startup.html 파일, 사전·사후 활동지. 소리가 나므로 이어폰을 쓰거나 화면의 ♪ 단추로 끕니다.'),
    ('head', '1', '수업 흐름   2차시(90~100분) 기준'),
    ('grid', [8504, 6236, 36284], ['단계', '시간', '활동'], 2409, 4, [
        ['사전', '15분', '사전 활동지 1~4번. 1번 예상을 몇 명에게 물어 칠판에 적어 두면 게임 뒤에 견주기 좋습니다.'],
        ['게임', '20~25분', '혼자 한 판. 달마다 사장님 일지(5번)에 고른 번호와 까닭을 적습니다. 일찍 끝난 학생은 다른 원칙으로 한 판 더 합니다.'],
        ['개인 정리', '15분', '사후 활동지 1~3번. 마지막 화면의 역량 도형을 옮겨 그립니다.'],
        ['모둠 토론', '20분', '사후 4번. 선택이 갈린 카드 두 장을 골라 까닭을 나눕니다.'],
        ['마무리', '15분', '사후 5~6번. 역량 문항을 다시 매기고, 교실 밖 과제를 정합니다.'],
        ['1차시로 줄일 때', '45분', '사전 2·4번(5분) → 게임(20분) → 사후 2·3·5번(15분) → 한 줄 나눔(5분)'],
    ]),
    ('head', '2', '역량과 게임의 연결   마지막 화면의 도형이 그려지는 방식'),
    ('grid', [9071, 20976, 20977], ['역량', '게임에서 점수가 오르는 행동', '토론 질문'], 2835, 5, [
        ['자기유능감', '흑자를 낸 달이 많고 손님 신뢰가 높을 때, 빚 없이 1년을 마칠 때', '"해낼 수 있겠다"는 느낌이 든 순간은 언제였나요?'],
        ['자기주도성', '가게 키우기(새 단장·확장·채용)를 스스로 고를 때, 결과를 운에 맡기지 않을 때', '시키지 않았는데 스스로 내린 결정은 무엇이었나요?'],
        ['성장의지', '번 돈을 가게에 다시 들일 때, 내일을 위해 모으거나 약속할 때', '당장 쓰고 싶은 돈을 미래를 위해 남긴 적이 있나요?'],
        ['도전정신', '새 튀김기, 광고, 새 메뉴, 확장처럼 실패할 수 있는 투자를 고를 때', '도전과 무모함은 무엇이 다를까요?'],
        ['혁신적사고', '새 메뉴, 그릇 캠페인, 재고 관리표처럼 남과 다른 방법을 고를 때', '선택지에 없던 네 번째 방법을 만든다면?'],
        ['협업능력', '주휴수당, 보너스, 실수한 알바생을 감싸는 선택을 하고 팀 행복이 높을 때', '좋은 사장과 좋은 동료는 무엇이 닮았을까요?'],
        ['문제해결', '사과와 재배달, 주문 확인법처럼 문제의 까닭을 고치는 선택을 할 때', '눈앞의 불만 끈 선택과 까닭을 고친 선택은 어떻게 달랐나요?'],
    ]),
    ('note', '도형의 점수는 평가 점수가 아니라 이번 판에서 한 선택의 흔적입니다. 같은 학생도 다시 하면 모양이 달라집니다. 점수로 줄을 세우지 않도록 안내합니다.'),
    ('head', '3', '카드 열두 장 한눈에   달마다 한 장씩 차례로 나옵니다', True),
    ('grid', [3685, 14173, 13039, 20127], ['달', '카드', '경제 개념', '토론 질문'], 2551, 6, [
        ['1', CARDS[0], '초기 투자비와 고정비', '한 번에 크게 내는 돈과 매달 조금씩 내는 돈, 어느 쪽이 더 부담일까요?'],
        ['2', CARDS[1], '가격과 수요', '값을 내리면 언제나 더 많이 벌까요?'],
        ['3', CARDS[2], '수수료, 매출과 이익', '매출이 늘었는데 이익이 줄 수 있는 까닭은?'],
        ['4', CARDS[3], '주휴수당, 노동법', '"다들 안 준다"는 말은 까닭이 될 수 있을까요?'],
        ['5', CARDS[4], '원가와 가격', '오른 재료비는 누가 부담해야 할까요?'],
        ['6', CARDS[5], '평판', '억울한 리뷰에는 어떻게 답하는 것이 좋을까요?'],
        ['7', CARDS[6], '경쟁과 차별화', '작은 가게가 큰 가게를 이길 수 있는 방법은?'],
        ['8', CARDS[7], '기회비용', '내가 포기한 선택지의 값어치는 얼마였을까요?'],
        ['9', CARDS[8], '외부 효과', '가게가 만든 쓰레기의 비용은 누가 내고 있나요?'],
        ['10', CARDS[9], '위험과 신뢰', '들키지 않으면 괜찮은 일일까요?'],
        ['11', CARDS[10], '책임', '직원의 실수는 누구의 책임일까요?'],
        ['12', CARDS[11], '지속 가능성', '오래가는 가게는 무엇이 다를까요?'],
    ]),
    ('head', '4', '미리 알아 둘 점'),
    ('filled', 7, 3401, [
        ('운이 섞인 선택 네 가지', '4개월 차 "다들 안 줘", 6개월 차 리뷰 행사, 10개월 차 "그냥 쓴다", 11개월 차 월급 공제는 40~60% 확률로 나쁜 결과가 나옵니다. 같은 선택에 결과가 다른 까닭을 토론 거리로 삼습니다.'),
        ('법과 관련된 카드', '4개월 차(주휴수당)와 11개월 차(임금에서 손해액 공제)는 근로기준법 내용입니다. 수업 전에 최신 기준을 한 번 확인합니다.'),
        ('가게 문을 닫은 학생', '통장이 두 번 바닥나면 폐업으로 끝납니다. 실패한 까닭을 찾는 것도 같은 배움임을 알려 주고, 사후 활동지는 똑같이 씁니다.'),
    ]),
])
