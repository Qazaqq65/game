import { useEffect } from "react";

export function RulesModal({ onClose }) {
  // Закрытие по Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.title}>Пайдалану шарттары</h2>
          <button style={s.closeBtn} onClick={onClose} aria-label="Жабу">✕</button>
        </div>

        <div style={s.body}>
          <p style={s.intro}>
            Балаларға арналған әліпби ойынына қош келдіңіз!<br />
            Аккаунтты сатып алмас бұрын осы шарттармен танысыңыз.
          </p>

          <div style={s.section}>
            <div style={s.sectionTitle}><span style={s.num}>1</span> Аккаунт туралы</div>
            <p style={s.sectionText}>
              Аккаунт тек жеке пайдалануға арналған.<br />
              Логин мен парольді басқа адамдарға беруге немесе сатуға тыйым салынады.
            </p>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}><span style={s.num}>2</span> Құрылғылар</div>
            <p style={s.sectionText}>
              Аккаунт шектеулі құрылғылар санында пайдалануға арналған.<br />
              Құрылғы ауыстырған жағдайда бізге хабарласыңыз — көмектесеміз.
            </p>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}><span style={s.num}>3</span> Төлем</div>
            <p style={s.sectionText}>
              Төлем жасалғаннан кейін логин мен пароль WhatsApp немесе Telegram арқылы жіберіледі.<br />
              Сандық өнім болғандықтан, төленген қаражат қайтарылмайды.
            </p>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}><span style={s.num}>4</span> Бұғаттау</div>
            <p style={s.sectionText}>
              Ережелерді бұзған жағдайда аккаунт уақытша немесе толық бұғатталуы мүмкін.
            </p>
          </div>

          <div style={{ ...s.section, marginBottom: 0 }}>
            <div style={s.sectionTitle}><span style={s.num}>5</span> Байланыс</div>
            <p style={s.sectionText}>
              Сұрақтарыңыз болса — WhatsApp немесе Telegram арқылы хабарласыңыз.
            </p>
          </div>
        </div>

        <div style={s.footer}>
          <button style={s.footerBtn} onClick={onClose}>Түсіндім, жабу</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 480,
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px 16px",
    borderBottom: "1px solid #f1f5f9",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#94a3b8",
    cursor: "pointer",
    padding: 4,
    lineHeight: 1,
  },
  body: {
    padding: "16px 24px",
    overflowY: "auto",
    flex: 1,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#334155",
    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
  },
  intro: {
    background: "#fff8f3",
    border: "1px solid #ffe0c0",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 18,
    color: "#7a4a1a",
    fontWeight: 600,
    fontSize: 13,
    lineHeight: 1.7,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 800,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 5,
    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
  },
  num: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#ff9433,#f57c1f)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(249,115,22,0.35)",
  },
  sectionText: {
    margin: 0,
    paddingLeft: 30,
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.7,
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid #f1f5f9",
    flexShrink: 0,
  },
  footerBtn: {
    width: "100%",
    padding: "12px 0",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#ff9433,#f57c1f)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
    boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
  },
};
