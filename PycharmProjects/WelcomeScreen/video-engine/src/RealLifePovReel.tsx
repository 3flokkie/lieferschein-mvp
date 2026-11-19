import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/*
 * =========================================================================
 * REAL LIFE POV REEL — 1080x1920 @ 60 FPS, 2820 FRAMES (47s)
 * "Shot on iPhone, handheld" — night desk, warm lamp, MacBook in 3D.
 *
 *   01  0.00 –  9.20s : handheld pan over dark desk → MacBook (aingeneer.com + terminal)
 *   02  9.20 – 21.00s : lean in → LIEFERSCHEIN PDF · 40 позиций → "РУКАМИ: 58 МИН" crossed out
 *   03 21.00 – 31.20s : drag PDF → bot · 3.0s countdown → 99.4% table → ERP/DATEV export
 *   04 31.20 – 37.70s : pull back · studio of real tools running + terminal
 *   05 37.70 – 47.00s : Stories CTA — НАПИШИ «ТЕСТ» · БЕСПЛАТНЫЙ ПИЛОТ 48 ЧАСОВ
 *
 * Scene cuts follow the voiceover word timings.
 * All cyclic indices go through mod().
 * =========================================================================
 */

const FPS = 60;
const TOTAL = 2820;
const W = 1080;
const H = 1920;

const SANS = "-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.45, 0, 0.2, 1);
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sec = (s: number) => Math.round(s * FPS);

/** Safe modulo — always 0..m-1, even for negative / fractional n. */
const mod = (n: number, m: number) => ((Math.floor(n) % m) + m) % m;

const AF_YELLOW = "#FFD60A";
const IOS_RED = "#FF3B30";
const TG_BLUE = "#2AABEE";
const OK_GREEN = "#30D158";

// ---------------------------------------------------------------- words
type Word = { w: string; s: number; e: number };
const WORDS: Word[] = [
  { w: "Пацаны,", s: 0.00, e: 0.54 },
  { w: "сейчас", s: 0.80, e: 1.00 },
  { w: "два", s: 1.00, e: 1.28 },
  { w: "часа", s: 1.28, e: 1.56 },
  { w: "ночи,", s: 1.56, e: 1.88 },
  { w: "я", s: 1.96, e: 1.98 },
  { w: "просто", s: 1.98, e: 2.26 },
  { w: "сижу", s: 2.26, e: 2.54 },
  { w: "у", s: 2.54, e: 2.72 },
  { w: "себя", s: 2.72, e: 2.88 },
  { w: "в", s: 2.88, e: 3.04 },
  { w: "комнате", s: 3.04, e: 3.44 },
  { w: "и", s: 3.44, e: 3.62 },
  { w: "хочу", s: 3.62, e: 3.92 },
  { w: "в", s: 3.92, e: 4.08 },
  { w: "живую", s: 4.08, e: 4.40 },
  { w: "показать,", s: 4.40, e: 4.90 },
  { w: "как", s: 4.96, e: 5.04 },
  { w: "работает", s: 5.04, e: 5.50 },
  { w: "наша", s: 5.50, e: 5.80 },
  { w: "система", s: 5.80, e: 6.30 },
  { w: "на", s: 6.30, e: 6.86 },
  { w: "AI", s: 6.86, e: 7.30 },
  { w: "-инженер", s: 7.30, e: 7.96 },
  { w: ".com.", s: 7.96, e: 9.02 },
  { w: "Вот", s: 9.36, e: 9.78 },
  { w: "смотри", s: 9.78, e: 10.14 },
  { w: "на", s: 10.14, e: 10.28 },
  { w: "экран", s: 10.28, e: 10.50 },
  { w: "-ноута.", s: 10.50, e: 11.04 },
  { w: "Немецкая", s: 11.46, e: 11.86 },
  { w: "фирма", s: 11.86, e: 12.22 },
  { w: "прислала", s: 12.22, e: 12.60 },
  { w: "обычную", s: 12.60, e: 13.10 },
  { w: "бумажную,", s: 13.10, e: 13.70 },
  { w: "накладную", s: 13.82, e: 14.26 },
  { w: "в", s: 14.26, e: 14.42 },
  { w: "PDF", s: 14.42, e: 14.72 },
  { w: "на", s: 14.72, e: 14.96 },
  { w: "40", s: 14.96, e: 15.24 },
  { w: "позиций.", s: 15.24, e: 15.90 },
  { w: "Раньше", s: 16.42, e: 16.70 },
  { w: "человек", s: 16.70, e: 17.08 },
  { w: "сидел", s: 17.08, e: 17.48 },
  { w: "и", s: 17.48, e: 17.60 },
  { w: "вбивал", s: 17.60, e: 17.88 },
  { w: "все", s: 17.88, e: 18.14 },
  { w: "это", s: 18.14, e: 18.32 },
  { w: "в", s: 18.32, e: 18.42 },
  { w: "программу", s: 18.42, e: 18.88 },
  { w: "руками,", s: 18.88, e: 19.32 },
  { w: "почти", s: 19.70, e: 20.00 },
  { w: "час.", s: 20.00, e: 20.40 },
  { w: "Теперь", s: 21.16, e: 21.44 },
  { w: "я", s: 21.44, e: 21.64 },
  { w: "просто", s: 21.64, e: 21.92 },
  { w: "кидаю", s: 21.92, e: 22.36 },
  { w: "файл", s: 22.36, e: 22.82 },
  { w: "в", s: 22.82, e: 22.94 },
  { w: "нашего", s: 22.94, e: 23.26 },
  { w: "бота,", s: 23.26, e: 23.66 },
  { w: "проходит", s: 24.10, e: 24.48 },
  { w: "три", s: 24.48, e: 24.82 },
  { w: "секунды", s: 24.82, e: 25.40 },
  { w: "и", s: 25.40, e: 25.88 },
  { w: "готовая", s: 25.88, e: 26.30 },
  { w: "таблица", s: 26.30, e: 26.76 },
  { w: "уже", s: 26.76, e: 26.98 },
  { w: "сама", s: 26.98, e: 27.34 },
  { w: "улетает", s: 27.34, e: 27.88 },
  { w: "в", s: 27.88, e: 28.00 },
  { w: "учет", s: 28.00, e: 28.22 },
  { w: "с", s: 28.22, e: 28.44 },
  { w: "точностью", s: 28.44, e: 28.86 },
  { w: "99", s: 28.86, e: 29.56 },
  { w: "и", s: 29.56, e: 30.26 },
  { w: "4%.", s: 30.26, e: 31.32 },
  { w: "И", s: 31.32, e: 32.10 },
  { w: "таких", s: 32.10, e: 32.34 },
  { w: "реальных", s: 32.34, e: 32.80 },
  { w: "инструментов", s: 32.80, e: 33.52 },
  { w: "мы", s: 33.52, e: 33.64 },
  { w: "уже", s: 33.64, e: 33.84 },
  { w: "собрали", s: 33.84, e: 34.24 },
  { w: "целую", s: 34.24, e: 34.60 },
  { w: "студию,", s: 34.60, e: 35.04 },
  { w: "пока", s: 35.12, e: 35.28 },
  { w: "все", s: 35.28, e: 35.50 },
  { w: "остальные", s: 35.50, e: 35.88 },
  { w: "просто", s: 35.88, e: 36.22 },
  { w: "играются", s: 36.22, e: 36.70 },
  { w: "в", s: 36.70, e: 36.80 },
  { w: "чате.", s: 36.80, e: 37.12 },
  { w: "Напиши", s: 37.82, e: 38.28 },
  { w: "слово", s: 38.28, e: 38.48 },
  { w: "тест", s: 38.48, e: 38.82 },
  { w: "в", s: 38.82, e: 39.04 },
  { w: "комментариях.", s: 39.04, e: 39.74 },
  { w: "И", s: 40.28, e: 40.48 },
  { w: "мы", s: 40.48, e: 40.60 },
  { w: "сделаем", s: 40.60, e: 41.04 },
  { w: "такой", s: 41.04, e: 41.34 },
  { w: "же", s: 41.34, e: 41.52 },
  { w: "бесплатный", s: 41.52, e: 42.12 },
  { w: "пилот", s: 42.12, e: 42.50 },
  { w: "на", s: 42.50, e: 42.68 },
  { w: "твоем", s: 42.68, e: 43.00 },
  { w: "документе", s: 43.00, e: 43.70 },
  { w: "за", s: 43.70, e: 44.18 },
  { w: "48", s: 44.18, e: 44.66 },
  { w: "часов.", s: 44.66, e: 45.44 }
];

