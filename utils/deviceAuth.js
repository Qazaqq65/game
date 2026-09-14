import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const DEVICE_ID_KEY = "kzgame_device_id";

/** Собирает отпечаток браузера */
export function getFingerprint() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen: `${window.screen.width}x${window.screen.height}`,
  };
}

/** Генерирует UUID — с фолбэком для старых браузеров */
function generateUUID() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // фолбэк через getRandomValues
  if (typeof crypto?.getRandomValues === "function") {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => {
      const n = parseInt(c, 10);
      return (n ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
    });
  }
  // крайний фолбэк через Math.random
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Возвращает deviceId из localStorage, если нет — создаёт новый */
function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** Считает количество совпадений между двумя fingerprint-объектами */
function countFingerprintMatches(fpA, fpB) {
  if (!fpA || !fpB) return 0;
  return Object.keys(fpA).filter((key) => fpA[key] === fpB[key]).length;
}

/**
 * Проверяет устройство после входа.
 * Возвращает { allowed: boolean, reason?: string }
 */
export async function checkDevice(uid) {
  const deviceId = getOrCreateDeviceId();
  const fingerprint = getFingerprint();
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  // --- Первый вход: документ не существует ---
  if (!snap.exists()) {
    await setDoc(userRef, {
      role: "user",
      deviceId,
      fingerprint,
      status: "active",
      suspiciousScore: 0,
      createdAt: serverTimestamp(),
    });
    return { allowed: true };
  }

  const data = snap.data();

  // --- Аккаунт заблокирован ---
  if (data.status === "temp_block") {
    return { allowed: false, reason: "Аккаунт временно заблокирован. Обратитесь к администратору." };
  }

  // --- deviceId совпадает — всё ок ---
  if (data.deviceId === deviceId) {
    return { allowed: true };
  }

  // --- deviceId не совпадает — проверяем fingerprint ---
  const matches = countFingerprintMatches(fingerprint, data.fingerprint);

  if (matches >= 3) {
    // Похоже на тот же браузер (очищен localStorage) — обновляем deviceId
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    await updateDoc(userRef, { deviceId, fingerprint });
    return { allowed: true };
  }

  // --- Другое устройство — увеличиваем suspiciousScore ---
  const newScore = (data.suspiciousScore ?? 0) + 1;
  const newStatus = newScore >= 3 ? "temp_block" : data.status;

  await updateDoc(userRef, {
    suspiciousScore: newScore,
    status: newStatus,
  });

  if (newStatus === "temp_block") {
    return { allowed: false, reason: "Аккаунт заблокирован: слишком много входов с разных устройств." };
  }

  return {
    allowed: false,
    reason: `Вход с другого устройства запрещён. Предупреждение ${newScore}/3.`,
  };
}

/**
 * Полный flow: вход + проверка устройства.
 * Возвращает { user } при успехе или выбрасывает Error.
 */
export async function loginWithDevice(email, password) {
  if (!auth || !db) {
    throw new Error("Кіру қазір қолжетімсіз.");
  }
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const { user } = credential;

  try {
    const { allowed, reason } = await checkDevice(user.uid);
    if (!allowed) {
      throw new Error(reason);
    }
    return { user };
  } catch (err) {
    // Гарантированно выходим из Firebase при любой ошибке проверки устройства
    await signOut(auth);
    throw err;
  }
}
