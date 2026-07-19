import React, { useState, useMemo } from "react";

// Olive Grove Events — Internal Quote Generator
// Pricing:
//   Chairs $4 ea, Tables $9 ea, Tablecloths $5 ea, Napkins $1 ea,
//   Plate chargers $2 ea, A-board signs $45 ea,
//   Cutlery $1/set up to 94; 95+ sets = flat $75 bundle
// Delivery: Local = $100 flat round trip. Out of town = $2/km round-trip total.
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
    // Cutlery special rule
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

  const setField = (key, val) => setQty((q) => ({ ...q, [key]: val }));

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
                      {it.deposit ? ` · $${it.deposit} dep` : ""}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="0"
                    value={qty[it.key]}
                    onChange={(e) => setField(it.key, e.target.value)}
                    style={styles.qtyInput}
                  />
                </div>
              ))}
              {/* Cutlery */}
              <div style={styles.itemRow}>
                <label style={styles.itemLabel}>
                  Cutlery
                  <span style={styles.itemNote}>$1/set · $75 flat at 95+</span>
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="0"
                  value={qty.cutlery}
                  onChange={(e) => setField("cutlery", e.target.value)}
                  style={styles.qtyInput}
                />
              </div>
            </div>

            <h2 style={{ ...styles.h2, marginTop: 26 }}>Delivery</h2>
            <div style={styles.seg}>
              {[
                { v: "none", t: "None" },
                { v: "local", t: "Local ($100)" },
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
                          <span>{l.label} ({l.detail})</span>
                          <span>{money(l.amount)}</span>
                        </div>
                      ))}
                      <div style={{ ...styles.depRow, ...styles.depTotal }}>
                        <span>Deposit total</span>
                        <span>{money(deposit)}</span>
                      </div>
                    </>
                  ) : (
                    <div style={styles.depNone}>None</div>
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F5F3EC",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#2A2E22",
    padding: "20px 14px 60px",
    boxSizing: "border-box",
  },
  shell: { maxWidth: 900, margin: "0 auto" },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  mark: {
    width: 46,
    height: 46,
    borderRadius: 12,
    background: "#3E4A28",
    color: "#EDE7D3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    letterSpacing: 0.5,
    fontSize: 17,
  },
  h1: { margin: 0, fontSize: 22, fontWeight: 700 },
  sub: { margin: "2px 0 0", fontSize: 13, color: "#7A7C6C" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  },
  panel: {
    background: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    border: "1px solid #E6E2D3",
  },
  quotePanel: {
    background: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    border: "1px solid #E6E2D3",
  },
  h2: { margin: "0 0 12px", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "#3E4A28" },
  itemList: { display: "flex", flexDirection: "column", gap: 10 },
  itemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  itemLabel: { display: "flex", flexDirection: "column", fontSize: 15, fontWeight: 600 },
  itemNote: { fontSize: 12, color: "#8A8C7A", fontWeight: 400, marginTop: 2 },
  qtyInput: {
    width: 78,
    padding: "9px 10px",
    borderRadius: 10,
    border: "1px solid #D8D3C2",
    fontSize: 15,
    textAlign: "right",
    background: "#FBFAF5",
    boxSizing: "border-box",
  },
  seg: { display: "flex", gap: 8, flexWrap: "wrap" },
  segBtn: {
    flex: "1 1 auto",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #D8D3C2",
    background: "#FBFAF5",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    color: "#2A2E22",
  },
  segBtnActive: {
    background: "#3E4A28",
    color: "#EDE7D3",
    borderColor: "#3E4A28",
  },
  kmRow: { marginTop: 12, display: "flex", flexDirection: "column", gap: 6 },
  kmLabel: { fontSize: 13, color: "#7A7C6C" },
  kmInput: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #D8D3C2",
    fontSize: 15,
    background: "#FBFAF5",
    boxSizing: "border-box",
  },
  kmHint: { fontSize: 13, color: "#3E4A28", fontWeight: 600 },
  textInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #D8D3C2",
    fontSize: 15,
    background: "#FBFAF5",
    boxSizing: "border-box",
  },
  empty: { fontSize: 14, color: "#9A9C8A", padding: "20px 0" },
  breakdown: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 },
  bRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bLabel: { fontSize: 15, fontWeight: 600 },
  bDetail: { fontSize: 12, color: "#8A8C7A", marginTop: 2 },
  bAmount: { fontSize: 15, fontWeight: 600 },
  totals: {
    borderTop: "1px solid #E6E2D3",
    paddingTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  tRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    color: "#4A4E3E",
  },
  tTotal: { fontSize: 18, fontWeight: 700, color: "#2A2E22", marginTop: 4 },
  depositBox: {
    marginTop: 16,
    background: "#F0EEE2",
    borderRadius: 12,
    padding: 14,
    border: "1px solid #E0DCC9",
  },
  depositHead: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#3E4A28",
    marginBottom: 8,
  },
  depRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    color: "#4A4E3E",
    marginTop: 4,
  },
  depTotal: { fontWeight: 700, color: "#2A2E22", borderTop: "1px solid #DAD5C2", paddingTop: 6, marginTop: 6 },
  depNone: { fontSize: 14, color: "#8A8C7A" },
  copyBtn: {
    marginTop: 18,
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    border: "none",
    background: "#3E4A28",
    color: "#EDE7D3",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
};
