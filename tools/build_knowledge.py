# -*- coding: utf-8 -*-
"""
build_knowledge.py — สร้าง web/knowledge.json สำหรับ pi-brain.js

อ่านข้อมูลที่ audit ไว้แล้วจากโปรเจกต์ enterprise (read-only):
  - solar-engine/src/data/clause-map.ts  → RULE_CLAUSE_MAP + CODE_EDITIONS
  - digitize-kit/PROVISIONS.csv          → ข้อกำหนดเดี่ยวพร้อมค่าตัวเลข

กติกาลิขสิทธิ์ (ตาม header ของ clause-map.ts):
  * เก็บเฉพาะ เลขข้อ / เลขตาราง / ชื่อหัวข้อ (ข้อมูลบรรณานุกรม) และคำสรุปที่เรียบเรียงเอง
  * ห้ามฝังตาราง lookup ของ วสท. (AMPACITY, T4-x, T5-x ฯลฯ) ลงไฟล์สาธารณะ
  * ข้อความอธิบายทุกรายการต้องสั้น (บังคับความยาวใน validate())

วิธีใช้:  python tools/build_knowledge.py
"""
import csv
import io
import json
import os
import re
import sys
from datetime import date

ENT = r"C:/enterprise/solar-project-complete"
CLAUSE_MAP = ENT + "/solar-engine/src/data/clause-map.ts"
PROVISIONS = ENT + "/digitize-kit/PROVISIONS.csv"
OUT = os.path.join(os.path.dirname(__file__), "..", "knowledge.json")

MAX_ANSWER_CHARS = 320   # การ์ดความยาว — คำสรุปต้องย่อจริง


# ---------------------------------------------------------------- clause map
def parse_code_editions(src):
    codes = {}
    for m in re.finditer(r"'(EIT-\d{4})':\s*\{(.*?)\n  \}", src, re.S):
        cid, body = m.group(1), m.group(2)
        def field(name):
            f = re.search(name + r":\s*'([^']*)'", body)
            return f.group(1) if f else None
        codes[cid] = {
            "eitCode": field("eitCode"),
            "titleTh": field("titleTh"),
            "year": int(re.search(r"buddhistYear:\s*(\d+)", body).group(1)),
        }
    return codes


def parse_rule_map(src):
    block = src[src.index("export const RULE_CLAUSE_MAP"):]
    end = re.search(r"\n\};", block).start()
    block = block[:end]
    entries = []
    for m in re.finditer(r"'([A-Z0-9_.]+)':\s*\{(.*?)\n  \},?", block, re.S):
        rid, body = m.group(1), m.group(2)
        body = re.sub(r"//[^\n]*", "", body)  # strip comments
        def field(name):
            f = re.search(name + r":\s*'((?:[^'\\]|\\.)*)'", body)
            return f.group(1).replace("\\'", "'") if f else None
        code, clause, title = field("code"), field("clause"), field("title")
        if not (code and title):
            continue
        entries.append({
            "id": rid, "type": "clause", "code": code,
            "clause": clause, "table": field("table"), "title": title,
        })
    return entries


