import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

let telegramUser;
let settings = {
  watchReward: 1,
  dailyAdLimit: 20,
  referralReward: 5,
  minimumWithdraw: 100,
  minimumReferrals: 5
};

const $ = id => document.getElementById(id);

async function init() {
  await signInAnonymously(auth);
  telegramUser = tg?.initDataUnsafe?.user || {
    id: "demo_" + Date.now(),
    first_name: "Demo",
    username: "demo_user"
  };

  $("welcome").textContent = `Hi, ${telegramUser.first_name || "there"} 👋`;
  await loadSettings();
  await loadUser();
  await loadHistory();
  await updateUI();
}

async function loadSettings() {
  const snap = await getDoc(doc(db, "settings", "appSettings"));
  if (snap.exists()) settings = { ...settings, ...snap.data() };
}

async function loadUser() {
  const firebaseUid = auth.currentUser.uid;
  const ref = doc(db, "users", firebaseUid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      telegramId: String(telegramUser.id),
      firebaseUid,
      username: telegramUser.username || "",
      firstName: telegramUser.first_name || "",
      balance: 0,
      totalEarned: 0,
      referralCount: 0,
      status: "active",
      createdAt: serverTimestamp()
    });
  }
}

async function loadHistory() {
  const firebaseUid = auth.currentUser.uid;
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", firebaseUid),
    orderBy("createdAt", "desc"),
    limit(30)
  );

  try {
    const ss = await getDocs(q);
    const box = $("historyList");
    box.innerHTML = "";
    ss.forEach(d => {
      const x = d.data();
      box.innerHTML += `<div class="item"><span>${x.type || "Transaction"}<br><small>${x.status || ""}</small></span><b>₹${Number(x.amount || 0).toFixed(2)}</b></div>`;
    });
    if (!box.children.length) {
      box.innerHTML = '<div class="card muted">No transactions yet.</div>';
    }
  } catch (e) {
    $("historyList").innerHTML =
      '<div class="card muted">No transaction history available yet.</div>';
  }
}

async function updateUI() {
  const firebaseUid = auth.currentUser.uid;
  const snap = await getDoc(doc(db, "users", firebaseUid));
  const data = snap.data() || {};
  const balance = Number(data.balance || 0);

  $("balance").textContent = balance.toFixed(2);
  $("withdrawBalance").textContent = balance.toFixed(2);
  $("watchReward").textContent = settings.watchReward;
  $("refReward").textContent = settings.referralReward;
  $("minWithdraw").textContent = settings.minimumWithdraw;
  $("minRefs").textContent = settings.minimumReferrals;
  $("amount").min = settings.minimumWithdraw;

  const botUsername = "YOUR_BOT_USERNAME";
  $("refLink").value =
    `https://t.me/${botUsername}?start=ref_${telegramUser.id}`;

  $("watchStatus").textContent =
    `Today's limit: ${settings.dailyAdLimit} ads`;
}

document.querySelectorAll(".nav button").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    $(button.dataset.page).classList.add("active");
  };
});

$("copyRef").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("refLink").value);
    $("copyRef").textContent = "Copied ✓";
  } catch {}
};

// Real ad rewards must NOT be credited by a browser timer.
// They will be added later through a trusted backend after a
// verified ad completion/callback permitted by the ad network.
$("watchBtn").onclick = () => {
  $("watchStatus").textContent =
    "Ad integration pending. No balance is credited by this demo button.";
};

$("method").onchange = () => {
  const upi = $("method").value === "upi";
  $("upiLabel").textContent = upi ? "UPI ID" : "Redeem Code";
  $("upiId").placeholder = upi ? "example@upi" : "Optional code/details";
};

$("withdrawBtn").onclick = () => {
  $("withdrawStatus").textContent =
    "Secure withdrawal backend is pending. Real withdrawals are not processed by this demo.";
};

init().catch(error => {
  console.error(error);
  $("watchStatus").textContent =
    "Firebase connection error — check Firebase Authentication and Firestore Rules.";
});
