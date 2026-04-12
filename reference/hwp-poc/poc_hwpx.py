# -*- coding: utf-8 -*-
"""
HWPX 소독증명서 PoC - 빈 칸에 데이터 삽입 (기존 텍스트 유지)
"""
import zipfile, sys
from xml.etree import ElementTree as ET
sys.stdout.reconfigure(encoding='utf-8')

TEMPLATE = 'template/소독증명서_템플릿.hwpx'
OUTPUT = 'template/소독증명서_poc_output.hwpx'

HP_NS = '{http://www.hancom.co.kr/hwpml/2011/paragraph}'

# ===== 목업 데이터 (예시와 다른 버전) =====
mock = {
    'cert_no': '7',
    'business_name': '해피치킨 강남점',
    'area_m2': '120',
    'area_m3': '360',
    'address': '서울시 강남구 테헤란로 152',
    'position': '점장',
    'manager_name': '박영희',
    'period_start': '2026.03.15',
    'period_end': '2026.03.15',
    'disinfection_type': '일반소독 (분무소독)',
    'chemicals': '델타메트린 유제 0.3% 희석액 3L',
    'year': '2026',
    'month': '03',
    'day': '15',
    'operator_name': '그린환경방역',
    'operator_address': '경기도 성남시 분당구 판교로 228',
    'operator_ceo': '이동건',
}

# ===== Namespace 등록 =====
ns_map = {
    'hs': 'http://www.hancom.co.kr/hwpml/2011/section',
    'hp': 'http://www.hancom.co.kr/hwpml/2011/paragraph',
    'hp10': 'http://www.hancom.co.kr/hwpml/2016/paragraph',
    'hc': 'http://www.hancom.co.kr/hwpml/2011/core',
    'hh': 'http://www.hancom.co.kr/hwpml/2011/head',
    'ha': 'http://www.hancom.co.kr/hwpml/2011/app',
    'hhs': 'http://www.hancom.co.kr/hwpml/2011/history',
    'hm': 'http://www.hancom.co.kr/hwpml/2011/master-page',
    'hpf': 'http://www.hancom.co.kr/schema/2011/hpf',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'opf': 'http://www.idpf.org/2007/opf/',
    'ooxmlchart': 'http://www.hancom.co.kr/hwpml/2016/ooxmlchart',
    'epub': 'http://www.idpf.org/2007/ops',
    'config': 'urn:oasis:names:tc:opendocument:xmlns:config:1.0',
}
for prefix, uri in ns_map.items():
    ET.register_namespace(prefix, uri)


def make_run(text, charPrIDRef='6'):
    run = ET.Element(f'{HP_NS}run')
    run.set('charPrIDRef', charPrIDRef)
    t = ET.SubElement(run, f'{HP_NS}t')
    t.text = text
    return run


def get_cell_paragraphs(tc):
    sublist = tc.find(f'{HP_NS}subList')
    if sublist is None:
        return []
    return list(sublist.findall(f'{HP_NS}p'))


def append_run_to_para(p, text, charPrIDRef='6'):
    new_run = make_run(text, charPrIDRef)
    lineseg = p.find(f'{HP_NS}linesegarray')
    if lineseg is not None:
        idx = list(p).index(lineseg)
        p.insert(idx, new_run)
    else:
        p.append(new_run)


def set_run_text(run, text):
    t = run.find(f'{HP_NS}t')
    if t is None:
        t = ET.SubElement(run, f'{HP_NS}t')
    t.text = text


# ===== 메인 로직 =====
with zipfile.ZipFile(TEMPLATE, 'r') as zin:
    all_files = {name: zin.read(name) for name in zin.namelist()}

xml_bytes = all_files['Contents/section0.xml']
root = ET.fromstring(xml_bytes.decode('utf-8'))

cells = list(root.iter(f'{HP_NS}tc'))
changes = []

# --- cell[1]: 증명서 번호 - p[1]이 ' 제       호' 텍스트, 빈칸에 번호 삽입 ---
paras = get_cell_paragraphs(cells[1])
runs = list(paras[1].findall(f'{HP_NS}run'))
set_run_text(runs[0], f' 제    {mock["cert_no"]}   호')
changes.append(f'증명서 번호: {mock["cert_no"]}')

# --- cell[3]: 상호(명칭) - p[1]의 빈 run 뒤에 새 run 추가 ---
paras = get_cell_paragraphs(cells[3])
append_run_to_para(paras[1], mock['business_name'], charPrIDRef='6')
changes.append(f'상호: {mock["business_name"]}')

