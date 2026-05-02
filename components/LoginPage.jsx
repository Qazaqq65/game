import { useState, useEffect } from "react";
import { loginWithDevice } from "../utils/deviceAuth";
import { RulesModal } from "./RulesModal";

const RULES_KEY = "acceptedRules";

/* Inject Nunito font + keyframe animations once */
const STYLE_ID = "login-page-styles";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

    @keyframes lp-fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes lp-blobDrift {
      0%,100% { transform: translate(0,0) scale(1); }
      33%      { transform: translate(10px,-12px) scale(1.04); }
      66%      { transform: translate(-8px,8px) scale(0.97); }
    }
    @keyframes lp-shine {
      0%   { left: -80%; }
      100% { left: 120%; }
    }

    .lp-price-btn:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 10px 28px rgba(249,115,22,0.55) !important;
    }
    .lp-price-btn::after {
      content: '';
      position: absolute;
      top: 0; left: -80%;
      width: 60%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
      transform: skewX(-15deg);
      animation: lp-shine 3s ease-in-out infinite;
      pointer-events: none;
    }

    .lp-social-card:hover {
      transform: translateY(-4px) !important;
      box-shadow: 0 8px 22px rgba(0,0,0,0.1) !important;
      border-color: #d9d0c4 !important;
    }
    .lp-social-card:hover .lp-social-strip {
      opacity: 1 !important;
    }

    .lp-login-section:hover {
      background: #e6f0ff !important;
    }

    .lp-submit-btn:hover:not(:disabled) {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 22px rgba(249,115,22,0.5) !important;
    }

    .lp-back:hover {
      color: #6b5e54 !important;
    }
  `;
  document.head.appendChild(el);
}

function FadeUp({ delay = 0, children, style = {} }) {
  return (
    <div style={{
      animation: `lp-fadeUp 0.45s ease both`,
      animationDelay: `${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function StepLabel({ num, text, dim }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
      opacity: dim ? 0.45 : 1,
      transition: "opacity 0.2s",
    }}>
      <span style={{
        width: 22, height: 22,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#ff9433,#f57c1f)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 6px rgba(249,115,22,0.4)",
      }}>{num}</span>
      <span style={{
        background: "#f5f0ea",
        color: "#7a6a5f",
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "3px 10px",
        borderRadius: 20,
      }}>{text}</span>
    </div>
  );
}