// ---------------------------------------------------------------- scenes
const S1 = 0;
const S2 = 9.2;
const S3 = 21.0;
const S4 = 31.2;
const S5 = 37.7;

// ---------------------------------------------------------------- helpers
const kf = (t: number, times: number[], vals: number[]) =>
  interpolate(t, times, vals, { ...clamp, easing: EASE });

/** Organic handheld motion: layered incommensurate sines (deterministic). */
const handheld = (t: number) => {
  const x =
    Math.sin(t * 0.9) * 9 + Math.sin(t * 2.3 + 1.2) * 4 + Math.sin(t * 7.1 + 0.4) * 1.2;
  const y =
    Math.sin(t * 0.7 + 2.0) * 8 + Math.sin(t * 1.9 + 0.3) * 5 + Math.sin(t * 6.3 + 2.2) * 1.1;
  const r = Math.sin(t * 0.55 + 0.8) * 0.55 + Math.sin(t * 1.7) * 0.25;
  const breathe = 1 + Math.sin(t * 1.3) * 0.004;
  return { x, y, r, breathe };
};

// AF rack moments (seconds) — focus hunts then locks.
const AF_EVENTS = [
  { t: 2.6, x: 540, y: 820, size: 300 },
  { t: 9.5, x: 540, y: 860, size: 340 },
  { t: 21.4, x: 600, y: 880, size: 280 },
  { t: 28.6, x: 540, y: 820, size: 320 },
  { t: 31.5, x: 540, y: 900, size: 380 },
];

const afBlur = (t: number) => {
  let b = 0;
  for (const ev of AF_EVENTS) {
    const d = t - ev.t;
    if (d > -0.05 && d < 0.6) {
      // hunt: blur up, slight overshoot, settle
      b = Math.max(b, interpolate(d, [-0.05, 0.08, 0.22, 0.32, 0.6], [0, 7, 1.5, 3, 0], clamp));
    }
  }
  return b;
};

// ---------------------------------------------------------------- screen content
const ScreenS1: React.FC<{ t: number }> = ({ t }) => {
  const lines = [
    "$ cd ~/aingeneer && ./demo --live",
    "▸ loading agents ............ ok",
    "▸ ocr-engine v4.2 ........... ok",
    "▸ telegram-bridge ........... ok",
    "▸ erp-connector (DATEV) ..... ok",
    "✔ ready · 02:14:07",
  ];
  const shown = Math.floor(interpolate(t, [3.5, 8.5], [0, lines.length + 0.99], clamp));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0b0d12" }}>
      {/* browser */}
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 300, background: "#f5f5f7" }}>
        <div style={{ height: 34, background: "#e3e3e8", display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />
          ))}
          <div style={{ marginLeft: 20, flex: 1, height: 20, borderRadius: 6, background: "#fff", fontFamily: SANS, fontSize: 12, color: "#333", display: "flex", alignItems: "center", paddingLeft: 10 }}>
            🔒 aingeneer.com
          </div>
        </div>
        <div style={{ padding: "26px 34px", fontFamily: SANS }}>
          <div style={{ fontSize: 13, color: "#888", letterSpacing: 2 }}>AI-ИНЖЕНЕР · AUTOMATION STUDIO</div>
          <div style={{ fontSize: 38, fontWeight: 800, color: "#111", marginTop: 8, lineHeight: 1.05 }}>
            Документы → данные.
            <br />
            За секунды, не часы.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <div style={{ background: "#111", color: "#fff", fontSize: 13, padding: "8px 14px", borderRadius: 8 }}>Пилот за 48 ч</div>
            <div style={{ border: "1px solid #bbb", color: "#333", fontSize: 13, padding: "8px 14px", borderRadius: 8 }}>Кейсы</div>
          </div>
        </div>
      </div>
      {/* terminal */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, bottom: 0, padding: "18px 24px", fontFamily: MONO, fontSize: 17, color: "#c9d1d9", lineHeight: 1.65 }}>
        {lines.slice(0, shown).map((l, i) => (
          <div key={i} style={{ color: l.startsWith("✔") ? OK_GREEN : l.startsWith("$") ? "#fff" : "#9aa4b2" }}>
            {l}
          </div>
        ))}
        <span style={{ display: "inline-block", width: 10, height: 19, background: mod(t * 2, 2) === 0 ? "#c9d1d9" : "transparent" }} />
      </div>
    </div>
  );
};

