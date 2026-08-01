/**
 * Polyfill para window.storage, usado durante o desenvolvimento no Claude.
 * Aqui reimplementamos a mesma interface (get/set/delete/list) usando
 * localStorage do navegador, para que o restante do código (useStore em
 * App.jsx) funcione sem nenhuma alteração.
 *
 * Quando você tiver um backend/banco de dados real, basta trocar as
 * implementações abaixo por chamadas fetch() para sua API — a interface
 * (get/set/delete/list) pode continuar a mesma.
 */

const NS = "loja-celulares";

function fullKey(key, shared) {
  return `${NS}:${shared ? "shared" : "personal"}:${key}`;
}

window.storage = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(fullKey(key, shared));
    if (raw === null) return null;
    return { key, value: raw, shared };
  },

  async set(key, value, shared = false) {
    localStorage.setItem(fullKey(key, shared), value);
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    const existed = localStorage.getItem(fullKey(key, shared)) !== null;
    localStorage.removeItem(fullKey(key, shared));
    return { key, deleted: existed, shared };
  },

  async list(prefix = "", shared = false) {
    const nsPrefix = `${NS}:${shared ? "shared" : "personal"}:${prefix}`;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(nsPrefix)) {
        keys.push(k.slice(`${NS}:${shared ? "shared" : "personal"}:`.length));
      }
    }
    return { keys, prefix, shared };
  },
};
