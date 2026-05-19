window.MCN_STATE = window.MCN_STATE || {
  posts: [],
  ads: [],
  chats: {},
  ready: false
};

export function setState(key, value) {
  window.MCN_STATE[key] = value;
}

export function getState(key) {
  return window.MCN_STATE[key];
}