const LS_ITEMS = [
  ["10", "4711-200", "Sechskantschraube M8x40 DIN 933", "500", "Stk"],
  ["20", "4711-210", "Unterlegscheibe A8,4 verzinkt", "500", "Stk"],
  ["30", "5520-018", "Kabelbinder 300x4,8 schwarz", "1.000", "Stk"],
  ["40", "6610-045", "Hydraulikschlauch DN10 1,5m", "12", "Stk"],
  ["50", "6610-050", "Schlauchschelle 16-27mm W2", "48", "Stk"],
  ["60", "7034-112", "Kugellager 6204-2RS", "24", "Stk"],
  ["70", "7034-118", "Dichtring NBR 40x52x7", "36", "Stk"],
  ["80", "8100-002", "Schmierfett Lithium EP2 400g", "18", "Ktu"],
  ["90", "8822-310", "Flachstahl S235 40x5 6m", "8", "Stg"],
  ["100", "9001-077", "Montagepaste Kupfer 100g", "10", "Dos"],
];

const PdfDoc: React.FC<{ scroll: number; scale?: number }> = ({ scroll, scale = 1 }) => (
  <div style={{ width: 520 * scale, flexShrink: 0, background: "#fff", color: "#111", fontFamily: "Helvetica, Arial, sans-serif", padding: 22 * scale, boxShadow: "0 6px 24px rgba(0,0,0,0.5)", transform: `translateY(${-scroll}px)` }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 * scale, color: "#444" }}>
      <div>
        <b style={{ fontSize: 13 * scale, color: "#111" }}>Müller &amp; Söhne GmbH</b>
        <br />Industriestraße 14 · 70565 Stuttgart
      </div>
      <div style={{ textAlign: "right" }}>
        Nr. LS-2026-08841
        <br />Datum: 17.11.2026
      </div>
    </div>
    <div style={{ fontSize: 22 * scale, fontWeight: 800, marginTop: 14 * scale, letterSpacing: 1 }}>LIEFERSCHEIN</div>
    <div style={{ marginTop: 10 * scale, fontSize: 9.5 * scale }}>
      <div style={{ display: "grid", gridTemplateColumns: "8% 18% 52% 12% 10%", fontWeight: 700, borderBottom: "1.5px solid #111", paddingBottom: 3 }}>
        <div>Pos</div><div>Art.-Nr.</div><div>Bezeichnung</div><div>Menge</div><div>ME</div>
      </div>
      {[0, 1, 2, 3].flatMap((rep) =>
        LS_ITEMS.map((r, i) => (
          <div key={`${rep}-${i}`} style={{ display: "grid", gridTemplateColumns: "8% 18% 52% 12% 10%", borderBottom: "1px solid #ddd", padding: `${3 * scale}px 0` }}>
            <div>{(rep * 10 + i + 1) * 10}</div>
            <div>{r[1].replace("-", `-${rep}`)}</div>
            <div>{r[2]}</div>
            <div>{r[3]}</div>
            <div>{r[4]}</div>
          </div>
        ))
      )}
    </div>
  </div>
);

