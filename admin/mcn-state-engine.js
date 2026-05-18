/* =========================================
   🧠 MCN STATE ENGINE v2
   SINGLE SOURCE OF TRUTH (CHAT + POSTS + ADS)
========================================= */

window.MCN_STATE = window.MCN_STATE || {

  posts: {},
  postList: [],

  chat: {
    inbox: {}
  },

  ads: {
    requests: {},
    approved: {},
    rejected: {}
  },

  approvals: {
    pendingPayments: {}
  }
};

/* ================= EVENT UPDATE HOOK ================= */

function notify(event) {
  if (window.MCN_BUS?.emit) {
    window.MCN_BUS.emit(event, {
      time: Date.now()
    });
  }
}

/* ================= STATE HELPERS ================= */

window.MCN_STATE_ENGINE = {

  addPost(post) {
    window.MCN_STATE.posts[post.id] = post;
    window.MCN_STATE.postList.push(post.id);
    notify("post:create");
  },

  updatePost(id, data) {
    const p = window.MCN_STATE.posts[id];
    if (!p) return;

    Object.assign(p, data);
    p.edited = true;

    notify("post:update");
  },

  deletePost(id) {
    delete window.MCN_STATE.posts[id];
    window.MCN_STATE.postList =
      window.MCN_STATE.postList.filter(p => p !== id);

    notify("post:delete");
  },

  sendMessage(userId, message) {
    if (!window.MCN_STATE.chat.inbox[userId]) {
      window.MCN_STATE.chat.inbox[userId] = [];
    }

    window.MCN_STATE.chat.inbox[userId].push({
      message,
      time: Date.now()
    });

    notify("chat:message");
  },

  requestAd(ad) {
    window.MCN_STATE.ads.requests[ad.id] = ad;
    notify("ad:request");
  },

  approveAd(adId) {
    const ad = window.MCN_STATE.ads.requests[adId];
    if (!ad) return;

    window.MCN_STATE.ads.approved[adId] = ad;
    delete window.MCN_STATE.ads.requests[adId];

    notify("ad:approved");
  },

  rejectAd(adId) {
    const ad = window.MCN_STATE.ads.requests[adId];
    if (!ad) return;

    window.MCN_STATE.ads.rejected[adId] = ad;
    delete window.MCN_STATE.ads.requests[adId];

    notify("ad:rejected");
  },

  lockPayment(adId) {
    window.MCN_STATE.approvals.pendingPayments[adId] = true;
    notify("payment:locked");
  },

  unlockPayment(adId) {
    delete window.MCN_STATE.approvals.pendingPayments[adId];
    notify("payment:unlocked");
  }
};

console.log("🧠 MCN STATE ENGINE v2 ONLINE");