# ---------------------------------------------------------------- provisions
def parse_provisions(codes):
    out = []
    by_eit = {v["eitCode"]: k for k, v in codes.items()}
    with io.open(PROVISIONS, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            if not row.get("key"):
                continue
            out.append({
                "id": "PROV." + row["key"],
                "type": "provision",
                "code": by_eit.get(row["document_code"]),
                "eitCode": row["document_code"],
                "clause": row["clause"],
                "table": None,
                "title": row["source_note"][:80],
                "value": row["value"], "unit": row["unit"],
                "a_th": row["source_note"],
            })
    return out


# ---------------------------------------------------------------- curated FAQ
# คำตอบเรียบเรียงเอง สั้น ๆ — ตัวเลขระบุเฉพาะที่มีใน PROVISIONS เท่านั้น
# `ref` ชี้ไปที่ id ใน RULE_CLAUSE_MAP เพื่อดึงเลขข้อ/ตารางที่ audit แล้วมาอ้างอิง
FAQ = [
    dict(kw="แรงดัน สตริง string voc สูงสุด array voltage maximum",
         ref="EIT2568.DC.STRING_VOLTAGE",
         th="แรงดันสูงสุดของสตริงคิดจาก Voc ของแผงที่อุณหภูมิต่ำสุดของพื้นที่ติดตั้ง และต้องไม่เกินพิกัดที่มาตรฐานกำหนดสำหรับ PV array บนอาคาร",
         en="Maximum string voltage is computed from module Voc at the site's lowest temperature and must not exceed the standard's limit for PV arrays on buildings."),
    dict(kw="ฟิวส์ fuse สตริง เลือก ป้องกันกระแสเกิน ocpd",
         ref="EIT2568.DC.FUSE_SELECTION",
         th="การเลือกฟิวส์สตริง (พิกัด ชนิด gPV) กำหนดไว้ในหัวข้อฟิวส์ของมาตรฐานระบบ PV — ดูควบคู่กับข้อการป้องกันกระแสเกิน (ข้อ 3.5)",
         en="String fuse selection (rating, gPV type) is specified in the PV standard's fuse clause — read together with the overcurrent-protection clause (3.5)."),
    dict(kw="เบรกเกอร์ breaker cb dc เซอร์กิต",
         ref="EIT2568.DC.CB_SELECTION",
         th="เซอร์กิตเบรกเกอร์ฝั่ง DC ต้องเป็นรุ่นสำหรับไฟตรงและเลือกตามหัวข้อเซอร์กิตเบรกเกอร์ที่ใช้ป้องกันกระแสเกินของมาตรฐาน",
         en="DC-side circuit breakers must be DC-rated and selected per the standard's clause on overcurrent circuit breakers."),
    dict(kw="สาย dc pv cable สายไฟ เคเบิล ใช้สายอะไร h1z2z2",
         ref="EIT2568.DC.CABLE_RATING",
         th="สายวงจร PV ต้องเป็นเคเบิลตามข้อกำหนดเคเบิลของมาตรฐาน โดยมีรายละเอียดชนิดสายในภาคผนวก ฌ",
         en="PV circuit conductors must follow the standard's cable clause; permitted cable types are detailed in Appendix ฌ."),
    dict(kw="mc4 ขั้วต่อ connector ต่างยี่ห้อ ประกบ เต้าเสียบ",
         ref="EIT2568.DC.CONNECTOR_MATCHING",
         th="ขั้วต่อในวงจร PV ต้องเป็นยี่ห้อ/รุ่นที่ผู้ผลิตระบุว่าประกบกันได้ — ไม่ควรจับคู่ขั้วต่อคนละผู้ผลิตโดยไม่มีเอกสารรับรอง",
         en="PV connectors must be brand/model combinations the manufacturer certifies as compatible — do not mix makers without documentation."),
    dict(kw="voltage drop แรงดันตก เกณฑ์ กี่เปอร์เซ็นต์",
         ref="EIT2564.AC_DC.VOLTAGE_DROP",
         th="เกณฑ์แรงดันตกของวงจรกำหนดในมาตรฐานการติดตั้งทางไฟฟ้าฯ — แยกเกณฑ์วงจรย่อย/สายป้อน และเกณฑ์รวม ดูข้อที่อ้างอิงประกอบการคำนวณ",
         en="Voltage-drop criteria are set in the Thai Electrical Code — separate branch/feeder and total limits; see the cited clause for calculations."),
    dict(kw="voltage drop bess แบตเตอรี่ pce 3%",
         ref=None, code="EIT-2568", clause="5.4.2 (5)",
         title="แรงดันตกระหว่างแบตเตอรี่กับ PCE",
         th="แรงดันตกระหว่างระบบแบตเตอรี่กับ PCE ต้องไม่เกิน 3% ของพิกัดแรงดันกระแสตรงที่ขั้วแบตเตอรี่",
         en="Voltage drop between the battery system and the PCE must not exceed 3% of the DC voltage rating at the battery terminals."),
    dict(kw="ampacity derating ลดพิกัด กระแสสาย ตัวคูณ อุณหภูมิ",
         ref="EIT2564.COND.AMPACITY_DERATING",
         th="พิกัดกระแสของสายต้องคูณตัวปรับค่าตามอุณหภูมิแวดล้อมและจำนวนวงจรตามมาตรฐาน — ค่าตัวคูณอยู่ในตารางของเล่ม (ไม่แสดงในระบบนี้)",
         en="Conductor ampacity must be corrected for ambient temperature and grouping per the code — the factors are in the book's tables (not reproduced here)."),
    dict(kw="สายขนาน ขนานสาย parallel ตัวนำ",
         ref="EIT2564.COND.PARALLEL_CONDUCTOR",
         th="การเดินสายขนานทำได้ตามเงื่อนไขของมาตรฐาน เช่น ขนาดขั้นต่ำ ความยาว/ชนิดเท่ากันทุกเส้น — ดูรายละเอียดในข้อที่อ้างอิง",
         en="Parallel conductors are allowed under the code's conditions (minimum size, identical length/type per conductor) — see the cited clause."),
    dict(kw="hdpe ท่อ ในอาคาร indoor conduit",
         ref="EIT2564.CONTAINMENT.HDPE_INDOOR",
         th="การใช้ท่อ HDPE ภายในอาคารมีข้อจำกัดตามมาตรฐาน — ตรวจสอบเงื่อนไขในข้อที่อ้างอิงก่อนออกแบบ",
         en="HDPE conduit use indoors is restricted by the code — check the cited clause before designing."),
    dict(kw="ท่อ conduit fill จำนวนสาย ร้อยสาย พื้นที่หน้าตัด",
         ref="EIT2564.CONTAINMENT.CONDUIT_FILL",
         th="จำนวน/พื้นที่หน้าตัดสายในท่อจำกัดตามมาตรฐาน — ค่าตารางการบรรจุอยู่ในเล่ม (ไม่แสดงในระบบนี้)",
         en="Conduit fill is limited by the code — the fill tables are in the book (not reproduced here)."),
    dict(kw="cable tray ราง จัดกลุ่ม ระยะห่าง 300 225",
         ref="EIT2564.CONTAINMENT.TRAY_FILL",
         th="การจัดสายในรางเคเบิลมีตัวคูณและเงื่อนไข เช่น วางชั้นเดียว, รางแนวนอนห่างกันตามแนวดิ่ง ≥300 มม. ห่างผนัง ≥20 มม., รางแนวดิ่งห่างกัน ≥225 มม. (ตารางที่ 5-41 หมายเหตุ)",
         en="Cable-tray grouping has factors and conditions: single-layer laying, horizontal trays ≥300 mm apart vertically and ≥20 mm from walls, vertical trays ≥225 mm apart (Table 5-41 notes)."),
    dict(kw="สายดิน อุปกรณ์ บริภัณฑ์ egc ขนาด ตารางไหน",
         ref="EIT2564.EARTH.EGC_SIZE",
         th="ขนาดสายดินของบริภัณฑ์ (EGC) เลือกตามพิกัดเครื่องป้องกันกระแสเกิน — ดูตารางที่ 4-2 (และภาคผนวก ญ) ของเล่มมาตรฐาน",
         en="Equipment grounding conductor (EGC) size follows the overcurrent-device rating — see Table 4-2 (and Appendix ญ) in the code."),
    dict(kw="สายต่อหลักดิน gec ขนาด หลักดิน",
         ref="EIT2564.EARTH.GEC_SIZE",
         th="ขนาดสายต่อหลักดิน (GEC) เลือกตามขนาดตัวนำประธาน — ดูตารางที่ 4-1 ของเล่มมาตรฐาน",
         en="Grounding electrode conductor (GEC) size follows the service-conductor size — see Table 4-1 in the code."),
    dict(kw="ต่อลงดิน กราวด์ ระบบ pv ground earthing",
         ref="EIT2568.EARTH.SYSTEM_INTEGRITY",
         th="ลักษณะการต่อลงดินและการต่อประสานของระบบ PV กำหนดไว้ในหมวดการต่อลงดินของมาตรฐานระบบ PV",
         en="Earthing and bonding arrangements for PV systems are set in the PV standard's earthing section."),
    dict(kw="ตัวนำประสาน bonding ขนาด",
         ref="EIT2568.EARTH.BONDING_SIZE",
         th="ขนาดของตัวนำต่อประสานโครงสร้าง/รางแผงกำหนดไว้ในข้อที่อ้างอิง",
         en="Bonding-conductor sizing for frames/racking is set in the cited clause."),
    dict(kw="รากสายดิน แยก separate electrode หลักดินแยก",
         ref="EIT2568.EARTH.SEPARATE_ELECTRODE",
         th="เงื่อนไขการใช้รากสายดินแบบแยกของระบบ PV กำหนดไว้ในข้อที่อ้างอิง",
         en="Conditions for a separate PV earth electrode are set in the cited clause."),
    dict(kw="spd กันเสิร์จ surge เลือก type",
         ref="EIT2568.PROTECTION.SPD_SELECTION",
         th="การเลือกและตำแหน่งติดตั้ง SPD ทั้งฝั่ง DC และ AC กำหนดไว้ในหมวดการป้องกันของมาตรฐานระบบ PV",
         en="SPD selection and placement for both DC and AC sides are set in the PV standard's protection section."),
    dict(kw="ฟ้าผ่า lightning ล่อฟ้า",
         ref="EIT2568.PROTECTION.LIGHTNING",
         th="ข้อกำหนดการป้องกันฟ้าผ่าของระบบ PV (การประสานกับระบบล่อฟ้าอาคาร) อยู่ในข้อที่อ้างอิง",
         en="Lightning-protection requirements for PV (coordination with the building LPS) are in the cited clause."),
    dict(kw="afci arc fault อาร์ก",
         ref="EIT2568.SAFETY.AFCI",
         th="เงื่อนไขที่ต้องติดตั้งอุปกรณ์ตรวจจับอาร์กฟอลต์ (AFCI) กำหนดไว้ในหมวดความปลอดภัยของมาตรฐานระบบ PV",
         en="When arc-fault detection (AFCI) is required is defined in the PV standard's safety section."),
    dict(kw="rapid shutdown หยุดฉุกเฉิน ดับเพลิง ลดแรงดัน",
         ref="EIT2568.SAFETY.RAPID_SHUTDOWN",
         th="ข้อกำหนด Rapid Shutdown (การลดแรงดันวงจร PV บนอาคารเพื่อความปลอดภัยเจ้าหน้าที่ดับเพลิง) อยู่ในข้อที่อ้างอิง",
         en="Rapid-shutdown requirements (de-energizing rooftop PV circuits for firefighter safety) are in the cited clause."),
    dict(kw="ไฟไหม้ fire risk ความเสี่ยง",
         ref="EIT2568.SAFETY.FIRE_RISK",
         th="มาตรการลดความเสี่ยงอัคคีภัยของระบบ PV กำหนดไว้ในหมวดความปลอดภัย",
         en="Fire-risk mitigation for PV systems is set in the safety section."),
    dict(kw="earth fault ตรวจจับ กระแสรั่ว ลงดิน",
         ref="EIT2568.SAFETY.EARTH_FAULT_DETECTION",
         th="การตรวจจับ/แจ้งเตือน earth fault ของระบบ PV กำหนดไว้ในข้อที่อ้างอิง",
         en="PV earth-fault detection/alarm requirements are in the cited clause."),
    dict(kw="อินเวอร์เตอร์ inverter pce มาตรฐาน รับรอง",
         ref="EIT2568.COMP.PCE_STANDARD",
         th="PCE/อินเวอร์เตอร์ต้องเป็นไปตามมาตรฐานผลิตภัณฑ์ที่ระบุในข้อที่อ้างอิง และรุ่นที่ขนานกับการไฟฟ้าต้องอยู่ในทะเบียนของ PEA/MEA",
         en="PCE/inverters must meet the product standards in the cited clause; grid-tied models must be on the PEA/MEA approved registry."),
    dict(kw="bess แบตเตอรี่ กักเก็บ ขอบเขต scope",
         ref="EIT2568.BESS.SCOPE",
         th="ขอบเขตข้อกำหนดระบบกักเก็บพลังงานแบตเตอรี่ (BESS) กำหนดไว้ในบท BESS ของ วสท. 022013-25",
         en="The scope of BESS requirements is defined in the BESS chapter of วสท. 022013-25."),
    dict(kw="bess แรงดัน จำกัด voltage limit",
         ref="EIT2568.BESS.VOLTAGE_LIMIT",
         th="พิกัดแรงดันของระบบ BESS กำหนดไว้ในข้อที่อ้างอิง",
         en="BESS voltage limits are set in the cited clause."),
    dict(kw="bess ตำแหน่ง ติดตั้ง ห้อง location",
         ref="EIT2568.BESS.LOCATION",
         th="ข้อกำหนดตำแหน่ง/สถานที่ติดตั้ง BESS (การระบายอากาศ ระยะห่าง ฯลฯ) อยู่ในข้อที่อ้างอิง",
         en="BESS location requirements (ventilation, clearances, etc.) are in the cited clause."),
    dict(kw="arc flash ppe 240 แบตเตอรี่",
         ref=None, code="EIT-2568", clause="5.5.1 (6)",
         title="PPE ป้องกัน arc flash ระบบแบตเตอรี่",
         th="ระบบแบตเตอรี่ที่แรงดันเกิน 240 V (DC หรือ AC) ต้องกำหนดระดับ PPE ป้องกัน arc flash สำหรับผู้ปฏิบัติงาน",
         en="Battery systems above 240 V (DC or AC) require an arc-flash PPE level to be defined for workers."),
    dict(kw="ขนาน ไฟ pea ขอ ขนาด ระบบ กี่ kw interconnection",
         ref="PEA.INTERCONNECT.SYSTEM_SIZE_LIMIT",
         th="ขนาดระบบที่ขอเชื่อมขนานกับโครงข่าย PEA มีเพดานตามระเบียบการเชื่อมต่อ — ดูข้อที่อ้างอิงและระเบียบ PEA ฉบับปัจจุบันประกอบ",
         en="System size for PEA grid interconnection is capped by the interconnection rules — see the cited reference and current PEA regulations."),
    dict(kw="มาตรฐาน เล่มไหน อ้างอิง วสท ใช้เล่มอะไร",
         ref=None, code=None, clause=None, title="เล่มมาตรฐานที่ระบบอ้างอิง",
         th="ระบบอ้างอิง 3 เล่มหลักของ วสท.: มาตรฐานการติดตั้งทางไฟฟ้าฯ พ.ศ. 2564 (022001-22), ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์และ BESS พ.ศ. 2568 (022013-25) และฉบับ Solar Rooftop พ.ศ. 2565 (022013-22)",
         en="Answers reference three EIT volumes: Thai Electrical Code 2021 (022001-22), the Solar + BESS standard 2025 (022013-25), and Solar Rooftop 2022 (022013-22)."),
]


def validate(entries):
    bad = []
    for e in entries:
        for k in ("a_th", "a_en", "title"):
            v = e.get(k)
            if v and len(v) > MAX_ANSWER_CHARS:
                bad.append((e["id"], k, len(v)))
    if bad:
        for b in bad:
            print("TOO LONG:", b)
        sys.exit("copyright guard: answers must stay short")


def main():
    src = io.open(CLAUSE_MAP, encoding="utf-8").read()
    codes = parse_code_editions(src)
    clauses = parse_rule_map(src)
    by_id = {c["id"]: c for c in clauses}
    provisions = parse_provisions(codes)

    faq = []
    for i, f in enumerate(FAQ):
        ref = by_id.get(f.get("ref") or "")
        faq.append({
            "id": "FAQ.%02d" % (i + 1),
            "type": "faq",
            "code": ref["code"] if ref else f.get("code"),
            "clause": ref["clause"] if ref else f.get("clause"),
            "table": ref["table"] if ref else None,
            "title": ref["title"] if ref else f.get("title", ""),
            "kw": f["kw"],
            "a_th": f["th"], "a_en": f["en"],
        })

    entries = faq + provisions + clauses
    validate(entries)

    data = {
        "generated": date.today().isoformat(),
        "note": "เลขข้อ/เลขตาราง/ชื่อหัวข้อเป็นข้อมูลอ้างอิงบรรณานุกรม คำอธิบายเป็นคำสรุปที่เรียบเรียงขึ้นเอง — เนื้อหาฉบับเต็มอยู่ในเล่มมาตรฐานของ วสท.",
        "codes": codes,
        "entries": entries,
    }
    with io.open(os.path.abspath(OUT), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print("codes:", len(codes), "| faq:", len(faq),
          "| provisions:", len(provisions), "| clauses:", len(clauses),
          "| total entries:", len(entries))
    print("written:", os.path.abspath(OUT))


if __name__ == "__main__":
    main()