const ScreenS2: React.FC<{ t: number }> = ({ t }) => {
  const scroll = interpolate(t, [S2 + 4.5, S2 + 7], [0, 230], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#3a3a3c" }}>
      <div style={{ height: 34, background: "#2c2c2e", color: "#ddd", fontFamily: SANS, fontSize: 13, display: "flex", alignItems: "center", padding: "0 16px", gap: 12 }}>
        <span>📄 Lieferschein_LS-2026-08841.pdf</span>
        <span style={{ marginLeft: "auto", color: "#999" }}>Seite 1 von 3 · 40 Positionen</span>
      </div>
      <div style={{ position: "absolute", top: 50, left: 0, right: 0, bottom: 0, overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        <PdfDoc scroll={scroll} />
      </div>
    </div>
  );
};

const ScreenS3: React.FC<{ t: number }> = ({ t }) => {
  const dropT = 22.4;
  const drag = interpolate(t, [S3 + 0.6, dropT], [0, 1], { ...clamp, easing: EASE });
  const dropped = t >= dropT;
  const cdStart = 24.1;
  const cdEnd = cdStart + 3.0;
  const remaining = interpolate(t, [cdStart, cdEnd], [3.0, 0.0], clamp);
  const showCountdown = t >= cdStart - 0.2 && t < cdEnd + 0.2;
  const tableIn = interpolate(t, [cdEnd, cdEnd + 0.5], [0, 1], { ...clamp, easing: EXPO_OUT });
  const rowsShown = Math.floor(interpolate(t, [cdEnd, cdEnd + 1.2], [0, 8.99], clamp));
  const exportP = interpolate(t, [27.3, 28.3], [0, 1], clamp);
  const acc = interpolate(t, [28.8, 30.3], [0, 99.4], { ...clamp, easing: EXPO_OUT });

  return (
    <div style={{ position: "absolute", inset: 0, background: "#0e1621", fontFamily: SANS }}>
      {/* telegram header */}
      <div style={{ height: 52, background: "#17212b", display: "flex", alignItems: "center", padding: "0 18px", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 17, background: TG_BLUE, color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>AI</div>
        <div>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>aingeneer_docs_bot</div>
          <div style={{ color: TG_BLUE, fontSize: 12 }}>{showCountdown ? "обрабатывает…" : "бот"}</div>
        </div>
      </div>
      {/* dragged file */}
      {!dropped && (
        <div style={{ position: "absolute", left: interpolate(drag, [0, 1], [640, 330]), top: interpolate(drag, [0, 1], [380, 260]), transform: `scale(${1 + Math.sin(drag * Math.PI) * 0.12}) rotate(${(1 - drag) * -6}deg)`, opacity: 0.95 }}>
          <div style={{ width: 120, height: 150, background: "#fff", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.6)" }}>
            <div style={{ background: "#e5322d", color: "#fff", fontWeight: 800, fontSize: 18, padding: "4px 10px", borderRadius: 4 }}>PDF</div>
            <div style={{ fontSize: 10, color: "#333", marginTop: 10, textAlign: "center" }}>Lieferschein<br />08841.pdf</div>
          </div>
          {/* cursor */}
          <div style={{ position: "absolute", left: 80, top: 110, width: 0, height: 0, borderLeft: "12px solid #fff", borderTop: "8px solid transparent", borderBottom: "8px solid transparent", transform: "rotate(-35deg)", filter: "drop-shadow(0 0 2px #000)" }} />
        </div>
      )}
      {!dropped && drag > 0.4 && (
        <div style={{ position: "absolute", left: 30, right: 30, top: 80, bottom: 80, border: `3px dashed ${TG_BLUE}`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: TG_BLUE, fontSize: 22, background: "rgba(42,171,238,0.06)" }}>
          Отпустите файл для отправки
        </div>
      )}
      {/* chat */}
      {dropped && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 62, padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ alignSelf: "flex-end", background: "#2b5278", borderRadius: 12, padding: "10px 14px", display: "flex", gap: 12, alignItems: "center", color: "#fff" }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: TG_BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>PDF</div>
            <div style={{ fontSize: 13 }}>Lieferschein_08841.pdf<br /><span style={{ color: "#9fc3e7" }}>412 KB · 02:14</span></div>
          </div>
          {showCountdown && (
            <div style={{ alignSelf: "flex-start", background: "#182533", borderRadius: 12, padding: "14px 22px", color: "#fff", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, border: "4px solid #2b3a4a", borderTopColor: TG_BLUE, transform: `rotate(${t * 720}deg)` }} />
              <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 700 }}>{remaining.toFixed(1)}s</div>
            </div>
          )}
          {tableIn > 0 && (
            <div style={{ alignSelf: "flex-start", width: "94%", background: "#182533", borderRadius: 12, padding: 14, color: "#e6edf3", opacity: tableIn, transform: `translateY(${(1 - tableIn) * 20}px)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8ba3bb" }}>
                <span>✅ 40/40 позиций · структурировано</span>
                <span style={{ color: OK_GREEN, fontWeight: 700, fontSize: 15 }}>{acc.toFixed(1)}%</span>
              </div>
              <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 11.5 }}>
                <div style={{ display: "grid", gridTemplateColumns: "10% 22% 50% 18%", color: TG_BLUE, borderBottom: "1px solid #2b3a4a", paddingBottom: 3 }}>
                  <div>pos</div><div>sku</div><div>name</div><div>qty</div>
                </div>
                {LS_ITEMS.slice(0, rowsShown).map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "10% 22% 50% 18%", padding: "2px 0", borderBottom: "1px solid #1f2d3b" }}>
                    <div>{r[0]}</div><div>{r[1]}</div><div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>{r[2].slice(0, 22)}</div><div>{r[3]} {r[4]}</div>
                  </div>
                ))}
              </div>
              {exportP > 0 && (
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  {["DATEV", "ERP · SAP B1"].map((label, i) => (
                    <div key={label} style={{ flex: 1, background: "#0e1621", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>⇪ {label}</span>
                        <span style={{ color: exportP >= 1 ? OK_GREEN : "#8ba3bb" }}>{exportP >= 1 ? "✓ отправлено" : `${Math.round(exportP * 100)}%`}</span>
                      </div>
                      <div style={{ height: 4, background: "#2b3a4a", borderRadius: 2, marginTop: 6 }}>
                        <div style={{ height: 4, width: `${Math.min(1, exportP * (1.1 - i * 0.1)) * 100}%`, background: OK_GREEN, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TOOLS = [
  { name: "Lieferschein → DATEV", stat: "1 284 док." },
  { name: "Rechnung OCR", stat: "99.4%" },
  { name: "Angebot-Generator", stat: "3.1 с" },
  { name: "Telegram CRM-бот", stat: "online" },
  { name: "Lager-Sync ERP", stat: "live" },
  { name: "Mail-Triage Agent", stat: "212/д" },
];

const ScreenS4: React.FC<{ t: number }> = ({ t }) => {
  const logs = [
    "[02:15:01] lieferschein.parse  ok  2.9s",
    "[02:15:03] datev.export        ok  204ms",
    "[02:15:04] rechnung.ocr        ok  99.6%",
    "[02:15:06] crm.telegram        msg →  lead#882",
    "[02:15:07] lager.sync          +40 items",
    "[02:15:09] mail.triage         12 sorted",
    "[02:15:11] angebot.gen         pdf ready",
  ];
  const lt = t - S4;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#1c1c1e", padding: 14, fontFamily: SANS }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {TOOLS.map((tool, i) => {
          const a = interpolate(lt, [0.3 + i * 0.25, 0.7 + i * 0.25], [0, 1], { ...clamp, easing: EXPO_OUT });
          const pulse = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.3);
          return (
            <div key={tool.name} style={{ background: "#2c2c2e", borderRadius: 10, padding: "12px 12px", opacity: a, transform: `scale(${0.9 + a * 0.1})` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: OK_GREEN, opacity: 0.5 + pulse * 0.5 }} />
                <div style={{ color: "#8e8e93", fontSize: 10 }}>RUNNING</div>
              </div>
              <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 600, marginTop: 6 }}>{tool.name}</div>
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginTop: 4 }}>{tool.stat}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, background: "#0b0d12", borderRadius: 10, padding: "10px 14px", fontFamily: MONO, fontSize: 13, color: "#9aa4b2", height: 190, overflow: "hidden" }}>
        <div style={{ color: "#fff" }}>aingeneer@studio:~$ tail -f pipelines.log</div>
        {logs.map((l, i) => {
          const idx = mod(Math.floor(lt * 2.2) + i, logs.length);
          return (
            <div key={i} style={{ color: i === logs.length - 1 ? OK_GREEN : "#9aa4b2" }}>
              {logs[idx]}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 3D desk world
const SCREEN_W = 700;
const SCREEN_H = 450;

const MacBook: React.FC<{ t: number }> = ({ t }) => {
  let content: React.ReactNode;
  if (t < S2) content = <ScreenS1 t={t} />;
  else if (t < S3) content = <ScreenS2 t={t} />;
  else if (t < S4) content = <ScreenS3 t={t} />;
  else content = <ScreenS4 t={t} />;

  const h = handheld(t);
  const glareX = interpolate(h.x, [-14, 14], [-40, 40]);

  return (
    <div style={{ position: "absolute", left: (W - SCREEN_W - 40) / 2, top: 600, width: SCREEN_W + 40, height: SCREEN_H + 40, transformStyle: "preserve-3d", transform: "rotateY(-12deg) rotateX(4deg)" }}>
      {/* lid */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: "linear-gradient(160deg,#2a2b2f,#0d0d0f)", boxShadow: "0 0 0 2px #3a3b40, 0 40px 80px rgba(0,0,0,0.8)" }} />
      {/* display */}
      <div style={{ position: "absolute", left: 20, top: 20, width: SCREEN_W, height: SCREEN_H, borderRadius: 8, overflow: "hidden", background: "#000" }}>
        {content}
        {/* glare */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${30 + glareX * 0.3}%, rgba(255,255,255,0.09) ${40 + glareX * 0.3}%, transparent ${55 + glareX * 0.3}%)`, mixBlendMode: "screen", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: "-20%", top: "-40%", width: "60%", height: "80%", background: "radial-gradient(ellipse, rgba(255,190,120,0.10), transparent 70%)", transform: `translateX(${glareX}px)` }} />
      </div>
      {/* notch */}
      <div style={{ position: "absolute", left: "50%", top: 20, width: 110, height: 16, marginLeft: -55, background: "#0d0d0f", borderRadius: "0 0 8px 8px" }} />
      {/* base / keyboard deck */}
      <div style={{ position: "absolute", left: -50, top: SCREEN_H + 36, width: SCREEN_W + 140, height: 230, transformOrigin: "top center", transform: "rotateX(72deg)", background: "linear-gradient(180deg,#9a9ca3,#6e7077)", borderRadius: "6px 6px 26px 26px", boxShadow: "0 30px 50px rgba(0,0,0,0.7)" }}>
        <div style={{ position: "absolute", left: 70, right: 70, top: 18, height: 120, background: "#1b1c1f", borderRadius: 6, display: "grid", gridTemplateColumns: "repeat(14,1fr)", gap: 3, padding: 4 }}>
          {Array.from({ length: 70 }).map((_, i) => (
            <div key={i} style={{ background: "#2a2b2f", borderRadius: 2 }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: "50%", marginLeft: -110, width: 220, top: 148, height: 72, background: "#85878e", borderRadius: 8 }} />
      </div>
    </div>
  );
};

const DeskWorld: React.FC<{ t: number }> = ({ t }) => {
  const lampFlicker = 1 + Math.sin(t * 31) * 0.01 + Math.sin(t * 7.7) * 0.008;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#07060a" }}>
      {/* back wall with lamp spill */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 900px 900px at 180px 420px, rgba(255,170,90,${0.32 * lampFlicker}), rgba(80,45,20,0.15) 45%, transparent 75%), linear-gradient(180deg,#120e0c,#0a0808)` }} />
      {/* poster/shelf silhouettes for depth (bokeh-blurred) */}
      <div style={{ position: "absolute", left: 700, top: 160, width: 260, height: 340, background: "#1a1512", filter: "blur(10px)", borderRadius: 6 }} />
      {[[820, 260, 26], [880, 320, 18], [120, 240, 30], [300, 160, 16], [960, 520, 22]].map(([x, y, r], i) => (
        <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, background: "rgba(255,190,130,0.22)", filter: "blur(6px)", opacity: 0.6 + 0.3 * Math.sin(t * 0.8 + i) }} />
      ))}

      {/* desk plane */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, perspective: 1500, perspectiveOrigin: "50% 40%" }}>
        <div style={{ position: "absolute", left: -900, width: W + 1800, top: 1000, height: 2200, transformOrigin: "top center", transform: "rotateX(68deg)", background: "repeating-linear-gradient(90deg, #4a2e1b 0px, #563621 22px, #4d311d 47px, #5a3a24 80px, #4a2e1b 120px)" }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 1100px 900px at 30% 10%, rgba(255,175,95,${0.55 * lampFlicker}), transparent 70%)` }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.75) 70%)" }} />
        </div>
      </div>

      {/* desk lamp (left) */}
      <div style={{ position: "absolute", left: 40, top: 300, width: 300, height: 760, filter: "blur(1.5px)" }}>
        <div style={{ position: "absolute", left: 80, top: 0, width: 200, height: 120, borderRadius: "100px 100px 14px 14px", background: "linear-gradient(180deg,#2b2620,#14110e)", transform: "rotate(-18deg)" }} />
        <div style={{ position: "absolute", left: 110, top: 96, width: 150, height: 40, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(255,235,190,${0.95 * lampFlicker}), rgba(255,170,80,0.4) 60%, transparent)`, transform: "rotate(-18deg)" }} />
        <div style={{ position: "absolute", left: 150, top: 110, width: 10, height: 580, background: "linear-gradient(90deg,#1b1814,#3a332b,#1b1814)", transform: "rotate(6deg)", transformOrigin: "top" }} />
        <div style={{ position: "absolute", left: 70, top: 690, width: 180, height: 40, borderRadius: "50%", background: "#15120f", boxShadow: "0 10px 20px rgba(0,0,0,0.8)" }} />
      </div>

      {/* contact shadow under laptop */}
      <div style={{ position: "absolute", left: 120, top: 1080, width: 880, height: 160, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,0.85), transparent 70%)" }} />

      {/* laptop */}
      <div style={{ position: "absolute", inset: 0, perspective: 1600, perspectiveOrigin: "50% 45%" }}>
        <MacBook t={t} />
      </div>

      {/* notepad (bottom-left) */}
      <div style={{ position: "absolute", left: 40, top: 1330, width: 330, height: 400, transform: "perspective(1200px) rotateX(58deg) rotateZ(-14deg)", background: "#efe6cf", borderRadius: 6, boxShadow: "0 30px 40px rgba(0,0,0,0.6)" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 18, right: 18, top: 40 + i * 28, height: 1.5, background: "rgba(80,110,160,0.35)" }} />
        ))}
        <div style={{ position: "absolute", left: 26, top: 50, fontFamily: "'Marker Felt', 'Bradley Hand', cursive", fontSize: 26, color: "#22344f", lineHeight: "28px" }}>
          LS → DATEV ✓
          <br />58 мин → 3 сек
          <br />пилот 48ч!
        </div>
      </div>
      {/* pen */}
      <div style={{ position: "absolute", left: 300, top: 1420, width: 14, height: 260, background: "linear-gradient(90deg,#111,#444,#111)", borderRadius: 7, transform: "rotate(28deg)", boxShadow: "6px 10px 10px rgba(0,0,0,0.5)" }} />

      {/* coffee mug (right) */}
      <div style={{ position: "absolute", left: 820, top: 1190, width: 190, height: 260 }}>
        <div style={{ position: "absolute", left: 0, top: 210, width: 200, height: 60, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,0.8), transparent 70%)" }} />
        <div style={{ position: "absolute", left: 10, top: 30, width: 160, height: 200, borderRadius: "10px 10px 60px 60px / 10px 10px 30px 30px", background: "linear-gradient(90deg,#c9c2b6 0%,#f4eee4 30%,#d8d0c3 65%,#8d867c 100%)" }} />
        <div style={{ position: "absolute", left: 150, top: 70, width: 60, height: 100, borderRadius: "0 40px 40px 0", border: "16px solid #cfc7ba", borderLeft: "none" }} />
        <div style={{ position: "absolute", left: 10, top: 14, width: 160, height: 36, borderRadius: "50%", background: "radial-gradient(ellipse,#2b170c 55%,#e9e2d6 58%)" }} />
        {/* steam */}
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", left: 60 + i * 26 + Math.sin(t * 1.4 + i) * 10, top: -70 - mod(t * 30 + i * 40, 90), width: 20, height: 90, borderRadius: 20, background: "rgba(255,255,255,0.08)", filter: "blur(8px)" }} />
        ))}
      </div>

      {/* iPhone + hand (bottom-right, foreground, defocused) */}
      <div style={{ position: "absolute", left: 640, top: 1480, width: 420, height: 520, transform: `rotate(-16deg) translate(${Math.sin(t * 0.6) * 4}px, ${Math.sin(t * 0.8) * 3}px)`, filter: "blur(2.5px)" }}>
        <div style={{ position: "absolute", left: 120, top: 40, width: 200, height: 400, borderRadius: 36, background: "#0d0d0f", boxShadow: "0 0 0 3px #3b3b3f, 0 30px 50px rgba(0,0,0,0.7)" }}>
          <div style={{ position: "absolute", inset: 10, borderRadius: 28, background: "linear-gradient(180deg,#1d2a3a,#0b1018)" }}>
            <div style={{ position: "absolute", left: 20, right: 20, top: 40, height: 50, borderRadius: 12, background: "rgba(255,255,255,0.12)" }} />
            <div style={{ position: "absolute", left: 20, right: 60, top: 100, height: 40, borderRadius: 12, background: "rgba(42,171,238,0.35)" }} />
          </div>
        </div>
        {/* hand */}
        <div style={{ position: "absolute", left: 230, top: 210, width: 260, height: 300, borderRadius: "120px 80px 60px 140px", background: "linear-gradient(135deg,#c98f6b,#8a5a40)" }} />
        <div style={{ position: "absolute", left: 90, top: 250, width: 160, height: 56, borderRadius: 30, background: "linear-gradient(180deg,#d39a75,#9c6748)", transform: "rotate(-12deg)" }} />
      </div>

      {/* vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 50%, rgba(0,0,0,0.75))" }} />
    </div>
  );
};

// ---------------------------------------------------------------- overlays
const Grain: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <filter id="rlpr-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={mod(frame, 37)} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#rlpr-grain)" />
  </svg>
);

const AfBracket: React.FC<{ t: number }> = ({ t }) => {
  const ev = AF_EVENTS.find((e) => t - e.t > -0.05 && t - e.t < 1.4);
  if (!ev) return null;
  const d = t - ev.t;
  const sc = interpolate(d, [0, 0.18, 0.3], [1.35, 0.94, 1], { ...clamp, easing: EXPO_OUT });
  const op = interpolate(d, [-0.05, 0.05, 1.0, 1.4], [0, 1, 1, 0], clamp);
  const blink = d > 0.3 && d < 0.6 ? (mod(d * 16, 2) === 0 ? 1 : 0.4) : 1;
  const s = ev.size;
  const arm = 34;
  const line = { position: "absolute" as const, background: AF_YELLOW };
  return (
    <div style={{ position: "absolute", left: ev.x - s / 2, top: ev.y - s / 2, width: s, height: s, transform: `scale(${sc})`, opacity: op * blink }}>
      {[
        { left: 0, top: 0 }, { right: 0, top: 0 }, { left: 0, bottom: 0 }, { right: 0, bottom: 0 },
      ].map((pos, i) => (
        <React.Fragment key={i}>
          <div style={{ ...line, ...pos, width: arm, height: 3 }} />
          <div style={{ ...line, ...pos, width: 3, height: arm }} />
        </React.Fragment>
      ))}
      <div style={{ position: "absolute", left: s / 2 - 1, top: -16, width: 2, height: 10, background: AF_YELLOW }} />
      <div style={{ position: "absolute", right: -46, top: s / 2 - 40, width: 2, height: 80, background: AF_YELLOW, opacity: 0.8 }} />
      <div style={{ position: "absolute", right: -55, top: s / 2 - 12 + Math.sin(t * 2) * 6, fontSize: 22 }}>☀︎</div>
      {d > 0.35 && (
        <div style={{ position: "absolute", left: s / 2 - 70, top: -52, width: 140, textAlign: "center", background: AF_YELLOW, color: "#000", fontFamily: SANS, fontWeight: 700, fontSize: 15, borderRadius: 4, padding: "3px 0" }}>
          AE/AF LOCK
        </div>
      )}
    </div>
  );
};

const Hud: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const recOn = mod(frame / 30, 2) === 0;
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(mod(t, 60)).padStart(2, "0");
  const ff = String(mod(frame / 2, 30)).padStart(2, "0");
  const txt: React.CSSProperties = { fontFamily: SANS, color: "#fff", fontSize: 26, fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,0.6)" };
  return (
    <>
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ ...txt, background: IOS_RED, padding: "6px 16px", borderRadius: 8, fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff", opacity: recOn ? 1 : 0.35 }} />
          00:{mm}:{ss}:{ff}
        </div>
      </div>
      <div style={{ position: "absolute", top: 78, left: 54, ...txt, fontSize: 24, opacity: 0.9 }}>02:14 AM</div>
      <div style={{ position: "absolute", top: 78, right: 54, ...txt, fontSize: 24, opacity: 0.9, display: "flex", gap: 14 }}>
        <span>4K</span><span style={{ opacity: 0.5 }}>·</span><span>60</span>
      </div>
      {/* rule-of-thirds grid, extremely faint */}
      {[1, 2].map((i) => (
        <React.Fragment key={i}>
          <div style={{ position: "absolute", left: (W / 3) * i, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", top: (H / 3) * i, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </React.Fragment>
      ))}
      <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18 }}>
        {[".5", "1x", "3"].map((z) => (
          <div key={z} style={{ width: z === "1x" ? 64 : 48, height: z === "1x" ? 64 : 48, borderRadius: 40, background: "rgba(20,20,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 700, fontSize: z === "1x" ? 22 : 17, color: z === "1x" ? AF_YELLOW : "#fff", alignSelf: "center" }}>
            {z}
          </div>
        ))}
      </div>
    </>
  );
};

