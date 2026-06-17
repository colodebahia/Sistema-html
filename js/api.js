/**
 * api.js — Capa de datos para Buena Huella
 * Usa la API REST si está disponible, sino cae a localStorage (offline).
 */

const API_HOST = window.location.hostname || 'localhost';
const API_PROTOCOL = window.location.protocol === 'https:' ? 'https' : 'http';
const DEFAULT_NODE_API = `${API_PROTOCOL}://${API_HOST}:3000/api`;
const DEFAULT_PHP_API = `${window.location.origin}/sistema/api`;
const API_URL = window.BUENA_API_URL || ((API_HOST === 'localhost' || API_HOST === '127.0.0.1') ? DEFAULT_NODE_API : DEFAULT_PHP_API);

// ── Helpers ──────────────────────────────────────────────

async function apiFetch(method, endpoint, body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Clientes ─────────────────────────────────────────────
const CLIENTS_KEY = 'buena_clients_v1';

function localReadClients() {
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]'); } catch { return []; }
}
function localSaveClients(list) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(list));
}

async function getClients() {
  try {
    const data = await apiFetch('GET', '/clients');
    localSaveClients(data); // actualiza cache local
    return data;
  } catch {
    return localReadClients();
  }
}

async function saveClient(client) {
  const existing = localReadClients().find(x => x.id === client.id);
  try {
    if (existing) {
      await apiFetch('PUT', `/clients/${client.id}`, client);
    } else {
      await apiFetch('POST', '/clients', client);
    }
  } catch (e) {
    console.warn('API no disponible, guardando solo local:', e.message);
  }
  const list = localReadClients().filter(x => x.id !== client.id).concat([client]);
  localSaveClients(list);
}

async function deleteClient(id) {
  try { await apiFetch('DELETE', `/clients/${id}`); } catch { /* offline */ }
  const list = localReadClients().filter(x => x.id !== id);
  localSaveClients(list);
}

// ── Productos ─────────────────────────────────────────────
const PRODUCTS_KEY = 'buena_products_v1';

function localReadProducts() {
  try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]'); } catch { return []; }
}
function localSaveProducts(list) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
}

async function getProducts() {
  try {
    const data = await apiFetch('GET', '/products');
    localSaveProducts(data);
    return data;
  } catch {
    return localReadProducts();
  }
}

async function saveProduct(product) {
  const existing = localReadProducts().find(x => x.id === product.id);
  try {
    if (existing) {
      await apiFetch('PUT', `/products/${product.id}`, product);
    } else {
      await apiFetch('POST', '/products', product);
    }
  } catch (e) {
    console.warn('API no disponible:', e.message);
  }
  const list = localReadProducts().filter(x => x.id !== product.id).concat([product]);
  localSaveProducts(list);
}

async function deleteProduct(id) {
  try { await apiFetch('DELETE', `/products/${id}`); } catch { /* offline */ }
  const list = localReadProducts().filter(x => x.id !== id);
  localSaveProducts(list);
}

// ── Componentes ───────────────────────────────────────────
const COMPONENTS_KEY = 'buena_components_v1';

function localReadComponents() {
  try { return JSON.parse(localStorage.getItem(COMPONENTS_KEY) || '[]'); } catch { return []; }
}
function localSaveComponents(list) {
  localStorage.setItem(COMPONENTS_KEY, JSON.stringify(list));
}

async function getComponents() {
  try {
    const data = await apiFetch('GET', '/components');
    localSaveComponents(data);
    return data;
  } catch {
    return localReadComponents();
  }
}

async function saveComponent(component) {
  const existing = localReadComponents().find(x => x.id === component.id);
  try {
    if (existing) {
      await apiFetch('PUT', `/components/${component.id}`, component);
    } else {
      await apiFetch('POST', '/components', component);
    }
  } catch (e) {
    console.warn('API no disponible:', e.message);
  }
  const list = localReadComponents().filter(x => x.id !== component.id).concat([component]);
  localSaveComponents(list);
}

async function deleteComponent(id) {
  try { await apiFetch('DELETE', `/components/${id}`); } catch { /* offline */ }
  const list = localReadComponents().filter(x => x.id !== id);
  localSaveComponents(list);
}

// ── Presupuestos ──────────────────────────────────────────
const BUDGETS_KEY = 'buena_presupuestos_v1';

function localReadBudgets() {
  try { return JSON.parse(localStorage.getItem(BUDGETS_KEY) || '[]'); } catch { return []; }
}
function localSaveBudgets(list) {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(list));
}

async function getBudgets() {
  try {
    const data = await apiFetch('GET', '/budgets');
    localSaveBudgets(data);
    return data;
  } catch {
    return localReadBudgets();
  }
}

async function saveBudget(budget) {
  try {
    const existing = localReadBudgets().find(x => x.id === budget.id);
    if (existing) {
      await apiFetch('PUT', `/budgets/${budget.id}`, budget);
    } else {
      await apiFetch('POST', '/budgets', budget);
    }
  } catch (e) {
    console.warn('API no disponible:', e.message);
  }
  const list = localReadBudgets().filter(x => x.id !== budget.id).concat([budget]);
  localSaveBudgets(list);
}

async function deleteBudget(id) {
  try { await apiFetch('DELETE', `/budgets/${id}`); } catch { /* offline */ }
  const list = localReadBudgets().filter(x => x.id !== id);
  localSaveBudgets(list);
}

// ── Indicador de estado API ───────────────────────────────
async function checkApiStatus() {
  try {
    await apiFetch('GET', '/health');
    return true;
  } catch {
    return false;
  }
}
