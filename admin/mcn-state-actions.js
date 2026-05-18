/* =========================================
   ⚙ MCN STATE ACTIONS v1
   UI + Business Logic Bridge
========================================= */

function getState() {
  return window.MCN_STATE || {};
}

/* ================= BLOG ================= */

window.createPost = function () {

  const id = Date.now().toString();

  window.MCN_STATE_ENGINE.addPost({
    id,
    title: document.getElementById("blogTitle").value,
    content: document.getElementById("blogContent").value,
    image: document.getElementById("blogImage").value
  });

  alert("Post created");
};

window.updatePost = function () {

  const id = document.getElementById("editPostId").value;

  window.MCN_STATE_ENGINE.updatePost(id, {
    title: document.getElementById("editPostTitle").value,
    content: document.getElementById("editPostContent").value
  });

  alert("Post updated");
};

/* ================= CHAT ================= */

window.sendSupportReply = function () {

  const msg = document.getElementById("supportReply").value;

  const userId = window.MCN_ACTIVE_USER || "unknown";

  window.MCN_STATE_ENGINE.sendMessage(userId, msg);

  document.getElementById("supportReply").value = "";
};

/* ================= ADS FLOW ================= */

window.approveAd = function (adId) {
  window.MCN_STATE_ENGINE.approveAd(adId);
};

window.rejectAd = function (adId) {
  window.MCN_STATE_ENGINE.rejectAd(adId);
};

/* ================= PAYMENT GATE ================= */

window.requestPayment = function (adId) {

  const locked = window.MCN_STATE.approvals.pendingPayments[adId];

  if (locked) {
    alert("⛔ Payment locked pending admin approval");
    return;
  }

  alert("✅ Payment allowed → redirecting...");
  window.location.href = "/payment.html?id=" + adId;
};