import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
const tg=window.Telegram?.WebApp;
tg?.ready(); tg?.expand();

let user, settings={watchReward:1,dailyAdLimit:20,referralReward:5,minimumWithdraw:100,minimumReferrals:5};

const $=id=>document.getElementById(id);
function telegramUser(){
  const u=tg?.initDataUnsafe?.user;
  return u || {id:"demo_"+Date.now(),first_name:"Demo",username:"demo_user"};
}
async function init(){
  await signInAnonymously(auth);
  user=telegramUser();
  $("welcome").textContent=`Hi, ${user.first_name||"there"} 👋`;
  await loadSettings();
  await loadUser();
  await loadHistory();
  updateUI();
}
async function loadSettings(){
  const s=await getDoc(doc(db,"settings","appSettings"));
  if(s.exists()) settings={...settings,...s.data()};
}
async function loadUser(){
  const ref=doc(db,"users",String(user.id)); const snap=await getDoc(ref);
  if(!snap.exists()) await setDoc(ref,{telegramId:String(user.id),username:user.username||"",firstName:user.first_name||"",balance:0,totalEarned:0,referralCount:0,status:"active",createdAt:serverTimestamp()});
}
async function loadHistory(){
  const q=query(collection(db,"transactions"),where("userId","==",String(user.id)),orderBy("createdAt","desc"),limit(30));
  try{
    const ss=await getDocs(q), box=$("historyList"); box.innerHTML="";
    ss.forEach(d=>{const x=d.data(); box.innerHTML+=`<div class="item"><span>${x.type||"Transaction"}<br><small>${x.status||""}</small></span><b>₹${Number(x.amount||0).toFixed(2)}</b></div>`});
    if(!box.children.length) box.innerHTML='<div class="card muted">No transactions yet.</div>';
  }catch(e){$("historyList").innerHTML='<div class="card muted">History will appear after secure backend setup.</div>'}
}
async function updateUI(){
  const s=await getDoc(doc(db,"users",String(user.id))), d=s.data()||{}, bal=Number(d.balance||0);
  $("balance").textContent=bal.toFixed(2); $("withdrawBalance").textContent=bal.toFixed(2);
  $("watchReward").textContent=settings.watchReward; $("refReward").textContent=settings.referralReward;
  $("minWithdraw").textContent=settings.minimumWithdraw; $("minRefs").textContent=settings.minimumReferrals;
  $("amount").min=settings.minimumWithdraw;
  const botUsername="YOUR_BOT_USERNAME";
  $("refLink").value=`https://t.me/${botUsername}?start=ref_${user.id}`;
  $("watchStatus").textContent=`Today's limit: ${settings.dailyAdLimit} ads`;
}
document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(b.dataset.page).classList.add("active")});
$("copyRef").onclick=async()=>{try{await navigator.clipboard.writeText($("refLink").value);$("copyRef").textContent="Copied ✓"}catch(e){}};

// DEVELOPMENT ONLY: do not credit rewards from a client-side timer.
// Real reward credit must be performed after a verified ad completion callback
// through a trusted server/Cloud Function and the ad network's permitted flow.
$("watchBtn").onclick=()=>{$("watchStatus").textContent="Ad integration pending. No balance is credited by this demo button."};

$("method").onchange=()=>{$("upiLabel").textContent=$("method").value==="upi"?"UPI ID":"Redeem Code";$("upiId").placeholder=$("method").value==="upi"?"example@upi":"Optional code/details"};

$("withdrawBtn").onclick=()=>{$("withdrawStatus").textContent="Secure withdrawal backend is the next setup step. Do not process real withdrawals from client-side code."};

init().catch(e=>{console.error(e);$("watchStatus").textContent="Firebase setup/error — check configuration."});