/** Stories-style text sticker. */
const Sticker: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number; rotate?: number; style?: React.CSSProperties }> = ({ children, bg = "#fff", color = "#000", size = 46, rotate = 0, style }) => (
  <div style={{ display: "inline-block", background: bg, color, fontFamily: SANS, fontWeight: 800, fontSize: size, padding: `${size * 0.22}px ${size * 0.42}px`, borderRadius: size * 0.28, transform: `rotate(${rotate}deg)`, boxShadow: "0 8px 24px rgba(0,0,0,0.35)", letterSpacing: -0.5, ...style }}>
    {children}
  </div>
);

const popIn = (frame: number, fps: number, at: number) =>
  spring({ frame: frame - sec(at), fps, config: { damping: 13, stiffness: 170, mass: 0.7 } });

const SceneOverlays: React.FC<{ t: number; frame: number; fps: number }> = ({ t, frame, fps }) => {
  const out: React.ReactNode[] = [];

  // S1 tag
  if (t >= 1.0 && t < S2) {
    const p = popIn(frame, fps, 1.0);
    out.push(
      <div key="s1" style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", transform: `scale(${p})` }}>
        <Sticker rotate={-3} size={50}>02:14 НОЧИ · ЖИВОЕ ДЕМО</Sticker>
      </div>
    );
  }
  // S2 tag
  if (t >= 11.5 && t < S3) {
    const p = popIn(frame, fps, 11.5);
    out.push(
      <div key="s2" style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", transform: `scale(${p})` }}>
        <Sticker rotate={2} size={46} bg="#000" color="#fff">LIEFERSCHEIN · 40 ПОЗИЦИЙ</Sticker>
      </div>
    );
  }
  // S2 split: by hand vs AI
  if (t >= 16.4 && t < S3) {
    const p = popIn(frame, fps, 16.4);
    const strike = interpolate(t, [19.7, 20.2], [0, 1], { ...clamp, easing: EXPO_OUT });
    const ai = popIn(frame, fps, 20.1);
    out.push(
      <div key="split" style={{ position: "absolute", top: 1180, left: 60, right: 60, display: "flex", gap: 24, transform: `translateY(${(1 - p) * 60}px)`, opacity: Math.min(1, p) }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.95)", borderRadius: 26, padding: "26px 20px", textAlign: "center", position: "relative" }}>
          <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 700, color: "#666" }}>👤 РУКАМИ</div>
          <div style={{ fontFamily: SANS, fontSize: 76, fontWeight: 900, color: "#111", marginTop: 4, position: "relative", display: "inline-block" }}>
            58 МИН
            <div style={{ position: "absolute", left: -8, right: -8, top: "52%", height: 9, background: IOS_RED, borderRadius: 5, transform: `scaleX(${strike}) rotate(-6deg)`, transformOrigin: "left" }} />
          </div>
        </div>
        <div style={{ flex: 1, background: OK_GREEN, borderRadius: 26, padding: "26px 20px", textAlign: "center", transform: `scale(${ai})` }}>
          <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 700, color: "#063" }}>⚡ БОТ</div>
          <div style={{ fontFamily: SANS, fontSize: 76, fontWeight: 900, color: "#000", marginTop: 4 }}>3 СЕК</div>
        </div>
      </div>
    );
  }
  // S3 accuracy + export
  if (t >= 28.8 && t < S4) {
    const p = popIn(frame, fps, 28.8);
    const acc = interpolate(t, [28.8, 30.3], [0, 99.4], { ...clamp, easing: EXPO_OUT });
    out.push(
      <div key="acc" style={{ position: "absolute", top: 220, left: 0, right: 0, textAlign: "center", transform: `scale(${p})` }}>
        <Sticker size={92} bg={OK_GREEN} rotate={-2}>{acc.toFixed(1)}%</Sticker>
        <div style={{ marginTop: 18 }}>
          <Sticker size={36} rotate={1}>→ ERP / DATEV ЭКСПОРТ ✓</Sticker>
        </div>
      </div>
    );
  } else if (t >= 24.1 && t < 27.2) {
    out.push(
      <div key="cd" style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center" }}>
        <Sticker size={50} bg="#000" color="#fff">⏱ {interpolate(t, [24.1, 27.1], [3, 0], clamp).toFixed(1)} СЕК</Sticker>
      </div>
    );
  } else if (t >= 21.6 && t < 24.1) {
    const p = popIn(frame, fps, 21.6);
    out.push(
      <div key="drop" style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", transform: `scale(${p})` }}>
        <Sticker size={46} bg={TG_BLUE} color="#fff" rotate={-2}>КИДАЮ PDF В БОТА</Sticker>
      </div>
    );
  }
  // S4
  if (t >= 32.0 && t < S5) {
    const p = popIn(frame, fps, 32.0);
    out.push(
      <div key="s4" style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", transform: `scale(${p})` }}>
        <Sticker size={48} rotate={-2}>ЦЕЛАЯ СТУДИЯ ИНСТРУМЕНТОВ</Sticker>
        <div style={{ marginTop: 16 }}>
          <Sticker size={30} bg="#000" color="#fff">aingeneer.com · 6 RUNNING</Sticker>
        </div>
      </div>
    );
  }
  return <>{out}</>;
};

