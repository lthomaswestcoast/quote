import React, { useState, useMemo } from "react";

// Olive Grove Events — Internal Quote Generator
// Pricing:
//   Chairs $4 ea, Tables $9 ea, Tablecloths $5 ea, Napkins $1 ea,
//   Plate chargers $2 ea, A-board signs $45 ea,
//   Cutlery $1/set up to 94; 95+ sets = flat $75 bundle
// Delivery: Local = $100 flat ($50 each way). Out of town = $2/km round-trip total.
// Deposit (refundable, per-item): Chairs $2/ea, Tables $5/ea. Nothing else.

const ITEMS = [
  { key: "chairs", label: "Chairs", unit: 4, note: "$4 each", deposit: 2 },
  { key: "tables", label: "Tables", unit: 9, note: "$9 each", deposit: 5 },
  { key: "tablecloths", label: "Tablecloths", unit: 5, note: "$5 each", deposit: 0 },
  { key: "napkins", label: "Napkins", unit: 1, note: "$1 each", deposit: 0 },
  { key: "chargers", label: "Plate chargers", unit: 2, note: "$2 each", deposit: 0 },
  { key: "signs", label: "A-board signs", unit: 45, note: "$45 each", deposit: 0 },
];

const money = (n) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

const CUTLERY_UNIT = 1;
const CUTLERY_BUNDLE = 75;
const CUTLERY_BUNDLE_AT = 95;

