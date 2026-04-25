interface AuthGateModalProps {
  onLogin: () => void;
  onClose: () => void;
}

export function AuthGateModal({ onLogin, onClose }: AuthGateModalProps) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose} aria-label="Жабу">✕</button>

        <div style={s.icon}>🔒</div>
        <h2 style={s.title}>Аккаунт қажет</h2>
        <p style={s.desc}>
          Ойнау үшін жеке аккаунт қажет.
          <br />
          Маған жазыңыз — мен сізге аккаунт ашып беремін.
        </p>

        <div style={s.contacts}>
          <a
            href="https://t.me/qazaqq65"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...s.contactBtn, ...s.tg }}
          >
            <span style={s.contactIcon}>✈️</span>
            Telegram
          </a>

          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...s.contactBtn, ...s.wa }}
          >
            <span style={s.contactIcon}>📱</span>
            WhatsApp
          </a>
        </div>

        <div style={s.divider}>
          <span style={s.dividerText}>аккаунтым бар ма?</span>
        </div>

        <button style={s.loginBtn} onClick={onLogin}>
          Кіру
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 20,
    padding: "32px 28px 28px",
    width: "100%",
    maxWidth: 340,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#94a3b8",
    cursor: "pointer",
    lineHeight: 1,
    padding: 4,
  },
  icon: {
    fontSize: 44,
    lineHeight: 1,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "#1e293b",
    textAlign: "center",
  },
  desc: {
    margin: 0,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.6,
  },
  contacts: {
    display: "flex",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  contactBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "11px 0",
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: "none",
    cursor: "pointer",
  },
  tg: {
    background: "#e8f4fd",
    color: "#0088cc",
  },
  wa: {
    background: "#e8f8f0",
    color: "#25d366",
  },
  contactIcon: {
    fontSize: 18,
  },
  divider: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "4px 0",
  },
  dividerText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#94a3b8",
  },
  loginBtn: {
    width: "100%",
    padding: "11px 0",
    borderRadius: 12,
    border: "1.5px solid #e2e8f0",
    background: "#fff",
    color: "#1e293b",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
};