const Cta: React.FC<{ t: number; frame: number; fps: number }> = ({ t, frame, fps }) => {
  if (t < S5) return null;
  const a = popIn(frame, fps, S5 + 0.1);
  const b = popIn(frame, fps, 38.4);
  const c = popIn(frame, fps, 41.5);
  const d = popIn(frame, fps, 44.1);
  const dim = interpolate(t, [S5, S5 + 0.5], [0, 0.45], clamp);
  const wobble = Math.sin(t * 3) * 1.5;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${dim})` }} />
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <div style={{ transform: `scale(${a})` }}>
          <Sticker size={58} rotate={-3}>НАПИШИ</Sticker>
        </div>
        <div style={{ transform: `scale(${b}) rotate(${wobble}deg)` }}>
          <Sticker size={150} bg={AF_YELLOW} rotate={2} style={{ letterSpacing: 4 }}>«ТЕСТ»</Sticker>
        </div>
        <div style={{ transform: `scale(${b})` }}>
          <Sticker size={34} bg="rgba(255,255,255,0.9)">💬 в комментариях</Sticker>
        </div>
        <div style={{ transform: `scale(${c})`, marginTop: 30 }}>
          <Sticker size={56} bg={OK_GREEN} rotate={-1}>БЕСПЛАТНЫЙ ПИЛОТ</Sticker>
        </div>
        <div style={{ transform: `scale(${d})` }}>
          <Sticker size={84} bg="#000" color="#fff" rotate={2}>48 ЧАСОВ</Sticker>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- subtitles
type Group = { words: Word[]; s: number; e: number };
const GROUPS: Group[] = (() => {
  const gs: Group[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) gs.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e });
    cur = [];
  };
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    if (cur.length && (cur.length >= 3 || (prev && w.s - prev.e > 0.35))) flush();
    cur.push(w);
    if (/[.,!?]$/.test(w.w)) flush();
  });
  flush();
  return gs;
})();

const cleanWord = (w: string) => w.replace(/^-/, "").replace(/[,.]$/, "");

const Subtitles: React.FC<{ t: number; frame: number; fps: number }> = ({ t, frame, fps }) => {
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.05 && t < (GROUPS[i + 1] ? Math.min(GROUPS[i + 1].s - 0.05, g.e + 0.6) : g.e + 0.8));
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const enter = spring({ frame: frame - sec(g.s - 0.05), fps, config: { damping: 16, stiffness: 220 } });
  const top = t >= S5 ? 1540 : 1450;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 24, rowGap: 16, transform: `translateY(${(1 - enter) * 24}px)`, opacity: Math.min(1, enter * 1.4) }}>
      {g.words.map((w, i) => {
        const active = t >= w.s && t < w.e + 0.08;
        const said = t >= w.s;
        return (
          <span key={`${gi}-${i}`} style={{ fontFamily: SANS, fontWeight: 800, fontSize: 72, lineHeight: 1.1, padding: "4px 18px", borderRadius: 16, background: active ? "#fff" : "transparent", color: active ? "#000" : said ? "#fff" : "rgba(255,255,255,0.55)", textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)", transform: `scale(${active ? 1.06 : 1})` }}>
            {cleanWord(w.w)}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- camera
const cameraAt = (t: number) => {
  // Dolly/pan keyframes in world space. Origin at laptop screen center.
  const T = [0, 3.2, 8.6, S2, S2 + 1.2, 16.0, S3, S3 + 0.8, 30.8, S4, S4 + 1.6, S5, 47];
  const scale = kf(t, T, [1.55, 1.2, 1.22, 1.22, 1.62, 1.68, 1.68, 1.55, 1.6, 1.6, 1.02, 1.04, 1.12]);
  const x = kf(t, T, [-330, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const y = kf(t, T, [420, 40, 30, 30, 20, 10, 10, 20, 20, 20, 60, 60, 60]);
  const rot = kf(t, T, [-4, 0, 0.6, 0.6, 0, -0.4, -0.4, 0, 0, 0, 1.2, 1.2, 0]);
  return { scale, x, y, rot };
};

// ---------------------------------------------------------------- main
export const RealLifePovReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const h = handheld(t);
  const cam = cameraAt(t);
  // extra shake when operator moves (scene transitions)
  const moveShake = [S2, S3, S4].reduce((acc, s) => {
    const d = t - s;
    return acc + (d > 0 && d < 1.2 ? Math.sin(d * 20) * (1.2 - d) * 6 : 0);
  }, 0);

  const blur = afBlur(t) + (t >= S5 ? interpolate(t, [S5, S5 + 0.6], [0, 9], clamp) : 0);
  const exposure = 1 + Math.sin(t * 0.37) * 0.03;

  const fadeIn = interpolate(frame, [0, 18], [0, 1], clamp);
  const fadeOut = interpolate(frame, [TOTAL - 24, TOTAL], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("reallife_pov_reel/voice.mp3")} />

      <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
        {/* camera */}
        <AbsoluteFill
          style={{
            transformOrigin: "540px 830px",
            transform: `translate(${h.x + cam.x + moveShake}px, ${h.y + cam.y + moveShake * 0.6}px) rotate(${h.r + cam.rot}deg) scale(${cam.scale * h.breathe})`,
            filter: `blur(${blur.toFixed(2)}px) brightness(${exposure.toFixed(3)}) contrast(1.06) saturate(0.92)`,
          }}
        >
          <DeskWorld t={t} />
        </AbsoluteFill>

        {/* sensor color cast: cool shadows, warm highlights */}
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(30,40,70,0.18), rgba(60,30,10,0.12))", mixBlendMode: "soft-light" }} />
        <Grain frame={frame} />

        {/* in-world camera UI */}
        <AfBracket t={t} />
        <SceneOverlays t={t} frame={frame} fps={fps} />
        <Cta t={t} frame={frame} fps={fps} />
        <Subtitles t={t} frame={frame} fps={fps} />
        <Hud t={t} frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default RealLifePovReel;