# --- cell[4]: 면적 - p[1].run[0] 빈칸에 숫자, run[2] 괄호에 숫자 ---
paras = get_cell_paragraphs(cells[4])
runs = list(paras[1].findall(f'{HP_NS}run'))
set_run_text(runs[0], f'            {mock["area_m2"]}  ')
set_run_text(runs[2], f'(    {mock["area_m3"]}  ㎥)')
changes.append(f'면적: {mock["area_m2"]}㎡ / {mock["area_m3"]}㎥')

# --- cell[5]: 소재지 - p[1] 빈 run 뒤에 새 run 추가 ---
paras = get_cell_paragraphs(cells[5])
runs = list(paras[1].findall(f'{HP_NS}run'))
set_run_text(runs[0], '                         ')
append_run_to_para(paras[1], mock['address'], charPrIDRef='25')
changes.append(f'소재지: {mock["address"]}')

# --- cell[7]: 직위 - p[1] 빈 run 뒤에 새 run 추가 ---
paras = get_cell_paragraphs(cells[7])
append_run_to_para(paras[1], mock['position'], charPrIDRef='25')
changes.append(f'직위: {mock["position"]}')

# --- cell[8]: 성명 - p[1] 빈 run 뒤에 새 run 추가 ---
paras = get_cell_paragraphs(cells[8])
append_run_to_para(paras[1], mock['manager_name'], charPrIDRef='6')
changes.append(f'성명: {mock["manager_name"]}')

# --- cell[12]: 소독기간 - p[0].run[0] 텍스트 변경 ---
paras = get_cell_paragraphs(cells[12])
runs = list(paras[0].findall(f'{HP_NS}run'))
set_run_text(runs[0], f'{mock["period_start"]} ~ {mock["period_end"]}')
changes.append(f'소독기간: {mock["period_start"]} ~ {mock["period_end"]}')

# --- cell[15]: 종류 - p[1].run[0] 빈칸 뒤에 값 이어붙이기 ---
paras = get_cell_paragraphs(cells[15])
runs = list(paras[1].findall(f'{HP_NS}run'))
set_run_text(runs[0], f'                      {mock["disinfection_type"]}')
changes.append(f'종류: {mock["disinfection_type"]}')

# --- cell[16]: 약품 - p[1].run[0] 빈칸 뒤에 값 이어붙이기 ---
paras = get_cell_paragraphs(cells[16])
runs = list(paras[1].findall(f'{HP_NS}run'))
set_run_text(runs[0], f'                      {mock["chemicals"]}')
changes.append(f'약품: {mock["chemicals"]}')

# --- cell[17]: 날짜 ---
paras17 = get_cell_paragraphs(cells[17])
runs3 = list(paras17[3].findall(f'{HP_NS}run'))
set_run_text(runs3[0], f'{mock["year"]} 년      {mock["month"]} 월     {mock["day"]} 일')
changes.append(f'날짜: {mock["year"]}.{mock["month"]}.{mock["day"]}')

# --- cell[19]: 소독실시자 우측 (p[0]=명칭, p[1]=소재지, p[2].run[0]=성명) ---
paras19 = get_cell_paragraphs(cells[19])
set_run_text(list(paras19[0].findall(f'{HP_NS}run'))[0], mock['operator_name'])
set_run_text(list(paras19[1].findall(f'{HP_NS}run'))[0], mock['operator_address'])
set_run_text(list(paras19[2].findall(f'{HP_NS}run'))[0], f'    {mock["operator_ceo"]}  ')
changes.append(f'소독실시자: {mock["operator_name"]} / {mock["operator_address"]} / {mock["operator_ceo"]}')

# ===== XML 저장 =====
xml_declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>'
xml_str = ET.tostring(root, encoding='unicode', xml_declaration=False)
new_xml_bytes = (xml_declaration + xml_str).encode('utf-8')
all_files['Contents/section0.xml'] = new_xml_bytes

with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED) as zout:
    for name, content in all_files.items():
        zout.writestr(name, content)

# ===== 결과 출력 =====
print('=== 변경 사항 ===')
for c in changes:
    print(f'  + {c}')

print(f'\n=== 검증: {OUTPUT} ===')
with zipfile.ZipFile(OUTPUT, 'r') as zcheck:
    check_xml = zcheck.read('Contents/section0.xml').decode('utf-8')
    check_root = ET.fromstring(check_xml)
    for tc_idx, tc in enumerate(check_root.iter(f'{HP_NS}tc')):
        cell_addr = tc.find(f'{HP_NS}cellAddr')
        col = cell_addr.get('colAddr', '?')
        row = cell_addr.get('rowAddr', '?')
        texts = []
        for t in tc.iter(f'{HP_NS}t'):
            if t.text and t.text.strip():
                texts.append(t.text.strip())
        combined = ' | '.join(texts)
        if combined:
            print(f'  cell[{tc_idx:2d}] r{row}c{col}: {combined[:100]}')

print(f'\nDone. Open in Hangul to verify.')