export default function LoginPage({ onBack, onSuccess, isModal = false }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage]   = useState("");
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showRules, setShowRules]         = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => { injectStyles(); }, []);

  const handleAccept = (e) => {
    const v = e.target.checked;
    setAccepted(v);
    v ? localStorage.setItem(RULES_KEY, "true") : localStorage.removeItem(RULES_KEY);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(""); setSuccess(false); setLoading(true);
    try {
      const { user } = await loginWithDevice(email, password);
      setSuccess(true);
      setMessage("Сәтті кіру! ✅");
      setTimeout(() => onSuccess?.(user), 700);
    } catch (error) {
      setSuccess(false);
      const map = {
        "auth/user-not-found":      "Пайдаланушы табылмады.",
        "auth/wrong-password":      "Құпия сөз қате.",
        "auth/invalid-email":       "Email форматы қате.",
        "auth/invalid-credential":  "Email немесе құпия сөз қате.",
        "auth/too-many-requests":   "Аккаунт уақытша бұғатталды. Кейінірек көріңіз.",
        "auth/user-disabled":       "Бұл аккаунт өшірілген.",
        "auth/network-request-failed": "Интернет байланысы жоқ.",
        "auth/email-already-in-use":   "Бұл email тіркелген.",
        "auth/weak-password":          "Құпия сөз тым қысқа. Кем дегенде 6 таңба.",
        "auth/missing-email":          "Email енгізіңіз.",
        "auth/missing-password":       "Құпия сөзді енгізіңіз.",
      };
      setMessage(map[error.code] ?? "Қате орын алды. Кейінірек көріңіз.");
    } finally {
      setLoading(false);
    }
  };

  const locked = !accepted;

  const card = (
    <div style={s.card}>

      {/* Decorative blobs */}
      <div style={{ ...s.blob, ...s.blobOrange }} />
      <div style={{ ...s.blob, ...s.blobGreen }} />

      {/* Back + Cat mascot */}
      <FadeUp delay={0}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 4, zIndex: 1 }}>
          {onBack && (
            <div className="lp-back" style={{ ...s.back, marginBottom: 0, position: "absolute", left: 0 }} onClick={onBack}>← Артқа</div>
          )}
          <img
            src={accepted ? "/cat01.svg" : "/cat02.svg"}
            alt="cat"
            style={{ width: 88, height: 88, transition: "all 0.35s ease" }}
          />
        </div>
      </FadeUp>

      {/* Title */}
      <FadeUp delay={50}>
        <h1 style={s.title}>Қош келдіңіз! 👋</h1>
        <p style={s.subtitle}>
          Балаларға арналған интерактивті ойын — қазақ әліпбиін анимация мен дыбыс арқылы үйретеді.
        </p>
      </FadeUp>

      {/* Price */}
      <FadeUp delay={100}>
        <button className="lp-price-btn" style={s.priceBtn}>2 990 ₸</button>
      </FadeUp>

      {/* Step 1 */}
      <FadeUp delay={150}>
        <StepLabel num="1" text="Шарттармен танысыңыз" />
        <label style={{
          ...s.termsBox,
          background: accepted ? "#f0faf5" : "#faf7f3",
          borderColor: accepted ? "#b8ebd4" : "#ece6de",
        }}>
          {/* Custom checkbox */}
          <span style={{
            ...s.customCheck,
            background: accepted ? "linear-gradient(135deg,#34c278,#22a361)" : "#fff",
            borderColor: accepted ? "transparent" : "#c8bfb5",
            boxShadow: accepted ? "0 2px 8px rgba(34,163,97,0.35)" : "none",
          }}>
            {accepted && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          <input
            type="checkbox"
            checked={accepted}
            onChange={handleAccept}
            style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
          />
          <span style={s.termsText}>
            <button type="button" style={s.rulesLink} onClick={() => setShowRules(true)}>
              Қолдану шарттарымен
            </button>{" "}таныстым
          </span>
        </label>
        {!accepted && (
          <p style={s.hint}> Жалғастыру үшін белгі қойыңыз</p>
        )}
      </FadeUp>

      {/* Step 2 */}
      <FadeUp delay={200}>
        <StepLabel num="2" text="Төлем үшін жазыңыз" dim={locked} />
        <div style={{ ...s.socialGrid, opacity: locked ? 0.45 : 1, pointerEvents: locked ? "none" : "auto" }}>
          <a
            href={accepted ? "https://t.me/qazaqq65" : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="lp-social-card"
            style={s.socialCard}
          >
            <img src="/telegram-svgrepo-com.svg" alt="Telegram" width={48} height={48} />
            <span style={s.socialName}>Telegram</span>
            <span style={{ ...s.socialHandle, color: "#229ED9" }}>@qazaqq65</span>
            <span className="lp-social-strip" style={{ ...s.socialStrip, background: "#229ED9" }} />
          </a>
          <a
            href={accepted ? "https://wa.me/77087257147" : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="lp-social-card"
            style={s.socialCard}
          >
            <img src="/whatsapp-svgrepo-com.svg" alt="WhatsApp" width={48} height={48} style={{ borderRadius: 12 }} />
            <span style={s.socialName}>WhatsApp</span>
            <span style={{ ...s.socialHandle, color: "#25d366" }}>+7 708 725 71 47</span>
            <span className="lp-social-strip" style={{ ...s.socialStrip, background: "#25d366" }} />
          </a>
        </div>
      </FadeUp>

      {/* Step 3 */}
      <FadeUp delay={250}>
        <StepLabel num="3" text="Төлегеннен кейін кіріңіз" />

        {!showLoginForm ? (
          <div
            className="lp-login-section"
            style={s.loginSection}
            onClick={() => setShowLoginForm(true)}
          >
            <span style={{ fontSize: 20 }}>🔐</span>
            Аккаунтым бар — Кіру
          </div>
        ) : (
          <form onSubmit={handleLogin} style={s.form}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={s.input}
            />
            <input
              type="password"
              placeholder="Құпия сөз"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={s.input}
            />
            <button
              type="submit"
              disabled={loading}
              className="lp-submit-btn"
              style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Тексеруде..." : "Кіру →"}
            </button>
            {message && (
              <p style={{ ...s.message, color: success ? "#16a34a" : "#dc2626" }}>
                {message}
              </p>
            )}
          </form>
        )}
      </FadeUp>

    </div>
  );

  if (isModal) {
    return (
      <div
        style={s.modalOverlay}
        onClick={(e) => { if (e.target === e.currentTarget) onBack?.(); }}
      >
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        {card}
      </div>
    );
  }

  return (
    <div style={s.page}>
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {/* SVG noise texture */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="lp-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
      </svg>
      <div style={s.noiseMask} aria-hidden />
      {card}
    </div>
  );
}

const s = {
  page: {
    background: "#f0ebe3",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    margin: 0,
    padding: 16,
    boxSizing: "border-box",
    fontFamily: "'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  noiseMask: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
    opacity: 0.04,
    filter: "url(#lp-noise)",
    background: "#888",
  },
  card: {
    position: "relative",
    background: "#ffffff",
    width: "100%",
    maxWidth: 400,
    borderRadius: 28,
    padding: "28px 24px 32px",
    boxShadow: "0 8px 40px rgba(120,90,60,0.13), 0 2px 8px rgba(120,90,60,0.07)",
    boxSizing: "border-box",
    zIndex: 1,
    overflow: "hidden",
    fontFamily: "'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  blob: {
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    animation: "lp-blobDrift 18s ease-in-out infinite",
    zIndex: 0,
  },
  blobOrange: {
    width: 160, height: 160,
    top: -60, right: -50,
    background: "radial-gradient(circle, rgba(255,180,100,0.28) 0%, transparent 70%)",
    animationDelay: "0s",
  },
  blobGreen: {
    width: 140, height: 140,
    bottom: -50, left: -40,
    background: "radial-gradient(circle, rgba(100,220,160,0.22) 0%, transparent 70%)",
    animationDelay: "-6s",
  },
  back: {
    color: "#b0a89e",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 14,
    cursor: "pointer",
    userSelect: "none",
    display: "inline-block",
    transition: "color 0.15s",
    position: "relative",
    zIndex: 1,
  },
  title: {
    margin: "0 0 6px",
    fontSize: 26,
    fontWeight: 900,
    color: "#2d1f16",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
    fontFamily: "'Nunito', sans-serif",
  },
  subtitle: {
    color: "#9b9190",
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 1.6,
    position: "relative",
    zIndex: 1,
    fontWeight: 600,
  },
  priceBtn: {
    background: "linear-gradient(135deg, #ff9433 0%, #f57c1f 100%)",
    color: "#fff",
    fontSize: 30,
    fontWeight: 900,
    padding: "16px",
    borderRadius: 18,
    marginBottom: 22,
    boxShadow: "0 6px 20px rgba(249,115,22,0.4)",
    textAlign: "center",
    letterSpacing: "0.5px",
    border: "none",
    width: "100%",
    cursor: "default",
    position: "relative",
    overflow: "hidden",
    display: "block",
    transition: "transform 0.2s, box-shadow 0.2s",
    fontFamily: "'Nunito', sans-serif",
  },
  termsBox: {
    border: "1.5px solid",
    padding: "12px 14px",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
    cursor: "pointer",
    transition: "all 0.2s",
    position: "relative",
    zIndex: 1,
  },
  customCheck: {
    width: 20, height: 20,
    borderRadius: 6,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
    cursor: "pointer",
  },
  termsText: {
    fontSize: 13,
    color: "#4a3f38",
    lineHeight: 1.4,
    fontWeight: 600,
  },
  rulesLink: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#f57c1f",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 2,
    fontFamily: "'Nunito', sans-serif",
  },
  hint: {
    margin: "4px 0 14px",
    fontSize: 12,
    color: "#e05a2b",
    textAlign: "center",
    fontWeight: 700,
  },
  socialGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 20,
    transition: "opacity 0.2s",
    position: "relative",
    zIndex: 1,
  },
  socialCard: {
    background: "#faf7f3",
    border: "1.5px solid #ece6de",
    padding: "16px 12px 14px",
    borderRadius: 18,
    boxShadow: "0 2px 8px rgba(120,90,60,0.07)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    textDecoration: "none",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
    position: "relative",
    overflow: "hidden",
  },
  socialIconWrap: {
    width: 46, height: 46,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
  },
  socialName: {
    display: "block",
    fontWeight: 800,
    fontSize: 14,
    color: "#2d1f16",
    fontFamily: "'Nunito', sans-serif",
  },
  socialHandle: {
    fontSize: 12,
    fontWeight: 700,
  },
  socialStrip: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 3,
    opacity: 0,
    transition: "opacity 0.2s",
    borderRadius: "0 0 16px 16px",
  },
  loginSection: {
    background: "#fffaf5",
    border: "1.5px solid #f0e6d8",
    padding: "15px 20px",
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontWeight: 800,
    fontSize: 15,
    color: "#5a3e2b",
    transition: "background 0.2s",
    userSelect: "none",
    cursor: "pointer",
    position: "relative",
    zIndex: 1,
    fontFamily: "'Nunito', sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 4,
    position: "relative",
    zIndex: 1,
  },
  input: {
    padding: "13px 16px",
    fontSize: 15,
    borderRadius: 14,
    border: "1.5px solid #e8e0d8",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    color: "#2d1f16",
    background: "#faf7f3",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 600,
  },
  submitBtn: {
    padding: "14px",
    fontSize: 16,
    fontWeight: 900,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #ff9433 0%, #f57c1f 100%)",
    color: "#fff",
    width: "100%",
    boxShadow: "0 5px 16px rgba(249,115,22,0.4)",
    cursor: "pointer",
    letterSpacing: "0.03em",
    transition: "transform 0.2s, box-shadow 0.2s, opacity 0.15s",
    fontFamily: "'Nunito', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  message: {
    margin: 0,
    fontSize: 13,
    textAlign: "center",
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(60,40,20,0.45)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: 16,
    overflowY: "auto",
  },
};