export default function QuoteGenerator() {
  const [qty, setQty] = useState({
    chairs: "",
    tables: "",
    tablecloths: "",
    napkins: "",
    chargers: "",
    signs: "",
    cutlery: "",
  });
  const [delivery, setDelivery] = useState("none"); // none | local | out
  const [km, setKm] = useState("");
  const [customer, setCustomer] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [copied, setCopied] = useState(false);

  const num = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const lines = useMemo(() => {
    const out = [];
    for (const it of ITEMS) {
      const n = num(qty[it.key]);
      if (n > 0) out.push({ label: it.label, detail: `${n} × ${money(it.unit)}`, amount: n * it.unit });
    }
    const c = num(qty.cutlery);
    if (c > 0) {
      if (c >= CUTLERY_BUNDLE_AT) {
        out.push({ label: "Cutlery", detail: `${c} sets (95+ bundle)`, amount: CUTLERY_BUNDLE });
      } else {
        out.push({ label: "Cutlery", detail: `${c} × ${money(CUTLERY_UNIT)}`, amount: c * CUTLERY_UNIT });
      }
    }
    return out;
  }, [qty]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.amount, 0), [lines]);

  // Refundable deposit: per-item. Chairs $2, Tables $5, nothing else.
  const depositLines = useMemo(() => {
    const out = [];
    for (const it of ITEMS) {
      if (!it.deposit) continue;
      const n = num(qty[it.key]);
      if (n > 0) out.push({ label: it.label, detail: `${n} × ${money(it.deposit)}`, amount: n * it.deposit });
    }
    return out;
  }, [qty]);

  const deposit = useMemo(() => depositLines.reduce((s, l) => s + l.amount, 0), [depositLines]);

  const deliveryCost = useMemo(() => {
    if (delivery === "local") return 100;
    if (delivery === "out") {
      const k = parseFloat(km);
      return Number.isFinite(k) && k > 0 ? k * 2 : 0;
    }
    return 0;
  }, [delivery, km]);

  const total = subtotal + deliveryCost;

  const quoteText = useMemo(() => {
    const rows = lines.map((l) => `  ${l.label} (${l.detail}): ${money(l.amount)}`);
    const parts = [];
    parts.push("OLIVE GROVE EVENTS — QUOTE");
    if (customer) parts.push(`Customer: ${customer}`);
    if (eventDate) parts.push(`Event date: ${eventDate}`);
    parts.push("");
    parts.push("Items:");
    parts.push(...rows);
    parts.push("");
    parts.push(`Subtotal: ${money(subtotal)}`);
    if (delivery === "local") parts.push(`Delivery (local, round trip): ${money(100)}`);
    if (delivery === "out") parts.push(`Delivery (${km || 0} km round trip @ $2/km): ${money(deliveryCost)}`);
    parts.push(`Total: ${money(total)}`);
    parts.push("");
    if (deposit > 0) {
      const dRows = depositLines.map((l) => `  ${l.label} (${l.detail}): ${money(l.amount)}`);
      parts.push("Refundable damage deposit:");
      parts.push(...dRows);
      parts.push(`  Deposit total: ${money(deposit)}`);
    } else {
      parts.push("Refundable damage deposit: none");
    }
    return parts.join("\n");
  }, [lines, customer, eventDate, subtotal, delivery, km, deliveryCost, total, deposit, depositLines]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(quoteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const hasItems = lines.length > 0;

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.mark}>OG</div>
          <div>
            <h1 style={styles.h1}>Olive Grove Events</h1>
            <p style={styles.sub}>Quote generator · internal</p>
          </div>
        </header>

        <div style={styles.grid}>
          {/* LEFT: inputs */}
          <section style={styles.panel}>
            <h2 style={styles.h2}>Items</h2>
            <div style={styles.itemList}>
              {ITEMS.map((it) => (
                <div key={it.key} style={styles.itemRow}>
                  <label style={styles.itemLabel}>
                    {it.label}
                    <span style={styles.itemNote}>
                      {it.note}
                      {it.deposit ? ` · ${money(it.deposit)} deposit` : ""}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="0"
                    value={qty[it.key]}
                    onChange={(e) => setQty({ ...qty, [it.key]: e.target.value })}
                    style={styles.qtyInput}
                  />
                </div>
              ))}
              <div style={styles.itemRow}>
                <label style={styles.itemLabel}>
                  Cutlery
                  <span style={styles.itemNote}>$1/set · 95+ = $75 flat</span>
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="0"
                  value={qty.cutlery}
                  onChange={(e) => setQty({ ...qty, cutlery: e.target.value })}
                  style={styles.qtyInput}
                />
              </div>
            </div>

            <h2 style={{ ...styles.h2, marginTop: 26 }}>Delivery</h2>
            <div style={styles.segment}>
              {[
                { v: "none", t: "None" },
                { v: "local", t: "Local · $100" },
                { v: "out", t: "Out of town" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setDelivery(o.v)}
                  style={{
                    ...styles.segBtn,
                    ...(delivery === o.v ? styles.segBtnActive : {}),
                  }}
                >
                  {o.t}
                </button>
              ))}
            </div>
            {delivery === "out" && (
              <div style={styles.kmRow}>
                <label style={styles.kmLabel}>Round-trip distance (km)</label>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder="e.g. 48"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  style={styles.kmInput}
                />
                <span style={styles.kmHint}>@ $2/km = {money(deliveryCost)}</span>
              </div>
            )}

            <h2 style={{ ...styles.h2, marginTop: 26 }}>Record (optional)</h2>
            <input
              type="text"
              placeholder="Customer name"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              style={styles.textInput}
            />
            <input
              type="text"
              placeholder="Event date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              style={{ ...styles.textInput, marginTop: 8 }}
            />
          </section>

          {/* RIGHT: quote */}
          <section style={styles.quotePanel}>
            <h2 style={styles.h2}>Quote</h2>
            {!hasItems ? (
              <p style={styles.empty}>Add item quantities to build a quote.</p>
            ) : (
              <>
                <div style={styles.breakdown}>
                  {lines.map((l, i) => (
                    <div key={i} style={styles.bRow}>
                      <div>
                        <div style={styles.bLabel}>{l.label}</div>
                        <div style={styles.bDetail}>{l.detail}</div>
                      </div>
                      <div style={styles.bAmount}>{money(l.amount)}</div>
                    </div>
                  ))}
                </div>

                <div style={styles.totals}>
                  <div style={styles.tRow}>
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  {delivery !== "none" && (
                    <div style={styles.tRow}>
                      <span>Delivery {delivery === "out" ? `(${km || 0} km)` : "(local)"}</span>
                      <span>{money(deliveryCost)}</span>
                    </div>
                  )}
                  <div style={{ ...styles.tRow, ...styles.tTotal }}>
                    <span>Total</span>
                    <span>{money(total)}</span>
                  </div>
                </div>

                <div style={styles.depositBox}>
                  <div style={styles.depositHead}>Refundable damage deposit</div>
                  {deposit > 0 ? (
                    <>
                      {depositLines.map((l, i) => (
                        <div key={i} style={styles.depRow}>
                          <span style={styles.depDetail}>{l.label} · {l.detail}</span>
                          <span>{money(l.amount)}</span>
                        </div>
                      ))}
                      <div style={styles.depTotalRow}>
                        <span>Deposit total</span>
                        <span style={styles.depAmount}>{money(deposit)}</span>
                      </div>
                    </>
                  ) : (
                    <div style={styles.depNone}>No deposit on these items</div>
                  )}
                </div>

                <button onClick={copy} style={styles.copyBtn}>
                  {copied ? "Copied ✓" : "Copy quote"}
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const olive = "#5A6B3B";
const oliveDark = "#3E4A28";
const cream = "#F5F3EC";
const ink = "#2B2E26";
const line = "#E2DFD4";

const styles = {
  page: {
    minHeight: "100vh",
    background: cream,
    padding: "24px 16px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: ink,
    boxSizing: "border-box",
  },
  shell: { maxWidth: 880, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 22 },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: olive,
    color: cream,
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: 0.5,
  },
  h1: { fontSize: 22, margin: 0, fontWeight: 700, color: oliveDark },
  sub: { margin: "2px 0 0", fontSize: 13, color: "#8A8B7E" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  panel: {
    background: "#FFF",
    borderRadius: 16,
    padding: 20,
    border: `1px solid ${line}`,
  },
  quotePanel: {
    background: "#FFF",
    borderRadius: 16,
    padding: 20,
    border: `1px solid ${line}`,
    alignSelf: "start",
    position: "sticky",
    top: 16,
  },
  h2: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: olive,
    margin: "0 0 12px",
    fontWeight: 700,
  },
  itemList: { display: "flex", flexDirection: "column", gap: 8 },
  itemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  itemLabel: { display: "flex", flexDirection: "column", fontSize: 15, fontWeight: 600 },
  itemNote: { fontSize: 12, color: "#9A9B8D", fontWeight: 400, marginTop: 1 },
  qtyInput: {
    width: 74,
    padding: "9px 10px",
    borderRadius: 9,
    border: `1px solid ${line}`,
    fontSize: 15,
    textAlign: "center",
    outline: "none",
    background: cream,
  },
  segment: { display: "flex", gap: 6 },
  segBtn: {
    flex: 1,
    padding: "9px 6px",
    borderRadius: 9,
    border: `1px solid ${line}`,
    background: "#FFF",
    fontSize: 13,
    fontWeight: 600,
    color: "#77786B",
    cursor: "pointer",
  },
  segBtnActive: { background: olive, color: "#FFF", borderColor: olive },
  kmRow: { marginTop: 12, display: "flex", flexDirection: "column", gap: 6 },
  kmLabel: { fontSize: 13, fontWeight: 600 },
  kmInput: {
    padding: "9px 10px",
    borderRadius: 9,
    border: `1px solid ${line}`,
    fontSize: 15,
    outline: "none",
    background: cream,
  },
  kmHint: { fontSize: 12, color: olive, fontWeight: 600 },
  textInput: {
    width: "100%",
    padding: "9px 10px",
    borderRadius: 9,
    border: `1px solid ${line}`,
    fontSize: 14,
    outline: "none",
    background: cream,
    boxSizing: "border-box",
  },
  empty: { fontSize: 14, color: "#9A9B8D", margin: "8px 0 0" },
  breakdown: { display: "flex", flexDirection: "column", gap: 2 },
  bRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "9px 0",
    borderBottom: `1px solid ${line}`,
  },
  bLabel: { fontSize: 15, fontWeight: 600 },
  bDetail: { fontSize: 12, color: "#9A9B8D", marginTop: 1 },
  bAmount: { fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  totals: { marginTop: 14, display: "flex", flexDirection: "column", gap: 8 },
  tRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    fontVariantNumeric: "tabular-nums",
  },
  tTotal: {
    fontSize: 19,
    fontWeight: 700,
    color: oliveDark,
    paddingTop: 8,
    borderTop: `2px solid ${oliveDark}`,
    marginTop: 4,
  },
  depositBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    background: cream,
    border: `1px solid ${line}`,
  },
  depositHead: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: olive,
    fontWeight: 700,
    marginBottom: 8,
  },
  depRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    padding: "3px 0",
    fontVariantNumeric: "tabular-nums",
  },
  depDetail: { color: "#77786B" },
  depTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 15,
    fontWeight: 700,
    marginTop: 6,
    paddingTop: 6,
    borderTop: `1px solid ${line}`,
    fontVariantNumeric: "tabular-nums",
  },
  depAmount: { color: oliveDark },
  depNone: { fontSize: 13, color: "#9A9B8D" },
  copyBtn: {
    marginTop: 18,
    width: "100%",
    padding: "12px",
    borderRadius: 11,
    border: "none",
    background: oliveDark,
    color: cream,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
};
