// PlatformIO Device Tool — frontend
// One primary selector (PlatformIO env). From it:
//   personal tab → src/configs/<env>.h   (editable, add parameters, save)
//   common tab   → config.h              (editable)
//   sources tab  → every other .h under src/ (read-only)
"use strict";

const I18N = {
  en: { project:"project", env:"env", port:"port", transport:"via", build:"Build", upload:"Upload", upload_fs:"Upload FS", upload_both:"FS+FW", stop:"Stop",
        clean:"Clean build", clean_confirm:"Remove .pio build cache for {env}? Next build will be from scratch.",
        clean_disabled_ota:"Disabled while an OTA target is pinned", monitor:"Monitor", reset_chip:"Reset chip",
        personal:"Current config", common:"Common (config.h)", sources:"Sources",
        add_param:"+ param", add_module:"+ module", override_default:"override default…",
        save:"Save", search:"search…", serial_send:"send to serial…",
        build_log:"Build log", serial:"Serial", view_source:"view source",
        common_hint:"Shared defaults — included by every config via #ifndef guards.",
        sources_hint:"Read-only. Every .h under src/ grouped by directory.",
        pio_hint:"PlatformIO environment section for the selected env, plus full-file view.",
        raw_file:"raw file", also_pio:"also add [env:name] to platformio.ini", extends:"extends",
        add_param_title:"Add #define", add_module_title:"Add module",
        override_title:"Override common defaults",
        override_hint:"Values defined inside #ifndef in config.h. Pick ones to copy here and change.",
        comment:"comment", cancel:"Cancel", add:"Add",
        new_config:"new config", new_config_title:"New config file", create:"Create",
        rescan_ports:"rescan ports", serial_connect:"Connect", serial_disconnect:"Disconnect",
        no_env:"Pick an environment above.",
        no_file:"No src/configs/{env}.h for this environment. Click + to create one.",
        confirm_discard:"Discard unsaved changes?",
        saved:"Saved",
        hint_personal:"Device-specific overrides. Pair with [env:{env}] in platformio.ini.",
        badge_default:"default", badge_override:"overrides default",
        mod_pick:"Pick a module on the left to see its parameters.",
        devices:"Devices", devices_title:"Network devices",
        subnet:"subnet", scan:"Scan", probe_single:"probe", check:"Check",
        close:"Close", scanning:"scanning…", no_dev:"No devices found.",
        ota_upload:"OTA upload", ota_uploadfs:"OTA upload FS",
        tag_current:"up to date", tag_outdated:"older than local build",
        tag_unknown:"no local build",
        ssdp:"SSDP broadcast", ssdp_scanning:"SSDP M-SEARCH…",
        select:"select", select_hint:"Pin as OTA target so Upload / Upload FS flashes this device.",
        safe_title:"Device mismatch — confirm OTA",
        safe_hint:"Safe-mode check before OTA. The device at this IP does not match the firmware you are about to flash. Review the differences and confirm.",
        safe_target:"target IP", safe_env:"firmware env",
        safe_device:"device /info", safe_no_info:"no /info response",
        safe_cancel:"Cancel", safe_proceed:"Flash anyway",
        safe_confirm_check:"I understand that this will overwrite the device with the selected firmware build.",
        safe_notice:"Warning: the selected build differs from the device firmware.",
        safe_probing:"checking /info…",
        build_ui:"Build UI…", build_ui_title:"Build UI (web_app)",
        node_version:"node version", npm_script:"npm script", loading:"loading…",
        force_rebuild:"force rebuild node-sass",
        build_ui_hint:"Runs nvm use <ver> && npm run <script> in web_app/. Output streams into the build log." },
  ru: { project:"проект", env:"среда", port:"порт", transport:"через", build:"Собрать", upload:"Прошить", upload_fs:"Прошить FS", upload_both:"FS+прошивка", stop:"Прервать",
        clean:"Очистить сборку", clean_confirm:"Удалить кэш сборки .pio для {env}? Следующая сборка пойдёт с нуля.",
        clean_disabled_ota:"Недоступно пока закреплена OTA цель", monitor:"Монитор", reset_chip:"Рестарт",
        personal:"Текущий конфиг", common:"Общий (config.h)", sources:"Исходники",
        add_param:"+ параметр", add_module:"+ модуль", override_default:"переопределить…",
        save:"Сохранить", search:"поиск…", serial_send:"отправить…",
        build_log:"Журнал сборки", serial:"Порт", view_source:"исходник",
        common_hint:"Общие значения — подключаются во все конфиги через #ifndef.",
        sources_hint:"Только чтение. Все .h из src/ сгруппированы по папкам.",
        pio_hint:"Секция выбранного env в platformio.ini и полный файл.",
        raw_file:"файл целиком", also_pio:"добавить [env:name] в platformio.ini", extends:"extends",
        add_param_title:"Добавить #define", add_module_title:"Добавить модуль",
        override_title:"Переопределить общие значения",
        override_hint:"Значения из блоков #ifndef в config.h. Отметьте, что перенести сюда и изменить.",
        comment:"комментарий", cancel:"Отмена", add:"Добавить",
        new_config:"новый конфиг", new_config_title:"Новый файл конфига", create:"Создать",
        rescan_ports:"обновить порты", serial_connect:"Подключить", serial_disconnect:"Отключить",
        no_env:"Выберите environment сверху.",
        no_file:"Файла src/configs/{env}.h нет. Нажмите + чтобы создать.",
        confirm_discard:"Отменить несохранённые изменения?",
        saved:"Сохранено",
        hint_personal:"Параметры конкретного устройства. Соответствует [env:{env}] в platformio.ini.",
        badge_default:"по-умолчанию", badge_override:"переопределяет",
        mod_pick:"Выберите модуль слева чтобы увидеть параметры.",
        devices:"Устройства", devices_title:"Устройства в сети",
        subnet:"подсеть", scan:"Сканировать", probe_single:"адрес", check:"Проверить",
        close:"Закрыть", scanning:"сканирование…", no_dev:"Ничего не найдено.",
        ota_upload:"OTA прошивка", ota_uploadfs:"OTA файлы (FS)",
        tag_current:"актуально", tag_outdated:"есть новая сборка",
        tag_unknown:"нет локальной сборки",
        ssdp:"SSDP broadcast", ssdp_scanning:"SSDP M-SEARCH…",
        select:"выбрать", select_hint:"Запомнить как цель OTA. После этого Upload / Upload FS будут шить сюда.",
        safe_title:"Устройство не совпадает — подтвердите OTA",
        safe_hint:"Безопасный режим: устройство по этому IP не совпадает с прошивкой, которую вы собираетесь залить. Проверьте различия и подтвердите.",
        safe_target:"целевой IP", safe_env:"прошивка env",
        safe_device:"device /info", safe_no_info:"нет ответа /info",
        safe_cancel:"Отмена", safe_proceed:"Всё равно прошить",
        safe_confirm_check:"Я понимаю, что выбранная сборка перезапишет прошивку устройства.",
        safe_notice:"Внимание: выбранная сборка отличается от прошивки устройства.",
        safe_probing:"проверка /info…",
        build_ui:"Собрать UI…", build_ui_title:"Сборка UI (web_app)",
        node_version:"версия node", npm_script:"npm-скрипт", loading:"загрузка…",
        force_rebuild:"пересобрать node-sass",
        build_ui_hint:"Запускает nvm use <ver> && npm run <script> в web_app/. Вывод идёт в журнал сборки." },
};
let lang = localStorage.getItem("lang") || "en";
function t(k, vars) {
  let s = I18N[lang][k] || I18N.en[k] || k;
  if (vars) for (const n in vars) s = s.replaceAll("{"+n+"}", vars[n]);
  return s;
}
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function applyLang() {
  $$("[data-i18n]").forEach(el => { const v = I18N[lang][el.dataset.i18n]; if (v) el.textContent = v; });
  $$("[data-i18n-placeholder]").forEach(el => { const v = I18N[lang][el.dataset.i18nPlaceholder]; if (v) el.placeholder = v; });
  $$("[data-i18n-title]").forEach(el => { const v = I18N[lang][el.dataset.i18nTitle]; if (v) el.title = v; });
  $("#btn-lang").textContent = lang === "ru" ? "EN" : "RU";
}
$("#btn-lang").onclick = () => { lang = lang === "ru" ? "en" : "ru";
  localStorage.setItem("lang", lang); applyLang(); render(); };

function toast(msg, kind="") {
  const el = $("#toast");
  el.textContent = msg; el.className = "show " + kind;
  clearTimeout(toast._t); toast._t = setTimeout(() => el.className = "", 2500);
}
async function j(url, opts) {
  const r = await fetch(url, opts);
  const txt = await r.text();
  let d; try { d = JSON.parse(txt); } catch { d = { raw: txt }; }
  if (!r.ok) throw new Error(d.error || r.statusText);
  return d;
}

// ---------- state ----------
const state = {
  projects: [], project: null, isEsp: false, transport: localStorage.getItem("upload_transport") || "usb", envs: [], env: null, configs: new Set(),
  personal: { src: "", loaded: false },
  common:   { src: "", loaded: false },
  sources:  { groups: {}, path: null, src: "" },
  pio:      { section: null, chain: [], sections: {}, allSections: [],
              raw: "", loaded: false, dirtySections: new Set() },
  modules:  [],
  enums:    {},  // {PREFIX: ["NAME1", "NAME2", …]}  from scanned sources
  defaults: {},  // {NAME: value}  from #ifndef guards in config.h
  dirty: { personal: false, common: false, pio: false, pioRaw: false },
  tab: "personal",
  search: "",
};

// ---------- parse ---------- (reused for all three panes)
const DEFINE_RE = /^(\s*)(\/\/\s*)?#\s*define\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+([^\n]*?))?\s*$/;

const PIO_SUGGESTIONS = {
  platform: "dl-platform", board: "dl-board", framework: "dl-framework",
  "board_build.mcu": "dl-mcu", "board_build.filesystem": "dl-fs",
  "board_build.flash_mode": "dl-flash", upload_resetmethod: "dl-reset",
  monitor_speed: "dl-baud", upload_speed: "dl-baud",
};

// Pin maps keyed by MCU family. Each category becomes an <optgroup>.
const PIN_MAPS = {
  esp32: {
    safe: [2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],
    inputOnly: [34,35,36,39],
    strapping: [0,2,5,12,15],
    flashReserved: [6,7,8,9,10,11],
  },
  esp32s2: { safe: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,21,33,34,35,36,37,38,39,40,41,42],
             inputOnly:[], strapping:[0,45,46], flashReserved:[26,27,28,29,30,31,32] },
  esp32s3: { safe: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,21,35,36,37,38,39,40,41,42,45,46,47,48],
             inputOnly:[], strapping:[0,3,45,46], flashReserved:[26,27,28,29,30,31,32] },
  esp32c3: { safe: [0,1,2,3,4,5,6,7,10,20,21],
             inputOnly:[], strapping:[2,8,9], flashReserved:[11,12,13,14,15,16,17] },
  esp8266: {
    safe: [0,2,4,5,12,13,14,15,16],
    inputOnly: [],
    strapping: [0,2,15],
    flashReserved: [6,7,8,9,10,11],
  },
};

function detectMcu() {
  // Try the current env's chain for a board/mcu hint, falling back to esp32.
  const chain = state.pio.chain || [];
  for (const sec of chain) {
    const items = (state.pio.sections[sec] || {}).items || {};
    const mcu = items["board_build.mcu"];
    if (mcu && PIN_MAPS[mcu]) return mcu;
    const board = items.board || "";
    if (board.startsWith("esp32s3")) return "esp32s3";
    if (board.startsWith("esp32s2")) return "esp32s2";
    if (board.startsWith("esp32c3")) return "esp32c3";
    if (board.startsWith("esp32") || board === "wt32-eth01") return "esp32";
    if (board.startsWith("esp") || board.startsWith("nodemcu")) return "esp8266";
  }
  return "esp32";
}

function pinSelect(current) {
  const map = PIN_MAPS[detectMcu()] || PIN_MAPS.esp32;
  const sel = document.createElement("select"); sel.className = "val pin-select";
  const groups = [
    ["safe", map.safe, ""],
    ["input-only", map.inputOnly, " (in)"],
    ["strapping", map.strapping, " ⚠"],
    ["flash", map.flashReserved, " ✖"],
  ];
  const customOpt = document.createElement("option"); customOpt.value = "__custom__"; customOpt.textContent = "custom…";
  const seen = new Set();
  groups.forEach(([label, pins, suf]) => {
    if (!pins.length) return;
    const og = document.createElement("optgroup"); og.label = label;
    pins.forEach(p => {
      if (seen.has(p)) return; seen.add(p);
      const o = document.createElement("option"); o.value = String(p);
      o.textContent = p + suf;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
  sel.appendChild(customOpt);
  const cur = String(current || "").trim();
  if (cur && !seen.has(Number(cur))) {
    const o = document.createElement("option"); o.value = cur; o.textContent = cur + " (custom)";
    sel.insertBefore(o, customOpt);
  }
  sel.value = cur;
  return sel;
}

/** Split a top-level comma list inside braces, respecting nested braces/strings. */
function splitTopLevel(s) {
  const out = []; let depth = 0, quote = "", buf = "", esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { buf += c; esc = false; continue; }
    if (quote) {
      if (c === "\\") { buf += c; esc = true; continue; }
      if (c === quote) quote = "";
      buf += c; continue;
    }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === "{" || c === "(" || c === "[") { depth++; buf += c; continue; }
    if (c === "}" || c === ")" || c === "]") { depth--; buf += c; continue; }
    if (c === "," && depth === 0) { out.push(buf.trim()); buf = ""; continue; }
    buf += c;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** Parse a value like `{1, 2}` or `{{0x27,TYPE,"X"},{0x28,…}}` into rows+cols. */
function parseArrayValue(raw) {
  const t = raw.trim();
  if (!(t.startsWith("{") && t.endsWith("}"))) return null;
  const inner = t.slice(1, -1).trim();
  if (!inner) return { kind: "list", rows: [] };
  const items = splitTopLevel(inner);
  const nested = items.every(x => x.startsWith("{") && x.endsWith("}"));
  if (nested) {
    const rows = items.map(x => splitTopLevel(x.slice(1, -1)));
    return { kind: "records", rows };
  }
  return { kind: "list", rows: items.map(x => [x]) };
}

function serializeArray(parsed) {
  if (!parsed.rows.length) return "{}";
  if (parsed.kind === "list") return "{" + parsed.rows.map(r => r[0]).join(", ") + "}";
  return "{" + parsed.rows.map(r => "{" + r.join(",") + "}").join(", ") + "}";
}

function looksPin(name) { return /_PINS?$|_GPIO$/.test(name); }
function looksHex(v) { return /^0x[0-9a-fA-F]+$/.test(v); }
function looksString(v) { return /^".*"$/.test(v); }
function looksEnum(v) { return /^[A-Z_][A-Z0-9_]*$/.test(v); }
function looksNumber(v) { return /^-?\d+(?:\.\d+)?[UuLlFf]*$/.test(v); }

function stripInlineComment(rest) {
  let quote = "", esc = false;
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    if (esc) { esc = false; continue; }
    if (c === "\\" && quote) { esc = true; continue; }
    if (c === '"' || c === "'") { quote = quote === c ? "" : (quote || c); continue; }
    if (!quote && c === "/" && rest[i+1] === "/") return [rest.slice(0, i).trim(), rest.slice(i+2).trim()];
  }
  return [rest.trim(), ""];
}
function parseSource(src) {
  const lines = src.split("\n");
  const items = [];
  const stack = [];  // enclosing #if directives
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const ifm = ln.match(/^\s*#\s*(if|ifdef|ifndef)\s+(.+?)\s*$/);
    if (ifm) { stack.push(`#${ifm[1]} ${ifm[2].split("//")[0].trim()}`); continue; }
    if (/^\s*#\s*endif/.test(ln)) { stack.pop(); continue; }
    if (/^\s*#\s*else/.test(ln) && stack.length) { stack[stack.length - 1] = stack[stack.length - 1].replace(/^#if\w*/, "#else"); continue; }
    const m = ln.match(DEFINE_RE);
    if (!m) continue;
    const [value, inlineCmt] = stripInlineComment(m[4] || "");
    let cmt = inlineCmt;
    if (!cmt) {
      for (let j = i - 1; j >= 0; j--) {
        const s = lines[j].trim(); if (!s) break;
        if (s.startsWith("//")) cmt = s.replace(/^\/+\s*/, "") + (cmt ? " " + cmt : "");
        else break;
      }
    }
    items.push({ name: m[3], value, comment: cmt,
                 commented_out: !!m[2], line: i + 1, raw_index: i,
                 context: stack.slice() });
  }
  return items;
}

// ---------- rendering ----------
function render() {
  $$(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === state.tab));
  ["personal", "common", "pio", "sources"].forEach(n => {
    const el = $("#pane-" + n); if (el) el.classList.toggle("hidden", state.tab !== n);
  });
  $("#tab-personal-sub").textContent = state.env ? "src/configs/" + state.env + ".h" : "";
  $("#tab-pio-sub").textContent = state.env ? "[env:" + state.env + "]" : "";
  const dirty = state.dirty.personal || state.dirty.common ||
                state.dirty.pio || state.dirty.pioRaw;
  $("#btn-save").disabled = !dirty;
  const inPersonal = state.tab === "personal" && state.personal.loaded;
  const inCommon   = state.tab === "common" && state.common.loaded;
  $("#btn-add-param").disabled = !inPersonal && !inCommon;
  $("#btn-add-module").disabled = !inPersonal;
  $("#btn-override").disabled = !inPersonal || !Object.keys(state.defaults).length;
  renderPersonal();
  renderCommon();
  renderPio();
  renderSources();
  updateFsActions();
  updateTransportState();
}

function updateFsActions() {
  const allowed = !!state.isEsp;
  ["#btn-uploadfs", "#btn-upload-both"].forEach(selector => {
    const btn = $(selector); if (!btn) return;
    btn.disabled = !allowed;
    btn.title = allowed ? "" : (lang === "ru" ? "Загрузка FS доступна только для ESP" : "Upload FS is available only for ESP");
  });
}

function updateTransportState() {
  const sel = $("#upload-transport");
  if (!sel) return;
  const ota = sel.querySelector('option[value="ota"]');
  if (ota) ota.disabled = !state.isEsp;
  if (!state.isEsp && sel.value === "ota") sel.value = "usb";
  state.transport = sel.value;
  localStorage.setItem("upload_transport", state.transport);
  sel.title = state.isEsp
    ? (lang === "ru" ? "Выберите способ прошивки" : "Choose upload transport")
    : (lang === "ru" ? "OTA доступно только для ESP" : "OTA is available only for ESP");
}

function filterItems(items) {
  const q = state.search.toLowerCase(); if (!q) return items;
  return items.filter(d => d.name.toLowerCase().includes(q) ||
                           (d.value || "").toLowerCase().includes(q) ||
                           (d.comment || "").toLowerCase().includes(q));
}

function renderPersonal() {
  const host = $("#form-personal");
  const hint = $("#personal-hint");
  const btnSrc = $("#btn-view-source");
  host.innerHTML = "";
  if (!state.env) {
    hint.textContent = t("no_env"); btnSrc.hidden = true; return;
  }
  btnSrc.hidden = false;
  if (!state.personal.loaded) {
    hint.textContent = t("no_file", {env: state.env});
    const btn = document.createElement("button");
    btn.className = "primary"; btn.textContent = t("create");
    btn.onclick = () => createConfig(state.env);
    host.appendChild(btn);
    return;
  }
  hint.textContent = t("hint_personal", {env: state.env});
  const parsed = parseSource(state.personal.src);
  parsed.forEach(d => { if (state.defaults[d.name] !== undefined) d.isOverride = true; });
  const items = filterItems(parsed);
  const container = document.createElement("div");
  const grouped = groupByModule(items);
  const freeStanding = grouped.get("__free__") || [];
  if (freeStanding.length) container.appendChild(groupBox("src/configs/" + state.env + ".h", freeStanding, true, "personal"));
  for (const [modName, defs] of grouped) {
    if (modName === "__free__") continue;
    container.appendChild(moduleBlock(modName, defs));
  }
  host.appendChild(container);
}

function groupByModule(items) {
  // Flat list of {prefix, mod} tuples, each module contributing all its
  // spelling variants. Longest-first wins so `AIR_TH_SENSOR` doesn't get
  // stolen by a module whose prefix is `AIR`.
  const entries = [];
  state.modules.forEach(m => {
    (m.prefixes || [m.prefix]).forEach(p => entries.push({ prefix: p.toUpperCase(), mod: m }));
  });
  entries.sort((a, b) => b.prefix.length - a.prefix.length);
  const out = new Map();
  items.forEach(d => {
    const name = d.name.toUpperCase();
    let found = null;
    for (const p of entries) {
      if (name === p.prefix || name.startsWith(p.prefix + "_")) { found = p.mod; break; }
    }
    const key = found ? found.name : "__free__";
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(d);
  });
  return out;
}

function moduleBlock(modName, defs) {
  const mod = state.modules.find(m => m.name === modName) || { name: modName, description: "" };
  const g = document.createElement("div"); g.className = "module-block";
  const head = document.createElement("div"); head.className = "module-block-head";
  head.innerHTML = `<span class="mod-title">${mod.name}</span>
                    <span class="mod-path muted">${mod.path || ""}</span>
                    <span class="count">${defs.length}</span>`;
  head.onclick = () => g.classList.toggle("collapsed");
  g.appendChild(head);
  const body = document.createElement("div"); body.className = "module-block-body";
  if (mod.description) {
    const p = document.createElement("p"); p.className = "mod-full-desc";
    p.textContent = mod.description; body.appendChild(p);
  }

  // Parallel-array groups: edit N linked #defines as one table.
  // Case- and underscore-insensitive match so a config using TAC11xx_* or
  // KWS306L_* still binds to the schema entry.
  const normDef = s => s.toUpperCase().replace(/_/g, "");
  const byNorm = new Map(defs.map(d => [normDef(d.name), d]));
  const consumed = new Set();
  (mod.parallel || []).forEach(group => {
    const cols = group.columns;
    const present = cols.filter(c => byNorm.has(normDef(c.define)));
    if (present.length < 2) return;      // need at least two for a merged view
    const definesInGroup = present.map(c => byNorm.get(normDef(c.define)));
    definesInGroup.forEach(d => consumed.add(d.name));
    body.appendChild(renderParallelTable(mod, group, present, definesInGroup));
  });

  defs.forEach(d => {
    if (consumed.has(d.name)) return;
    body.appendChild(renderRow(d, true, "personal"));
  });
  // Show module params that aren't in the file yet — quick-add.
  const present = new Set(defs.map(d => d.name));
  const missing = [];
  if (mod.enable && !present.has(mod.enable)) missing.push({ name: mod.enable, type: "flag", required: true, default: "" });
  (mod.params || []).forEach(p => { if (!present.has(p.name)) missing.push(p); });
  if (missing.length) {
    const miss = document.createElement("div"); miss.className = "mod-missing";
    const label = document.createElement("div"); label.className = "mod-missing-label";
    label.textContent = (lang === "ru" ? "ещё параметры: " : "more params: ");
    miss.appendChild(label);
    missing.forEach(p => {
      const btn = document.createElement("button"); btn.className = "ghost mini mod-missing-btn";
      btn.textContent = "+ " + p.name;
      btn.title = (p.type || "") + (p.default ? " · default: " + p.default : "");
      btn.onclick = () => {
        const line = `#define ${p.name}` + (p.default ? " " + p.default : "");
        insertUnderSection("personal", "modules", [line]);
      };
      miss.appendChild(btn);
    });
    body.appendChild(miss);
  }
  g.appendChild(body);
  return g;
}

function renderCommon() {
  const host = $("#form-common"); host.innerHTML = "";
  if (!state.common.loaded) return;
  const parsed = parseSource(state.common.src);
  const guarded = extractGuarded(state.common.src);
  state.defaults = guarded;
  parsed.forEach(d => { if (guarded[d.name] !== undefined) d.isDefault = true; });

  // Partition by "is this define inside the big #ifndef CONFIG_FILE guard?"
  const always = [], fallback = [];
  parsed.forEach(d => {
    const inCF = (d.context || []).some(c => c.includes("CONFIG_FILE"));
    (inCF ? fallback : always).push(d);
  });

  host.appendChild(contextGroup("config.h — always active", filterItems(always), true, "common"));
  if (fallback.length) {
    host.appendChild(contextGroup(
      "config.h — fallback (when no CONFIG_FILE)",
      filterItems(fallback), true, "common",
      "These apply only when the build has no device config #define'd — handy to inspect, but overridden by any config.h-selected profile."));
  }
}

function contextGroup(title, items, editable, bucket, note) {
  const g = document.createElement("div"); g.className = "group";
  const head = document.createElement("div"); head.className = "group-head";
  head.innerHTML = `<span class="title">${title}</span>
                    <span class="count">${items.length}</span>`;
  head.onclick = () => g.classList.toggle("collapsed");
  g.appendChild(head);
  const body = document.createElement("div"); body.className = "group-body";
  if (note) {
    const p = document.createElement("p"); p.className = "mod-full-desc";
    p.textContent = note; body.appendChild(p);
  }
  if (!items.length) {
    const p = document.createElement("p"); p.className = "muted"; p.style.padding = "10px";
    p.textContent = "—"; body.appendChild(p);
  }
  items.forEach(d => body.appendChild(renderRow(d, editable, bucket)));
  g.appendChild(body);
  return g;
}

// Scan common source for `#ifndef X \n #define X VALUE \n #endif` idiom.
function extractGuarded(src) {
  const lines = src.split("\n");
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*#\s*ifndef\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (!m) continue;
    const name = m[1];
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const d = lines[j].match(DEFINE_RE);
      if (d && d[3] === name) { out[name] = (d[4] || "").trim(); break; }
    }
  }
  return out;
}

function renderPio() {
  if (state.tab !== "pio") return;
  const host = $("#form-pio"); host.innerHTML = "";
  $("#pio-raw").value = state.pio.raw;
  if (!state.pio.loaded) return;
  state.pio.chain.forEach((name, i) => host.appendChild(pioSectionBox(name, i === 0)));
}

function pioSectionBox(section, primary) {
  const data = state.pio.sections[section];
  if (!data) return document.createTextNode("");
  const g = document.createElement("div"); g.className = "group";
  if (!primary) g.classList.add("collapsed");
  const head = document.createElement("div"); head.className = "group-head";
  const label = primary ? "" : ` <span class="muted">(inherited)</span>`;
  const dirtyMark = state.pio.dirtySections.has(section) ? ' <span class="badge override">·</span>' : "";
  head.innerHTML = `<span class="title">[${section}]${label}${dirtyMark}</span>
                    <span class="count">${data.exists ? Object.keys(data.items).length : "new"}</span>`;
  head.onclick = () => g.classList.toggle("collapsed");
  g.appendChild(head);
  const body = document.createElement("div"); body.className = "group-body";
  Object.keys(data.items).forEach(k => body.appendChild(pioRow(section, k, data.items[k])));
  const addBtn = document.createElement("button"); addBtn.className = "ghost mini";
  addBtn.textContent = "+ key"; addBtn.style.marginTop = "6px";
  addBtn.onclick = e => {
    e.stopPropagation();
    const k = prompt("key"); if (!k) return;
    data.items[k] = ""; markPioDirty(section); render();
  };
  body.appendChild(addBtn);
  g.appendChild(body);
  return g;
}

function markPioDirty(section) {
  state.pio.dirtySections.add(section); state.dirty.pio = true;
}

function pioRow(section, key, value) {
  const data = state.pio.sections[section];
  const row = document.createElement("div"); row.className = "row";
  const name = document.createElement("div"); name.className = "name"; name.textContent = key;
  let inp;
  if (key === "extends") {
    inp = document.createElement("select"); inp.className = "val";
    const options = state.pio.allSections.filter(s => s !== section);
    const blank = document.createElement("option"); blank.value = ""; blank.textContent = "— none —";
    inp.appendChild(blank);
    options.forEach(s => { const o = document.createElement("option"); o.value = s; o.textContent = s; inp.appendChild(o); });
    inp.value = value || "";
    inp.onchange = async () => {
      data.items[key] = inp.value; markPioDirty(section);
      // Load the newly chosen parent so the user can edit it too.
      if (inp.value && !state.pio.sections[inp.value]) {
        const d = await j("/api/pio/section/" + inp.value);
        state.pio.sections[d.section] = { exists: d.exists, items: { ...d.items } };
      }
      state.pio.chain = rebuildChain(state.pio.section);
      render();
    };
  } else {
    const multi = String(value).includes("\n") || key === "build_flags";
    inp = document.createElement(multi ? "textarea" : "input");
    inp.className = "val"; inp.spellcheck = false; inp.value = value || "";
    if (multi) { inp.rows = Math.min(6, (String(value).split("\n").length) + 1); inp.style.fontFamily = "var(--mono)"; }
    else {
      const dl = PIO_SUGGESTIONS[key];
      if (dl) inp.setAttribute("list", dl);
    }
    inp.oninput = () => { data.items[key] = inp.value; markPioDirty(section); };
  }
  const tools = document.createElement("div"); tools.className = "row-tools";
  if (key !== "extends") {
    const del = document.createElement("button"); del.className = "ghost mini"; del.textContent = "✕";
    del.onclick = e => { e.stopPropagation(); delete data.items[key]; markPioDirty(section); render(); };
    tools.appendChild(del);
  }
  row.appendChild(name); row.appendChild(inp); row.appendChild(tools);
  return row;
}

function rebuildChain(start) {
  const chain = [], seen = new Set();
  let cur = start;
  while (cur && !seen.has(cur) && state.pio.sections[cur]) {
    chain.push(cur); seen.add(cur);
    cur = (state.pio.sections[cur].items.extends || "").trim();
  }
  return chain;
}

function renderSources() {
  const list = $("#source-list"); list.innerHTML = "";
  const groups = state.sources.groups;
  const buckets = { "src/base": [], "src/module": [], other: [] };
  Object.keys(groups).sort().forEach(p => {
    if (p === "src/configs/" + (state.env || "") + ".h") return;
    if (p === "config.h") return;
    if (p.startsWith("src/configs/")) return;
    if (p.startsWith("src/base/")) buckets["src/base"].push(p);
    else if (p.startsWith("src/module/")) buckets["src/module"].push(p);
    else buckets.other.push(p);
  });
  for (const [dir, files] of Object.entries(buckets)) {
    if (!files.length) continue;
    const h = document.createElement("li"); h.className = "dir"; h.textContent = dir;
    list.appendChild(h);
    files.forEach(p => {
      const li = document.createElement("li"); li.className = "file";
      li.textContent = p.split("/").pop();
      li.title = p;
      if (p === state.sources.path) li.classList.add("active");
      li.onclick = () => loadSource(p);
      list.appendChild(li);
    });
  }
  $("#source-path").textContent = state.sources.path || "—";
  const form = $("#form-source"); form.innerHTML = "";
  if (!state.sources.path) return;
  const items = filterItems(parseSource(state.sources.src));
  form.appendChild(groupBox(state.sources.path, items, false, null));
}

function groupBox(path, items, editable, bucket) {
  const g = document.createElement("div"); g.className = "group";
  const head = document.createElement("div"); head.className = "group-head";
  head.innerHTML = `<span class="title">${path.split("/").pop()}</span>
                    <span class="count">${items.length}</span>`;
  head.onclick = () => g.classList.toggle("collapsed");
  g.appendChild(head);
  const body = document.createElement("div"); body.className = "group-body";
  if (items.length === 0) {
    const p = document.createElement("p"); p.className = "muted"; p.style.padding = "10px";
    p.textContent = "—"; body.appendChild(p);
  }
  items.forEach(d => body.appendChild(renderRow(d, editable, bucket)));
  g.appendChild(body);
  return g;
}

function renderRow(d, editable, bucket) {
  const parsedArr = parseArrayValue(d.value || "");
  if (editable && parsedArr && (parsedArr.kind === "records" || looksPin(d.name) || parsedArr.rows.length > 1)) {
    return renderTableRow(d, bucket, parsedArr);
  }
  const row = document.createElement("div");
  row.className = "row" + (d.commented_out ? " commented" : "");
  const name = document.createElement("div"); name.className = "name";
  name.textContent = d.name; name.title = d.name;
  let inp;
  if (editable && looksPin(d.name) && !parsedArr) {
    inp = pinSelect(d.value);
    inp.onchange = () => {
      let v = inp.value;
      if (v === "__custom__") { v = prompt("GPIO number", d.value || "") || d.value; }
      patchDefine(bucket, d, { value: v });
    };
  } else if (editable && looksString(d.value || "")) {
    inp = document.createElement("input");
    inp.className = "val"; inp.spellcheck = false;
    inp.value = (d.value || "").replace(/^"(.*)"$/, "$1");
    inp.oninput = () => patchDefine(bucket, d, { value: inp.value ? JSON.stringify(inp.value) : "" });
  } else if (editable && enumGroupFor(d.value || "")) {
    const names = enumGroupFor(d.value);
    inp = document.createElement("select"); inp.className = "val";
    const custom = document.createElement("option"); custom.value = "__custom__"; custom.textContent = "custom…";
    names.forEach(n => { const o = document.createElement("option"); o.value = o.textContent = n; inp.appendChild(o); });
    inp.appendChild(custom);
    if (!names.includes(d.value)) {
      const o = document.createElement("option"); o.value = o.textContent = d.value; inp.insertBefore(o, custom);
    }
    inp.value = d.value;
    inp.onchange = () => {
      let v = inp.value;
      if (v === "__custom__") v = prompt("value", d.value || "") || d.value;
      patchDefine(bucket, d, { value: v });
    };
  } else {
    inp = document.createElement("input");
    inp.className = "val"; inp.value = d.value || ""; inp.spellcheck = false;
    inp.disabled = !editable;
    if (editable) inp.oninput = () => patchDefine(bucket, d, { value: inp.value });
  }
  const right = document.createElement("div"); right.className = "row-tools";
  if (d.isDefault) {
    const b = document.createElement("span"); b.className = "badge default";
    b.textContent = t("badge_default"); b.title = "#ifndef guard";
    right.appendChild(b);
  }
  if (d.isOverride) {
    const b = document.createElement("span"); b.className = "badge override";
    b.textContent = t("badge_override");
    b.title = "common default: " + (state.defaults[d.name] || "");
    right.appendChild(b);
  }
  const cmt = document.createElement("div"); cmt.className = "cmt";
  cmt.textContent = d.comment || ""; cmt.title = d.comment || "";
  right.appendChild(cmt);
  if (editable) {
    const tgl = document.createElement("label"); tgl.className = "toggle";
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !d.commented_out;
    cb.onchange = () => patchDefine(bucket, d, { commented_out: !cb.checked });
    tgl.appendChild(cb); tgl.append(lang === "ru" ? "вкл" : "on");
    right.appendChild(tgl);
    const del = document.createElement("button"); del.className = "ghost mini"; del.textContent = "✕";
    del.title = "delete";
    del.onclick = () => deleteDefine(bucket, d);
    right.appendChild(del);
  }
  row.appendChild(name); row.appendChild(inp); row.appendChild(right);
  return row;
}

function renderTableRow(d, bucket, parsed) {
  const row = document.createElement("div");
  row.className = "row-table" + (d.commented_out ? " commented" : "");
  const head = document.createElement("div"); head.className = "rt-head";
  const name = document.createElement("span"); name.className = "name"; name.textContent = d.name;
  const preview = document.createElement("code"); preview.className = "rt-preview";
  preview.textContent = serializeArray(parsed);
  const cmt = document.createElement("span"); cmt.className = "cmt"; cmt.textContent = d.comment || "";
  const tools = document.createElement("div"); tools.className = "row-tools";
  const addRow = document.createElement("button"); addRow.className = "ghost mini"; addRow.textContent = "+ row";
  const tgl = document.createElement("label"); tgl.className = "toggle";
  const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !d.commented_out;
  cb.onchange = () => patchDefine(bucket, d, { commented_out: !cb.checked });
  tgl.appendChild(cb); tgl.append(lang === "ru" ? "вкл" : "on");
  const del = document.createElement("button"); del.className = "ghost mini"; del.textContent = "✕";
  del.onclick = () => deleteDefine(bucket, d);
  tools.append(addRow, tgl, del);
  head.append(name, preview, cmt, tools);

  const table = document.createElement("table"); table.className = "rt-table";
  const columns = parsed.kind === "records" ? (parsed.rows[0] || []).length || 1 : 1;
  const colTypes = inferColTypes(d.name, parsed);

  const commit = () => {
    preview.textContent = serializeArray(parsed);
    patchDefine(bucket, d, { value: serializeArray(parsed) }, { quiet: true });
  };
  const rebuild = () => {
    table.innerHTML = "";
    parsed.rows.forEach((rowVals, ri) => {
      const tr = document.createElement("tr");
      for (let ci = 0; ci < columns; ci++) {
        const td = document.createElement("td");
        td.appendChild(cellInput(colTypes[ci], rowVals[ci] || "", v => {
          rowVals[ci] = v; commit();
        }));
        tr.appendChild(td);
      }
      const td = document.createElement("td"); td.className = "rt-del";
      const x = document.createElement("button"); x.className = "ghost mini"; x.textContent = "✕";
      x.onclick = () => { parsed.rows.splice(ri, 1); rebuild(); commit(); };
      td.appendChild(x); tr.appendChild(td);
      table.appendChild(tr);
    });
  };
  addRow.onclick = () => {
    const blank = Array(columns).fill("");
    parsed.rows.push(blank); rebuild(); commit();
  };
  rebuild();

  row.append(head, table);
  return row;
}

/** Render N linked #defines (parallel arrays) as one row-oriented table.
 *  Row count = max over defines; a missing cell writes "" into the matching slot. */
function renderParallelTable(mod, group, cols, defs) {
  const row = document.createElement("div"); row.className = "parallel-group";
  const head = document.createElement("div"); head.className = "pg-head";
  head.innerHTML = `<span class="pg-title">${mod.name}.${group.name}</span>
                    <span class="pg-defs">${defs.map(d => d.name).join(" · ")}</span>`;
  row.appendChild(head);

  // Parse each define's value into rows.
  const perCol = defs.map(d => {
    const parsed = parseArrayValue(d.value || "") || { kind: "list", rows: [] };
    const flat = parsed.rows.map(r => r.length === 1 ? r[0] : "{"+r.join(",")+"}");
    return { parsed, flat };
  });
  const nRows = Math.max(...perCol.map(c => c.flat.length), 1);

  const preview = document.createElement("pre"); preview.className = "pg-preview";
  const updatePreview = () => {
    const parts = cols.map((col, ci) => {
      const flat = perCol[ci].flat;
      let n = flat.length;
      while (n > 0 && (flat[n-1] === "" || flat[n-1] === undefined)) n--;
      return `#define ${col.define} {${flat.slice(0, n).join(", ")}}`;
    });
    preview.textContent = parts.join("\n");
  };

  const table = document.createElement("table"); table.className = "pg-table";
  const thead = document.createElement("thead"); const htr = document.createElement("tr");
  cols.forEach(c => {
    const th = document.createElement("th");
    th.textContent = c.label || c.define;
    th.title = c.define + " · " + c.type;
    htr.appendChild(th);
  });
  htr.appendChild(document.createElement("th"));
  thead.appendChild(htr); table.appendChild(thead);

  const tbody = document.createElement("tbody");

  const commit = () => {
    cols.forEach((col, ci) => {
      const flat = perCol[ci].flat;
      // Trim trailing empties so the serialized form stays clean.
      let n = flat.length;
      while (n > 0 && (flat[n-1] === "" || flat[n-1] === undefined)) n--;
      const slice = flat.slice(0, n);
      const value = "{" + slice.join(", ") + "}";
      patchDefine("personal", defs[ci], { value }, { quiet: true });
    });
  };

  const rebuild = () => {
    tbody.innerHTML = "";
    const rows = Math.max(...perCol.map(c => c.flat.length), 1);
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr");
      cols.forEach((col, ci) => {
        const td = document.createElement("td");
        const cur = perCol[ci].flat[r] || "";
        td.appendChild(cellInput(col.type, cur, v => {
          perCol[ci].flat[r] = v; commit(); updatePreview();
        }, col.options));
        tr.appendChild(td);
      });
      const td = document.createElement("td"); td.className = "pg-del";
      const x = document.createElement("button"); x.className = "ghost mini"; x.textContent = "✕";
      x.onclick = () => {
        perCol.forEach(c => c.flat.splice(r, 1));
        rebuild(); commit(); updatePreview();
      };
      td.appendChild(x); tr.appendChild(td);
      tbody.appendChild(tr);
    }
  };
  table.appendChild(tbody);
  rebuild(); updatePreview();

  const foot = document.createElement("div"); foot.className = "pg-foot";
  const add = document.createElement("button"); add.className = "ghost mini";
  add.textContent = "+ row";
  add.onclick = () => {
    perCol.forEach(c => c.flat.push(""));
    rebuild(); commit(); updatePreview();
  };
  foot.appendChild(add);
  row.append(table, foot, preview);
  return row;
}

function inferColTypes(name, parsed) {
  if (parsed.kind !== "records") return [looksPin(name) ? "pin" : "value"];
  const sample = parsed.rows[0] || [];
  return sample.map(v => {
    if (looksString(v)) return "string";
    if (looksHex(v)) return "hex";
    if (looksEnum(v)) return "enum";
    if (looksNumber(v)) return looksPin(name) ? "pin" : "number";
    return "value";
  });
}

function cellInput(type, value, onChange, options) {
  if (Array.isArray(options) && options.length) {
    const s = document.createElement("select"); s.className = "val";
    options.forEach(o => {
      const opt = document.createElement("option"); opt.value = opt.textContent = o || "(none)";
      opt.value = o;
      s.appendChild(opt);
    });
    const customOpt = document.createElement("option"); customOpt.value = "__custom__"; customOpt.textContent = "custom…";
    s.appendChild(customOpt);
    if (value && !options.includes(value)) {
      const o = document.createElement("option"); o.value = o.textContent = value; s.insertBefore(o, customOpt);
    }
    s.value = value || "";
    s.onchange = () => {
      let v = s.value;
      if (v === "__custom__") v = prompt("value", value) || value;
      onChange(v);
    };
    return s;
  }
  if (type === "pin") {
    const s = pinSelect(value);
    s.onchange = () => {
      let v = s.value;
      if (v === "__custom__") v = prompt("GPIO", value) || value;
      onChange(v);
    };
    return s;
  }
  if (type === "enum") {
    const names = enumGroupFor(value);
    if (names && names.length) {
      const s = document.createElement("select"); s.className = "val";
      const custom = document.createElement("option"); custom.value = "__custom__"; custom.textContent = "custom…";
      names.forEach(n => { const o = document.createElement("option"); o.value = o.textContent = n; s.appendChild(o); });
      s.appendChild(custom);
      if (value && !names.includes(value)) {
        const o = document.createElement("option"); o.value = o.textContent = value; s.insertBefore(o, custom);
      }
      s.value = value;
      s.onchange = () => {
        let v = s.value;
        if (v === "__custom__") v = prompt("value", value) || value;
        onChange(v);
      };
      return s;
    }
  }
  if (type === "string") {
    const i = document.createElement("input"); i.type = "text"; i.className = "val";
    i.value = String(value).replace(/^"(.*)"$/, "$1");
    i.placeholder = "text";
    i.oninput = () => onChange(i.value ? JSON.stringify(i.value) : "");
    return i;
  }
  const i = document.createElement("input"); i.type = "text"; i.className = "val";
  i.value = value; i.spellcheck = false;
  if (type === "hex") i.placeholder = "0x..";
  else if (type === "enum") i.placeholder = "ENUM";
  else if (type === "number") i.placeholder = "123";
  i.oninput = () => onChange(i.value);
  return i;
}

/** Pick the enum group whose prefix matches `value`'s prefix (TYPE_* → TYPE). */
function enumGroupFor(value) {
  const m = String(value).match(/^([A-Z][A-Z0-9]+)_/);
  if (!m) return null;
  return state.enums[m[1]] || null;
}

function bucketSrc(bucket) { return state[bucket].src; }
function setBucketSrc(bucket, src) { state[bucket].src = src; markDirty(bucket, true); render(); }

function patchDefine(bucket, d, patch, opts = {}) {
  const lines = bucketSrc(bucket).split("\n");
  let line = lines[d.raw_index]; if (line === undefined) return;
  if ("value" in patch) {
    line = line.replace(DEFINE_RE, (full, lead, cmt, name) => {
      const [, inlineCmt] = stripInlineComment((full.match(DEFINE_RE)[4] || ""));
      const trail = inlineCmt ? " //" + (inlineCmt.startsWith(" ") ? "" : " ") + inlineCmt : "";
      return `${lead}${cmt || ""}#define ${name}${patch.value ? " " + patch.value : ""}${trail}`;
    });
  }
  if ("commented_out" in patch) {
    if (patch.commented_out) {
      if (!/^\s*\/\//.test(line)) line = line.replace(/^(\s*)/, "$1// ");
    } else {
      line = line.replace(/^(\s*)\/\/\s*/, "$1");
    }
  }
  lines[d.raw_index] = line;
  state[bucket].src = lines.join("\n");
  markDirty(bucket, true);
  if (!opts.quiet) render();
}

function deleteDefine(bucket, d) {
  const lines = bucketSrc(bucket).split("\n");
  lines.splice(d.raw_index, 1);
  state[bucket].src = lines.join("\n");
  markDirty(bucket, true); render();
}

function addParameter(name, value, comment, opts = {}) {
  const bucket = state.tab === "common" ? "common" : "personal";
  if (!state[bucket].loaded) return;
  let line = `#define ${name}` + (value ? " " + value : "");
  if (comment) line += " // " + comment;
  insertUnderSection(bucket, opts.section, [line]);
}

/** Append lines under an existing `// ---- <section> ----` header or create it. */
function insertUnderSection(bucket, section, lines) {
  let src = state[bucket].src;
  if (!src.endsWith("\n")) src += "\n";
  const header = section ? `// ---- ${section} ----` : null;
  if (header) {
    const idx = src.indexOf(header);
    if (idx >= 0) {
      // insert after the section block (before next header or end)
      const srcLines = src.split("\n");
      const start = srcLines.findIndex(l => l === header);
      let end = srcLines.findIndex((l, i) => i > start && /^\/\/ ----/.test(l));
      if (end === -1) end = srcLines.length;
      // trim trailing blanks from section
      while (end > start + 1 && srcLines[end - 1].trim() === "") end--;
      srcLines.splice(end, 0, ...lines);
      state[bucket].src = srcLines.join("\n");
    } else {
      state[bucket].src = src + "\n" + header + "\n" + lines.join("\n") + "\n";
    }
  } else {
    state[bucket].src = src + lines.join("\n") + "\n";
  }
  markDirty(bucket, true); render();
}

function addModule(mod, values) {
  const lines = [`// -- ${mod.name}` + (mod.description ? " — " + mod.description.slice(0, 90) : "")];
  if (mod.enable) lines.push(`#define ${mod.enable}` + (values[mod.enable] ? " " + values[mod.enable] : ""));
  for (const p of mod.params) {
    const v = values[p.name];
    if (v === undefined || v === null) continue;        // not enabled by user
    const commented = v === "__OFF__";
    const prefix = commented ? "// " : "";
    const val = commented ? (p.default || "") : v;
    lines.push(prefix + `#define ${p.name}` + (val ? " " + val : ""));
  }
  insertUnderSection("personal", "modules", lines);
}

function addOverrides(names) {
  const lines = names.map(n => `#define ${n} ${state.defaults[n]}`);
  insertUnderSection("personal", "overrides", lines);
}

function markDirty(bucket, v) { state.dirty[bucket] = v; }

// ---------- data loaders ----------
async function loadProjects() {
  const d = await j("/api/projects");
  state.projects = d.projects || [];
  const saved = localStorage.getItem("project");
  const selected = state.projects.find(p => p.path === saved) ||
                   state.projects.find(p => p.path === d.current.path) || state.projects[0];
  if (selected && selected.path !== d.current.path) {
    await j("/api/project", {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({path: selected.path})});
  }
  state.project = selected ? selected.path : d.current.path;
  state.isEsp = !!(selected ? selected.is_esp : d.current.is_esp);
  localStorage.setItem("project", state.project || "");
  const sel = $("#project"); sel.innerHTML = "";
  state.projects.forEach(p => {
    const o = document.createElement("option");
    o.value = p.path; o.textContent = p.name;
    sel.appendChild(o);
  });
  sel.value = state.project;
  updateTransportState();
}
async function changeProject(path) {
  if (!path || path === state.project) return;
  if ((state.dirty.personal || state.dirty.common || state.dirty.pio || state.dirty.pioRaw) &&
      !confirm(t("confirm_discard"))) {
    $("#project").value = state.project; return;
  }
  try {
    await j("/api/project", {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({path})});
    state.project = path; localStorage.setItem("project", path);
    const selected = state.projects.find(p => p.path === path);
    state.isEsp = !!(selected && selected.is_esp);
    updateTransportState();
    state.env = null; state.personal = {src:"", loaded:false}; state.common = {src:"", loaded:false};
    state.sources = {groups:{}, path:null, src:""};
    state.pio = {section:null, chain:[], sections:{}, allSections:[], raw:"", loaded:false, dirtySections:new Set()};
    state.dirty = {personal:false, common:false, pio:false, pioRaw:false};
    await Promise.all([loadEnvs(), loadCommon(), loadModules(), loadEnums(), loadSourcesIndex()]);
    await loadPio(); render();
  } catch (e) {
    $("#project").value = state.project; toast(e.message, "err");
  }
}
async function loadEnvs() {
  const d = await j("/api/envs"); state.envs = d.envs;
  const sel = $("#env"); sel.innerHTML = "";
  d.envs.forEach(e => { const o = document.createElement("option"); o.textContent = e; sel.appendChild(o); });
  const saved = localStorage.getItem("env");
  if (saved && d.envs.includes(saved)) sel.value = saved;
  state.env = sel.value;
  await loadConfigsList();
  await loadPersonal();
}
async function loadConfigsList() {
  const d = await j("/api/configs"); state.configs = new Set(d.configs);
}
async function loadPersonal() {
  if (!state.env) { state.personal = { src:"", loaded:false }; return; }
  const file = state.env + ".h";
  if (!state.configs.has(file)) { state.personal = { src:"", loaded:false }; return; }
  const d = await j("/api/configs/" + encodeURIComponent(file));
  state.personal = { src: d.content, loaded: true };
  state.dirty.personal = false;
}
async function loadCommon() {
  const d = await j("/api/common");
  state.common = { src: d.content, loaded: true };
  state.dirty.common = false;
}
async function loadSourcesIndex() {
  const d = await j("/api/parse"); state.sources.groups = d.groups;
}
async function loadModules() {
  const d = await j("/api/modules"); state.modules = d.modules;
}
function moduleCategory(mod) {
  const name = mod.name.toLowerCase();
  if (/(mqtt|network|wifi|ethernet|http|websocket|ssdp|my_home_link|my_485|rs485|tac11|kws)/.test(name)) return "Связь и протоколы";
  if (/(display|oled|u8g|tm1637|led|button|encoder|touch|fpm)/.test(name)) return "Интерфейс и индикация";
  if (/(relay|gpio|servo|stepper|motor|pca|curtain|boiler|heating|dimer|dimmer)/.test(name)) return "Управление и приводы";
  if (/(sensor|analog|ads|adc|dht|bmp|bme|bh|ccs|ens|hx711|ina|vl53|counter|onewire|thermo|ntc)/.test(name)) return "Датчики и измерения";
  if (/(watch|status|system|internal|time|rtc|config|debug)/.test(name)) return "Система";
  return "Прочее";
}
const moduleCategoryOrder = ["Датчики и измерения", "Управление и приводы",
  "Интерфейс и индикация", "Связь и протоколы", "Система", "Прочее"];
async function loadEnums() {
  const d = await j("/api/enums"); state.enums = d.enums || {};
}
async function loadPio() {
  if (!state.env) return;
  const [chain, raw] = await Promise.all([
    j("/api/pio/env/" + state.env),
    j("/api/pio"),
  ]);
  const sections = {};
  chain.sections.forEach(s => { sections[s.section] = { exists: s.exists, items: { ...s.items } }; });
  state.pio = {
    section: chain.section, chain: chain.chain, sections,
    allSections: chain.all_sections, raw: raw.content, loaded: true,
    dirtySections: new Set(),
  };
  state.dirty.pio = false; state.dirty.pioRaw = false;
}
async function loadSource(path) {
  const d = await j("/api/source/" + path);
  state.sources.path = path; state.sources.src = d.content; render();
}
async function loadPorts() {
  const d = await j("/api/ports");
  const sel = $("#port"); const prev = sel.value; sel.innerHTML = "";
  if (!d.ports.length) {
    const o = document.createElement("option");
    o.textContent = lang === "ru" ? "— нет портов —" : "— no ports —";
    o.value = ""; sel.appendChild(o);
  }
  d.ports.forEach(p => { const o = document.createElement("option"); o.textContent = p; sel.appendChild(o); });
  if (prev && d.ports.includes(prev)) sel.value = prev;
  if (d.status.open) sel.value = d.status.port;
  updateSerialPortState(d);
  // Monitor only makes sense with a real USB port
  const mon = $("#btn-mon");
  mon.disabled = !d.ports.length;
  mon.title = mon.disabled
    ? (lang === "ru" ? "Нет доступных портов" : "No serial ports available")
    : (lang === "ru" ? "Открыть монитор порта" : "Open serial monitor");
  updateResetState();
}
function updateSerialPortState(d) {
  const el = $("#serial-state");
  if (!el) return;
  const open = !!d.status.open;
  el.className = "serial-state " + (open ? "connected" : (d.ports.length ? "disconnected" : "unavailable"));
  el.textContent = open
    ? "● " + d.status.port
    : (d.ports.length ? "○ " + (lang === "ru" ? "отключён" : "disconnected")
                      : "— " + (lang === "ru" ? "нет порта" : "no port"));
}
function updateResetState() {
  const btn = $("#btn-reset"); if (!btn) return;
  const sel = $("#port");
  const hasPort = sel && sel.value && sel.value.trim() && !sel.value.includes("—");
  btn.disabled = !hasPort;
  btn.title = hasPort
    ? (lang === "ru" ? "Перезапустить чип (через серийный порт)" : "Reset chip via serial")
    : (lang === "ru" ? "Нужен серийный порт — через OTA перезапуск недоступен"
                     : "Serial port required — not available over OTA");
}

// ---------- actions ----------
async function changeEnv(env) {
  if (state.dirty.personal && !confirm(t("confirm_discard"))) {
    $("#env").value = state.env; return;
  }
  state.env = env; localStorage.setItem("env", env);
  await Promise.all([loadPersonal(), loadPio()]);
  state.tab = "personal"; render();
}

async function createConfig(name, opts = {}) {
  try {
    await j("/api/configs", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name, pio_env: opts.pio_env, pio_extends: opts.pio_extends }) });
    if (opts.pio_env) await loadEnvs();
    await loadConfigsList();
    if (name + ".h" === state.env + ".h" || !state.env) {
      await loadPersonal();
    } else {
      state.env = name;
      const sel = $("#env");
      if (!Array.from(sel.options).some(o => o.value === name)) {
        const o = document.createElement("option"); o.textContent = name; sel.appendChild(o);
      }
      sel.value = name; await loadPersonal();
    }
    toast(t("saved"), "ok"); render();
  } catch(e){ toast(e.message, "err"); }
}

async function save() {
  try {
    if (state.dirty.personal && state.env) {
      await j("/api/configs/" + encodeURIComponent(state.env + ".h"),
        { method:"PUT", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ content: state.personal.src }) });
      state.dirty.personal = false;
    }
    if (state.dirty.common) {
      await j("/api/common", { method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ content: state.common.src }) });
      state.dirty.common = false;
    }
    if (state.dirty.pioRaw) {
      await j("/api/pio", { method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ content: state.pio.raw }) });
      state.dirty.pioRaw = false; state.dirty.pio = false;
      await loadPio();
    } else if (state.dirty.pio && state.pio.loaded) {
      for (const section of state.pio.dirtySections) {
        await j("/api/pio/section/" + encodeURIComponent(section),
          { method:"PUT", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ items: state.pio.sections[section].items }) });
      }
      state.dirty.pio = false; state.pio.dirtySections.clear();
      await loadPio();
    }
    toast(t("saved"), "ok");
    loadSourcesIndex();
    render();
  } catch(e){ toast(e.message, "err"); }
}

async function build() {
  if (!state.env) return toast(t("no_env"), "err");
  try { await j("/api/build", { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ env: state.env }) }); toast("build…"); } catch(e){ toast(e.message,"err"); }
}
async function upload(fs, both) {
  if (!state.env) return toast(t("no_env"), "err");
  if ((fs || both) && !state.isEsp)
    return toast(lang === "ru" ? "Загрузка FS доступна только для ESP" : "Upload FS is available only for ESP", "err");
  if ($("#upload-transport").value === "ota") {
    if (!state.isEsp) return toast(lang === "ru" ? "OTA доступно только для ESP" : "OTA is available only for ESP", "err");
    if (!state.ota || !state.ota.ip)
      return toast(lang === "ru" ? "Сначала выберите OTA-устройство" : "Select an OTA device first", "err");
    return otaUpload(state.ota.ip, state.env, fs, both);
  }
  const port = $("#port").value;
  try {
    await j("/api/upload", { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ env: state.env, port, fs, both }) });
    toast(both ? "upload FS+FW…" : (fs?"upload FS…":"upload…"));
  }
  catch(e){ toast(e.message,"err"); }
}

async function stopTask() {
  try {
    const r = await j("/api/stop", { method:"POST" });
    if (r.error) toast(r.error, "err"); else toast("stop sent");
  } catch(e){ toast(e.message,"err"); }
}

function setOtaTarget(ip, env) {
  state.ota = ip ? { ip, env: env || null } : null;
  if (state.ota) localStorage.setItem("ota", JSON.stringify(state.ota));
  else localStorage.removeItem("ota");
  renderOtaChip();
}
function loadOtaTarget() {
  try { state.ota = JSON.parse(localStorage.getItem("ota") || "null"); } catch { state.ota = null; }
  renderOtaChip();
}
function renderOtaChip() {
  const chip = $("#ota-chip");
  if (state.ota && state.ota.ip) {
    chip.classList.remove("hidden");
    chip.querySelector(".chip-ip").textContent = state.ota.ip + (state.ota.env ? " · " + state.ota.env : "");
    chip.title = `Pinned OTA target: ${state.ota.ip}. Select OTA to use it for upload.`;
  } else {
    chip.classList.add("hidden");
  }
  updateCleanState();
}
$("#ota-chip").onclick = (e) => {
  if (e.target.closest("#ota-clear") || e.target.closest("#ota-open")) return;
  openDevices();
};
$("#ota-clear").onclick = (e) => { e.stopPropagation(); setOtaTarget(null); toast("USB mode"); };
$("#ota-open").onclick = (e) => {
  e.stopPropagation();
  if (state.ota && state.ota.ip) window.open("http://" + state.ota.ip + "/", "_blank", "noopener");
};
async function openWebBuild() {
  const dlg = $("#dlg-web-build");
  const sel = $("#web-node");
  sel.innerHTML = `<option>${t("loading") || "loading…"}</option>`;
  sel.disabled = true;
  const okBtn = $("#web-build-ok"); okBtn.disabled = true;
  try {
    const info = await j("/api/web/node-versions");
    if (!info.has_web_app) { toast("web_app/ not found", "err"); return; }
    if (!info.available || !info.versions.length) {
      toast("no node versions installed via nvm (" + info.nvm_dir + ")", "err");
      return;
    }
    let saved = localStorage.getItem("web_build_node");
    const scriptSaved = localStorage.getItem("web_build_script");
    sel.innerHTML = "";
    // node-sass 9 + webpack 5 + webpack-dev-server 4 — Node 18 LTS is the
    // sweet spot (prebuilt node-sass bindings exist; Node 21+ is unsupported).
    const preferred = ["v18.19.0", "v18", "v20.10.0", "v20"];
    const major = v => parseInt(String(v).replace(/^v/, "").split(".")[0], 10) || 0;
    const nodeSassOk = v => { const m = major(v); return m >= 14 && m <= 20; };
    let picked = null;
    for (const p of preferred) {
      picked = info.versions.find(v => v === p || v.startsWith(p + "."));
      if (picked) break;
    }
    const defV = picked || info.default || info.versions[info.versions.length - 1];
    for (const v of info.versions) {
      const o = document.createElement("option");
      let label = v;
      if (v === defV) label += "  ★ recommended";
      else if (v === info.default) label += "  (nvm default)";
      if (!nodeSassOk(v)) label += "  ⚠ not supported by node-sass@9";
      o.value = v; o.textContent = label;
      sel.appendChild(o);
    }
    // Drop a saved choice that node-sass@9 cannot handle (e.g. v22).
    if (saved && !nodeSassOk(saved)) { localStorage.removeItem("web_build_node"); saved = null; }
    sel.value = (saved && info.versions.includes(saved)) ? saved : defV;
    $("#web-rebuild").checked = false;
    if (scriptSaved) $("#web-script").value = scriptSaved;
    sel.disabled = false; okBtn.disabled = false;
  } catch (e) {
    toast(e.message, "err"); return;
  }
  dlg.returnValue = "";
  dlg.showModal();
  const onClose = async () => {
    dlg.removeEventListener("close", onClose);
    if (dlg.returnValue !== "ok") return;
    const node = sel.value;
    const script = $("#web-script").value;
    const rebuild = $("#web-rebuild").checked;
    localStorage.setItem("web_build_node", node);
    localStorage.setItem("web_build_script", script);
    $("#drawer-build").classList.remove("hidden");
    try {
      await j("/api/web/build", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node, script, rebuild }) });
      toast(`UI build… (node ${node}${rebuild ? ", rebuild" : ""})`);
    } catch (e) { toast(e.message, "err"); }
  };
  dlg.addEventListener("close", onClose);
}

async function clean() {
  if (state.ota && state.ota.ip) { toast(t("clean_disabled_ota"), "err"); return; }
  if (!state.env) return;
  if (!confirm(t("clean_confirm", { env: state.env }))) return;
  try { await j("/api/clean", { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ env: state.env }) }); toast("clean…"); } catch(e){ toast(e.message,"err"); }
}
function updateCleanState() {
  const btn = $("#btn-clean"); if (!btn) return;
  const otaOn = !!(state.ota && state.ota.ip);
  btn.disabled = otaOn;
  btn.title = otaOn ? t("clean_disabled_ota")
    : "Remove .pio build artifacts (local, does not touch the chip)";
}
async function toggleMonitor() {
  const drawer = $("#drawer-serial");
  const opening = drawer.classList.contains("hidden");
  drawer.classList.toggle("hidden", !opening);
  $("#btn-mon").classList.toggle("primary", opening);
  if (opening) {
    await updateSerialStatus();
    setTimeout(() => $("#serial-send").focus(), 50);
  }
}

async function updateSerialStatus() {
  try {
    const d = await j("/api/ports");
    updateSerialPortState(d);
    const connect = $("#btn-serial-connect");
    const disconnect = $("#btn-serial-disconnect");
    if (connect) connect.disabled = d.status.open || !d.ports.length;
    if (disconnect) disconnect.disabled = !d.status.open;
    const el = $("#drawer-serial-status");
    if (!el) return;
    el.textContent = d.status.open
      ? `● ${d.status.port} @ ${d.status.baud}`
      : "○ not connected";
    el.style.color = d.status.open ? "var(--accent2)" : "var(--muted)";
  } catch {}
}
async function connectSerial() {
  const port = $("#port").value;
  const baud = parseInt($("#baud").value, 10);
  if (!port) return toast(lang === "ru" ? "нет порта" : "no port", "err");
  try {
    await j("/api/serial/open", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({port, baud})
    });
    $("#drawer-serial").classList.remove("hidden");
    toast(lang === "ru" ? "порт подключён" : "port connected", "ok");
  } catch (e) {
    toast(e.message, "err");
  }
  await loadPorts();
  await updateSerialStatus();
}
async function disconnectSerial() {
  try {
    await j("/api/serial/close", {method: "POST"});
    toast(lang === "ru" ? "порт отключён" : "port disconnected", "ok");
  } catch (e) {
    toast(e.message, "err");
  }
  await loadPorts();
  await updateSerialStatus();
}
async function resetChip() {
  try { await j("/api/serial/reset", {method:"POST"}); } catch(e){ toast(e.message,"err"); }
}

// The bottom dock is controlled by dragging its top edge. Keep the user's
// preferred height between sessions.
const dock = $("#drawers-dock");
const dockMin = () => Math.max(120, Math.round(window.innerHeight * 0.12));
const dockMax = () => Math.min(Math.round(window.innerHeight * 0.8), window.innerHeight - 80);
function setDockHeight(px) {
  const height = Math.max(dockMin(), Math.min(dockMax(), Math.round(px)));
  dock.style.setProperty("--dock-height", height + "px");
  localStorage.setItem("dock_height", String(height));
}
function restoreDockHeight() {
  const saved = parseInt(localStorage.getItem("dock_height") || "", 10);
  if (Number.isFinite(saved)) setDockHeight(saved);
}
let dockDrag = null;
function startDockDrag(e) {
  if (e.target !== dock) return;
  dockDrag = { y: e.clientY, height: dock.getBoundingClientRect().height };
  dock.setPointerCapture(e.pointerId);
  e.preventDefault();
}
dock.addEventListener("pointerdown", startDockDrag);
dock.addEventListener("pointermove", e => {
  if (!dockDrag) return;
  setDockHeight(dockDrag.height + dockDrag.y - e.clientY);
});
dock.addEventListener("pointerup", () => { dockDrag = null; });
dock.addEventListener("pointercancel", () => { dockDrag = null; });

function setDrawerFontSize(value) {
  const size = String(value);
  document.documentElement.style.setProperty("--drawer-font-size", size + "px");
  $$(".drawer-font-size").forEach(select => { select.value = size; });
  localStorage.setItem("drawer_font_size", size);
}
const savedDrawerFontSize = localStorage.getItem("drawer_font_size") || "12";
setDrawerFontSize(savedDrawerFontSize);
$$('.drawer-font-size').forEach(select => {
  select.onchange = e => setDrawerFontSize(e.target.value);
});

// ---------- SSE ----------
function pushLog(el, text, cls) {
  const span = document.createElement("span");
  if (cls) span.className = cls;
  span.textContent = text + "\n";
  el.appendChild(span);
  while (el.childNodes.length > 2000) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
}
function openStream(url, handler) {
  const es = new EventSource(url);
  es.onmessage = ev => { try { handler(JSON.parse(ev.data)); } catch {} };
  es.onerror = () => { es.close(); setTimeout(() => openStream(url, handler), 2000); };
}
let _runningSteps = 0;
function setRunning(running) {
  // Multiple start/end events arrive for chained tasks (fs+fw). The Stop
  // button stays visible as long as any step is in flight.
  _runningSteps = Math.max(0, _runningSteps + (running ? 1 : -1));
  $("#btn-stop").classList.toggle("hidden", _runningSteps === 0);
}
openStream("/api/stream/build", m => {
  const el = $("#log-build");
  if (m.type === "start") {
    pushLog(el, "▶ " + (m.label || m.cmd), "ok");
    if (m.label && m.label !== m.cmd) pushLog(el, "  $ " + m.cmd, "info");
    $("#drawer-build").classList.remove("hidden");
    setRunning(true);
  }
  else if (m.type === "line") pushLog(el, m.text);
  else if (m.type === "end")  { pushLog(el, "-- exit " + m.code + " --", m.code === 0 ? "ok" : "err"); setRunning(false); }
  else if (m.type === "error") pushLog(el, m.text, "err");
});
openStream("/api/stream/serial", m => {
  const el = $("#log-serial");
  if (m.type === "line")   pushLog(el, m.text);
  else if (m.type === "sent") pushLog(el, "> " + m.text, "sent");
  else if (m.type === "info") pushLog(el, m.text, "info");
  else if (m.type === "status") {
    pushLog(el, "-- " + (m.open ? "open " + m.port + "@" + m.baud : "closed") + " --", "info");
    updateSerialStatus();
  }
  else if (m.type === "error") pushLog(el, m.text, "err");
});

// ---------- events ----------
$("#env").onchange = e => changeEnv(e.target.value);
$("#project").onchange = e => changeProject(e.target.value);
$("#btn-project-refresh").onclick = async () => { await loadProjects(); render(); };
$("#btn-env-refresh").onclick = async () => { await loadEnvs(); await loadSourcesIndex(); toast("ok","ok"); };
$("#btn-env-new").onclick = () => {
  const dlg = $("#dlg-new"); $("#new-name").value = ""; dlg.showModal();
  dlg.onclose = () => {
    if (dlg.returnValue !== "ok") return;
    const name = $("#new-name").value;
    if (!name) return;
    createConfig(name, {
      pio_env: $("#new-pio").checked,
      pio_extends: $("#new-extends").value,
    });
  };
};
$("#btn-add-module").onclick = async () => {
  if (!state.modules.length) await loadModules();
  const dlg = $("#dlg-module"); const list = $("#mod-list"); list.innerHTML = "";
  $("#mod-filter").value = "";
  $("#mod-detail").innerHTML = `<p class="muted">${t("mod_pick") || "Pick a module…"}</p>`;
  $("#mod-add-btn").disabled = true;
  const existing = new Set(parseSource(state.personal.src).map(d => d.name));
  let chosen = null;
  const grouped = new Map();
  state.modules.forEach(m => {
    const category = moduleCategory(m);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(m);
  });
  [...grouped.keys()].sort((a, b) => moduleCategoryOrder.indexOf(a) - moduleCategoryOrder.indexOf(b))
    .forEach(category => {
    const heading = document.createElement("li");
    heading.className = "mod-category";
    heading.textContent = category;
    heading.dataset.category = category;
    list.appendChild(heading);
    grouped.get(category).sort((a, b) => a.name.localeCompare(b.name)).forEach(m => {
    const li = document.createElement("li");
    li.className = "mod-item";
    li.textContent = m.name;
    li.dataset.module = m.name;
    li.dataset.category = category;
    if (m.enable && existing.has(m.enable)) {
      li.classList.add("muted");
      li.title = "already in config";
    }
    li.onclick = () => {
      list.querySelectorAll(".mod-item").forEach(e => e.classList.remove("active"));
      li.classList.add("active");
      chosen = m; renderModuleDetail(m, existing);
      $("#mod-add-btn").disabled = false;
    };
    list.appendChild(li);
    });
  });
  $("#mod-filter").oninput = e => {
    const q = e.target.value.toLowerCase();
    list.querySelectorAll(".mod-item").forEach(el =>
      el.hidden = q && !el.textContent.toLowerCase().includes(q));
    list.querySelectorAll(".mod-category").forEach(el => {
      const hasVisible = [...list.querySelectorAll(`.mod-item[data-module]`)]
        .some(item => item.dataset.category === el.dataset.category && !item.hidden);
      el.hidden = !!q && !hasVisible;
    });
  };
  dlg.showModal();
  dlg.onclose = () => {
    if (dlg.returnValue !== "ok" || !chosen) return;
    const values = collectModuleValues(chosen);
    addModule(chosen, values);
  };
};

function renderModuleDetail(mod, existing) {
  const host = $("#mod-detail"); host.innerHTML = "";
  const h = document.createElement("h4");
  h.textContent = mod.name + (mod.enable ? "  —  " + mod.enable : "");
  host.appendChild(h);
  const desc = document.createElement("p"); desc.className = "desc";
  desc.textContent = mod.description || "—";
  host.appendChild(desc);

  const rows = [];
  if (mod.enable) rows.push({ name: mod.enable, type: "flag", default: "", required: true });
  mod.params.forEach(p => rows.push({ ...p, required: false }));

  rows.forEach(p => host.appendChild(renderModuleParamRow(mod, p, existing)));

  if (mod.deps.length) {
    const d = document.createElement("div"); d.className = "deps";
    d.innerHTML = "deps (other modules): " +
      mod.deps.map(x => `<code>${x}</code>`).join(" ");
    host.appendChild(d);
  }
}

function renderModuleParamRow(mod, p, existing) {
  const row = document.createElement("div"); row.className = "mod-param";
  if (p.required) row.classList.add("required");
  const cb = document.createElement("input"); cb.type = "checkbox";
  cb.checked = p.required || existing.has(p.name);
  cb.disabled = p.required;
  cb.dataset.param = p.name;
  const label = document.createElement("label");
  label.className = "n"; label.textContent = p.name;
  label.title = p.default ? "default: " + p.default : "";
  label.prepend(cb);

  const input = widgetFor(p);
  input.dataset.param = p.name;

  const type = document.createElement("span"); type.className = "type"; type.textContent = p.type;

  row.appendChild(label); row.appendChild(input); row.appendChild(type);
  // enable/disable the value input with the checkbox
  const sync = () => { input.disabled = !cb.checked; };
  cb.onchange = sync; sync();
  return row;
}

function widgetFor(p) {
  const n = p.name.toUpperCase(); const t_ = p.type;
  if (t_ === "serial") {
    const s = document.createElement("select"); s.className = "val";
    ["Serial","Serial1","Serial2"].forEach(v => {
      const o = document.createElement("option"); o.value = o.textContent = v; s.appendChild(o);
    });
    s.value = p.default || "Serial";
    return s;
  }
  if (t_ === "baud") {
    const s = document.createElement("input"); s.type = "text"; s.setAttribute("list","dl-baud");
    s.value = p.default || "115200"; return s;
  }
  if (t_ === "flag") {
    const s = document.createElement("input"); s.type = "text";
    s.placeholder = "(leave blank)"; s.value = p.default || ""; return s;
  }
  const i = document.createElement("input"); i.type = "text";
  i.value = p.default || "";
  i.placeholder = t_;
  return i;
}

function collectModuleValues(mod) {
  const out = {};
  $$("#mod-detail .mod-param").forEach(row => {
    const cb = row.querySelector("input[type=checkbox]");
    const input = row.querySelector("input[type=text], select");
    const name = cb.dataset.param;
    if (cb.checked) out[name] = input.value;
  });
  return out;
}
$("#btn-override").onclick = () => {
  const dlg = $("#dlg-override"); const list = $("#ov-list"); list.innerHTML = "";
  $("#ov-filter").value = "";
  const existing = new Set(parseSource(state.personal.src).map(d => d.name));
  Object.entries(state.defaults).sort().forEach(([n, v]) => {
    const row = document.createElement("label"); row.className = "ov-row";
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.value = n;
    cb.disabled = existing.has(n);
    const nm = document.createElement("span"); nm.className = "n"; nm.textContent = n;
    const vl = document.createElement("span"); vl.className = "v"; vl.textContent = v || "(empty)";
    vl.title = v || "";
    row.appendChild(cb); row.appendChild(nm); row.appendChild(vl);
    if (cb.disabled) row.title = "already defined in current config";
    list.appendChild(row);
  });
  $("#ov-filter").oninput = e => {
    const q = e.target.value.toLowerCase();
    list.querySelectorAll(".ov-row").forEach(el =>
      el.hidden = q && !el.textContent.toLowerCase().includes(q));
  };
  dlg.showModal();
  dlg.onclose = () => {
    if (dlg.returnValue !== "ok") return;
    const picked = Array.from(list.querySelectorAll("input:checked")).map(cb => cb.value);
    if (picked.length) addOverrides(picked);
  };
};
// Close any open <details class="menu"> after an item click, or on outside click
document.addEventListener("click", (e) => {
  const inItem = e.target.closest(".menu-item");
  if (inItem) {
    const d = inItem.closest("details.menu");
    if (d) d.open = false;
    return;
  }
  document.querySelectorAll("details.menu[open]").forEach(d => {
    if (!d.contains(e.target)) d.open = false;
  });
});

// ---------- Fullscreen handler for drawers ----------
document.querySelectorAll(".drawer-max").forEach(b => {
  b.onclick = () => {
    const dr = document.querySelector(b.dataset.target); if (!dr) return;
    const on = !dr.classList.contains("is-full");
    // only one fullscreen at a time
    document.querySelectorAll(".drawer.is-full").forEach(d => d.classList.remove("is-full"));
    document.querySelectorAll(".drawer-max.is-active").forEach(x => x.classList.remove("is-active"));
    if (on) { dr.classList.add("is-full"); b.classList.add("is-active"); b.textContent = "⤡"; }
    else { b.textContent = "⤢"; }
  };
});

// ---------- Device WS panel (ws://<ota.ip>:81, msg = "addr#value") ----------
const CHART_COLORS = ["#5aa9ff","#7af0b0","#ffb454","#b088ff","#ff6b7a","#4bc088","#f78fe1","#6fd6ff"];
const HISTORY_MAX = 500;
const dws = {
  sock: null, retries: 0, retryTimer: null,
  values: new Map(), rows: new Map(),  // addr -> row
  history: new Map(),                  // addr -> [{t,v}, …]
  pinned: new Set(),                   // addr pinned for chart
  colors: new Map(),                   // addr -> color
  filter: "",
  chartTimer: null,
};
function dwsSetStatus(text, color) {
  const el = $("#drawer-device-status");
  if (!el) return;
  el.textContent = text;
  el.style.color = color || "var(--muted)";
}
function dwsRenderRow(addr, val, ts) {
  const log = $("#log-device"); if (!log) return;
  let row = dws.rows.get(addr);
  if (!row) {
    row = document.createElement("div");
    row.className = "dws-row";
    row.dataset.addr = addr;
    row.innerHTML = `
      <button class="dws-pin" title="Add to live chart">+ chart</button>
      <span class="dws-addr"></span>
      <span class="dws-val"></span>
      <span class="dws-hits" title="messages received">1</span>
      <span class="dws-ts" title="last update"></span>
      <button class="dws-send" title="Send a value to this address">↑</button>`;
    row.querySelector(".dws-addr").textContent = addr;
    row.querySelector(".dws-pin").onclick = (e) => {
      e.stopPropagation(); dwsTogglePin(addr);
    };
    row.querySelector(".dws-send").onclick = (e) => {
      e.stopPropagation(); dwsPromptSend(addr);
    };
    row.onclick = (e) => {
      if (e.target.closest("button")) return;
      dwsTogglePin(addr);
    };
    log.appendChild(row);
    dws.rows.set(addr, row);
    dwsApplyFilter();
    row._hits = 0;
    if (dws.pinned.has(addr)) row.classList.add("is-pinned");
  }
  row._hits = (row._hits || 0) + 1;
  row.querySelector(".dws-val").textContent = val;
  row.querySelector(".dws-hits").textContent = row._hits;
  row.querySelector(".dws-ts").textContent =
    new Date(ts).toTimeString().slice(0, 8);
  row.classList.remove("dws-pulse"); void row.offsetWidth;
  row.classList.add("dws-pulse");

  // history buffer (ring, numeric only)
  if (typeof val === "number") {
    let h = dws.history.get(addr);
    if (!h) { h = []; dws.history.set(addr, h); }
    h.push({ t: ts, v: val });
    if (h.length > HISTORY_MAX) h.splice(0, h.length - HISTORY_MAX);
  }
}

function dwsTogglePin(addr) {
  if (dws.pinned.has(addr)) {
    dws.pinned.delete(addr); dws.colors.delete(addr);
  } else {
    // ensure numeric history exists; warn otherwise but still pin
    const h = dws.history.get(addr);
    const v = dws.values.get(addr);
    if (!h && typeof v !== "number") {
      toast(lang === "ru"
        ? "Нет числовых значений для графика (пока)"
        : "No numeric value yet — chart will fill as data arrives", "err");
    }
    dws.pinned.add(addr);
    const used = new Set(dws.colors.values());
    const c = CHART_COLORS.find(x => !used.has(x)) || CHART_COLORS[dws.pinned.size % CHART_COLORS.length];
    dws.colors.set(addr, c);
    // auto-open chart panel on first pin
    const panel = $("#dev-chart");
    if (panel.classList.contains("hidden")) {
      panel.classList.remove("hidden");
      $("#btn-ws-chart").classList.add("is-active");
      if (!dws.chartTimer) dws.chartTimer = setInterval(dwsChartTick, 1000);
    }
  }
  const row = dws.rows.get(addr);
  if (row) {
    row.classList.toggle("is-pinned", dws.pinned.has(addr));
    const btn = row.querySelector(".dws-pin");
    if (btn) btn.textContent = dws.pinned.has(addr) ? "✓ pinned" : "+ chart";
  }
  dwsRenderChart();
}

function dwsRenderChart() {
  const svg = $("#chart-svg"); const legend = $("#chart-legend");
  const hint = $("#chart-hint");
  if (!svg || !legend) return;
  legend.innerHTML = "";
  const addrs = Array.from(dws.pinned);
  if (hint) {
    hint.innerHTML = addrs.length
      ? `${addrs.length} pinned · ${(dws.history.size)} tracked addresses`
      : `no pins — click <b>+ chart</b> on any numeric row below`;
  }
  if (!addrs.length) {
    svg.innerHTML = `<text x="50%" y="50%" fill="var(--muted)" text-anchor="middle"
      dominant-baseline="middle" font-size="13" font-family="var(--mono)">
      pin an address with "+ chart" to start plotting</text>`;
    return;
  }
  // viewBox: 0..W = time (now-WINDOW..now), 0..H = value range (reversed)
  const rect = svg.getBoundingClientRect();
  const W = Math.max(300, rect.width), H = Math.max(100, rect.height);
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const nowMs = Date.now();
  const winSel = $("#chart-window");
  const WINDOW_MS = winSel ? parseInt(winSel.value, 10) : 60000;
  let t0;
  if (WINDOW_MS === 0) {
    // "all history" — compute span from oldest point across pinned series
    let oldest = nowMs;
    addrs.forEach(a => {
      const h = dws.history.get(a);
      if (h && h.length) oldest = Math.min(oldest, h[0].t);
    });
    t0 = oldest;
  } else {
    t0 = nowMs - WINDOW_MS;
  }
  const span = Math.max(1, nowMs - t0);

  // collect series within window
  const auto = $("#chart-autoscale").checked;
  let yMin = Infinity, yMax = -Infinity;
  const series = addrs.map(addr => {
    const h = (dws.history.get(addr) || []).filter(p => p.t >= t0);
    h.forEach(p => { if (p.v < yMin) yMin = p.v; if (p.v > yMax) yMax = p.v; });
    return { addr, color: dws.colors.get(addr), points: h };
  });
  if (!isFinite(yMin)) { yMin = 0; yMax = 1; }
  if (!auto) {
    const span = yMax - yMin;
    yMin = Math.floor(yMin - span * 0.05);
    yMax = Math.ceil(yMax + span * 0.05);
  }
  if (yMin === yMax) { yMin -= 0.5; yMax += 0.5; }
  const sx = t => ((t - t0) / span) * W;
  const sy = v => H - ((v - yMin) / (yMax - yMin)) * H;

  let gridLines = "";
  for (let i = 1; i < 4; i++) {
    const yv = yMin + (yMax - yMin) * (i / 4);
    const yy = sy(yv);
    gridLines += `<text x="4" y="${yy - 2}" font-size="9" fill="var(--muted-2)"
      font-family="var(--mono)">${yv.toFixed(2)}</text>`;
  }

  const paths = series.map(s => {
    if (!s.points.length) return "";
    const d = s.points.map((p, i) => (i ? "L" : "M") + sx(p.t).toFixed(1) + "," + sy(p.v).toFixed(1)).join(" ");
    return `<path d="${d}" stroke="${s.color}" />`;
  }).join("");

  svg.innerHTML = gridLines + paths;

  // legend chips
  series.forEach(s => {
    const last = s.points.length ? s.points[s.points.length - 1].v : null;
    const chip = document.createElement("span");
    chip.className = "lg";
    chip.innerHTML = `<span class="sw"></span><span class="nm"></span>
      <span class="cur"></span><span class="rm">×</span>`;
    chip.querySelector(".sw").style.background = s.color;
    chip.querySelector(".nm").textContent = s.addr;
    chip.querySelector(".cur").textContent = last != null ? "= " + last : "—";
    chip.onclick = () => dwsTogglePin(s.addr);
    legend.appendChild(chip);
  });
}

function dwsChartTick() {
  if ($("#dev-chart").classList.contains("hidden")) return;
  dwsRenderChart();
}
function dwsApplyFilter() {
  const q = dws.filter.toLowerCase();
  dws.rows.forEach((row, addr) => {
    row.style.display = !q || addr.toLowerCase().includes(q) ? "" : "none";
  });
}
function dwsPromptSend(addr) {
  const prev = dws.values.get(addr);
  const v = prompt(`send ${addr} = ?`, prev != null ? String(prev) : "");
  if (v == null) return;
  dwsSend(addr, v);
}
function dwsSend(addr, val) {
  if (!dws.sock || dws.sock.readyState !== 1) return toast("WS not open", "err");
  dws.sock.send(addr + "#" + val);
  toast(`→ ${addr}#${val}`, "ok");
}
function dwsConnect() {
  dwsDisconnect(false);
  if (!state.ota || !state.ota.ip) {
    dwsSetStatus("no OTA target", "var(--warn)"); return;
  }
  const url = "ws://" + state.ota.ip + ":81";
  dwsSetStatus("connecting " + url, "var(--warn)");
  let s;
  try { s = new WebSocket(url); }
  catch (e) { dwsSetStatus("fail: " + e.message, "var(--danger)"); return dwsScheduleReconnect(); }
  dws.sock = s;
  s.onopen = () => { dws.retries = 0; dwsSetStatus("● " + url, "var(--accent-2)"); };
  s.onclose = () => { dwsSetStatus("○ closed", "var(--muted)"); dwsScheduleReconnect(); };
  s.onerror = () => { dwsSetStatus("× error", "var(--danger)"); };
  s.onmessage = (ev) => {
    const raw = String(ev.data || "");
    const i = raw.indexOf("#");
    if (i < 0) return;
    const addr = raw.slice(0, i);
    const rest = raw.slice(i + 1);
    const n = parseFloat(rest);
    const val = (Number.isFinite(n) && String(n) === rest.trim()) ? n : rest;
    dws.values.set(addr, val);
    dwsRenderRow(addr, val, Date.now());
  };
}
function dwsScheduleReconnect() {
  clearTimeout(dws.retryTimer);
  if (!state.ota || !state.ota.ip) return;
  const delay = Math.min(10000, 1000 + dws.retries * 500);
  dws.retries++;
  dws.retryTimer = setTimeout(dwsConnect, delay);
}
function dwsDisconnect(resetUI = true) {
  clearTimeout(dws.retryTimer);
  if (dws.sock) {
    try { dws.sock.onclose = null; dws.sock.close(); } catch {}
    dws.sock = null;
  }
  if (resetUI) dwsSetStatus("—");
}
function dwsClear() {
  dws.rows.clear(); dws.values.clear();
  $("#log-device").innerHTML = "";
}
function updateDeviceButton() {
  const btn = $("#btn-device"); if (!btn) return;
  const on = !!(state.ota && state.ota.ip);
  btn.disabled = !on;
  btn.title = on ? "Live WS to " + state.ota.ip + ":81"
                 : "Pin an OTA target first (⌾ net)";
}
function toggleDeviceDrawer() {
  const dr = $("#drawer-device");
  if (!dr) return;
  if (dr.classList.contains("hidden")) {
    dr.classList.remove("hidden");
    dwsConnect();
  } else {
    dr.classList.add("hidden");
    dwsDisconnect();
  }
}

$("#btn-ws-chart").onclick = () => {
  const panel = $("#dev-chart");
  const on = panel.classList.toggle("hidden") === false;
  $("#btn-ws-chart").classList.toggle("is-active", on);
  if (on) { dwsRenderChart(); if (!dws.chartTimer) dws.chartTimer = setInterval(dwsChartTick, 1000); }
  else    { clearInterval(dws.chartTimer); dws.chartTimer = null; }
};
$("#btn-chart-clear").onclick = () => {
  dws.pinned.clear(); dws.colors.clear();
  dws.rows.forEach(r => r.classList.remove("is-pinned"));
  dwsRenderChart();
};
$("#chart-autoscale").addEventListener("change", dwsRenderChart);
$("#chart-window").addEventListener("change", dwsRenderChart);

$("#btn-device").onclick = toggleDeviceDrawer;
$("#btn-device-close").onclick = () => { $("#drawer-device").classList.add("hidden"); dwsDisconnect(); };
$("#btn-ws-reconnect").onclick = () => { dws.retries = 0; dwsConnect(); };
$("#btn-ws-clear").onclick = dwsClear;
$("#btn-ws-send").onclick = () => {
  const s = prompt("addr#value", "");
  if (!s) return;
  const i = s.indexOf("#"); if (i < 0) return toast("format: addr#value", "err");
  dwsSend(s.slice(0, i), s.slice(i + 1));
};
$("#dev-ws-filter").addEventListener("input", (e) => {
  dws.filter = e.target.value.trim();
  dwsApplyFilter();
});
// hook OTA chip updates
const _origRenderOta = renderOtaChip;
renderOtaChip = function () { _origRenderOta.apply(this, arguments); updateDeviceButton(); };
updateDeviceButton();

$("#btn-port-refresh").onclick = () => loadPorts();
$("#port").addEventListener("change", () => { updateResetState(); updateSerialStatus(); });
$("#upload-transport").addEventListener("change", e => {
  state.transport = e.target.value;
  localStorage.setItem("upload_transport", state.transport);
  updateTransportState();
});
$("#btn-save").onclick = save;
$("#btn-build").onclick = build;
$("#btn-upload").onclick = () => upload(false, false);
$("#btn-uploadfs").onclick = () => upload(true, false);
$("#btn-upload-both").onclick = () => upload(false, true);
$("#btn-stop").onclick = stopTask;
$("#btn-clean").onclick = clean;
$("#btn-web-build").onclick = openWebBuild;
$("#btn-mon").onclick = toggleMonitor;
$("#btn-reset").onclick = resetChip;
$("#btn-clear-build").onclick = () => $("#log-build").textContent = "";
$("#btn-clear-serial").onclick = () => $("#log-serial").textContent = "";
$("#btn-build-log").onclick = () => $("#drawer-build").classList.toggle("hidden");
$("#btn-build-close").onclick = () => $("#drawer-build").classList.add("hidden");
$("#btn-serial-close").onclick = () => {
  $("#drawer-serial").classList.add("hidden");
  $("#btn-mon").classList.remove("primary");
};
$("#btn-serial-connect").onclick = connectSerial;
$("#btn-serial-disconnect").onclick = disconnectSerial;
$("#btn-reset-dr").onclick = resetChip;
$("#btn-devices").onclick = openDevices;

// ---------- Devices / OTA ----------
async function openDevices() {
  const dlg = $("#dlg-devices");
  if (!$("#dev-subnet").value) {
    try { $("#dev-subnet").value = (await j("/api/net/subnet")).subnet; } catch {}
  }
  $("#dev-list").innerHTML = "";
  $("#dev-status").textContent = "";
  dlg.showModal();
}

// ---------- device discovery (shared busy / confirm-replace) ----------
let _devBusy = false;
function devHasResults() {
  const list = $("#dev-list");
  return list && list.querySelector(".dev-card");
}
function setDevBusy(on, label) {
  _devBusy = !!on;
  const status = $("#dev-status");
  ["#dev-scan", "#dev-ssdp", "#dev-probe"].forEach(sel => {
    const b = $(sel); if (b) b.disabled = _devBusy;
  });
  if (on) {
    status.textContent = label || "…";
    status.style.color = "var(--warn)";
    status.classList.add("is-busy");
  } else {
    status.classList.remove("is-busy");
  }
}
async function runDiscovery(opts) {
  // opts: { busyLabel, run (async fn returning {devices, status}) }
  if (_devBusy) {
    toast(lang === "ru" ? "Уже идёт поиск…" : "Already scanning…", "err");
    return;
  }
  if (devHasResults()) {
    const msg = lang === "ru"
      ? "Заменить текущие результаты?"
      : "Replace current results?";
    if (!confirm(msg)) return;
  }
  setDevBusy(true, opts.busyLabel);
  $("#dev-list").innerHTML = "";
  const status = $("#dev-status");
  try {
    const res = await opts.run();
    renderDevices(res.devices || []);
    status.textContent = res.status || `${(res.devices || []).length} found`;
    status.style.color = "var(--muted)";
  } catch (e) {
    status.textContent = e.message;
    status.style.color = "var(--danger)";
  } finally {
    setDevBusy(false);
  }
}

$("#dev-scan").onclick = () => runDiscovery({
  busyLabel: t("scanning"),
  run: async () => {
    const sub = $("#dev-subnet").value.trim();
    const d = await j("/api/net/scan", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ subnet: sub }) });
    return { devices: d.devices, status: `${d.devices.length} on ${d.subnet}` };
  },
});

$("#dev-ssdp").onclick = () => runDiscovery({
  busyLabel: t("ssdp_scanning"),
  run: async () => {
    const d = await j("/api/net/ssdp", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ timeout: 3.0 }) });
    return { devices: d.devices, status: `${d.devices.length} via SSDP` };
  },
});

$("#dev-probe").onclick = () => {
  const ip = $("#dev-ip").value.trim(); if (!ip) return;
  return runDiscovery({
    busyLabel: "…",
    run: async () => {
      const d = await j("/api/net/probe/" + encodeURIComponent(ip));
      return {
        devices: d.info ? [d.info] : [],
        status: d.info ? "" : ("no response" + (d.error ? " · " + d.error : "")),
      };
    },
  });
};

async function renderDevices(devices) {
  const list = $("#dev-list"); list.innerHTML = "";
  if (!devices.length) {
    const p = document.createElement("p"); p.className = "muted"; p.textContent = t("no_dev");
    list.appendChild(p); return;
  }
  let firmware = [];
  try { firmware = (await j("/api/firmware/known")).firmware; } catch {}
  const byEnv = new Map(firmware.map(f => [f.env, f]));

  devices.forEach(info => {
    const card = document.createElement("div"); card.className = "dev-card";
    const configName = info.config_name || "";
    const envGuess = configName;  // config name === env name by project convention
    const localFw = byEnv.get(envGuess);
    let state = "unknown", tagText = t("tag_unknown");
    const devStamp = Date.parse((info.flash_date || "") + " " + (info.flash_timestamp || "").split(" ").slice(-1)[0] || "");
    if (localFw) {
      const localMs = localFw.mtime * 1000;
      const devMs = parseDeviceTimestamp(info);
      if (devMs && devMs >= localMs - 60_000) { state = "current"; tagText = t("tag_current"); }
      else { state = "outdated"; tagText = t("tag_outdated"); }
    }
    card.classList.add(state);

    const left = document.createElement("div");
    left.innerHTML = `<div class="ip">${info.ip}</div>
                      <span class="dev-tag ${state}">${tagText}</span>`;

    const meta = document.createElement("div"); meta.className = "meta";
    const items = [
      ["name", info.name], ["fr", info.fr_name], ["ver", info.version],
      ["config", info.config_name], ["built", info.flash_date],
      ["uptime", info.run_time ? (Math.round(info.run_time / 60000) + " min") : null],
      ["ssdp", info.ssdp ? info.ssdp.SERVER : null],
    ].filter(([, v]) => v);
    meta.innerHTML = items.map(([k, v]) => `<span><b>${k}:</b>${v}</span>`).join("");

    const actions = document.createElement("div"); actions.className = "actions";
    // A discovered device may report a different installed config. Keep the
    // selected env as the upload source; safeCheckBeforeOta will require an
    // explicit confirmation when the two differ.
    const envUse = $("#env").value;
    const btnSel = document.createElement("button");
    const picked = state.ota && state.ota.ip === info.ip;
    btnSel.className = picked ? "primary is-picked" : "primary";
    btnSel.textContent = picked ? "✓ " + t("select") : "⌾ " + t("select");
    btnSel.title = t("select_hint");
    btnSel.onclick = () => {
      setOtaTarget(info.ip, envUse);
      toast(`OTA target ← ${info.ip}`, "ok");
      $("#dlg-devices").close("cancel");
    };
    const btnFw = document.createElement("button");
    btnFw.className = "ghost"; btnFw.textContent = "⚡ " + t("ota_upload");
    btnFw.disabled = !state.isEsp;
    btnFw.onclick = () => { $("#upload-transport").value = "ota"; updateTransportState(); otaUpload(info.ip, envUse, false); };
    const btnFs = document.createElement("button");
    btnFs.className = "ghost"; btnFs.textContent = "⚡ " + t("ota_uploadfs");
    btnFs.disabled = !state.isEsp;
    btnFs.onclick = () => { $("#upload-transport").value = "ota"; updateTransportState(); otaUpload(info.ip, envUse, true); };
    actions.append(btnSel, btnFw, btnFs);

    card.append(left, meta, actions);
    list.appendChild(card);
  });
}

function parseDeviceTimestamp(info) {
  // Try parsing __TIMESTAMP__ (e.g. "Sun Jan 1 12:34:56 2024"); fall back to __DATE__ only.
  const t = info.flash_timestamp || info.flash_date;
  if (!t) return null;
  const ms = Date.parse(t);
  return isNaN(ms) ? null : ms;
}

async function otaUpload(ip, envHint, fs, both, opts) {
  if (!state.isEsp) {
    toast(lang === "ru" ? "OTA доступно только для ESP" : "OTA is available only for ESP", "err");
    return;
  }
  const env = envHint || $("#env").value;
  if (!env) { toast(t("no_env"), "err"); return; }
  const skipSafe = opts && opts.skipSafe;
  if (!skipSafe) {
    const ok = await safeCheckBeforeOta(ip, env);
    if (!ok) return;
  }
  try {
    await j("/api/ota", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ip, env, fs, both }) });
    toast(`OTA ${both ? "fs+fw " : (fs ? "fs " : "")}→ ${ip}`, "ok");
    $("#drawer-build").classList.remove("hidden");
  } catch(e){ toast(e.message, "err"); }
}

// Safe-mode OTA guard. Probe /info and only proceed silently when the device's
// config_name equals the env we are about to flash. Any mismatch (or no answer)
// pops a confirmation modal; returns true to proceed, false to abort.
async function safeCheckBeforeOta(ip, env) {
  toast(t("safe_probing"));
  let info = null, probeErr = null;
  try {
    const d = await j("/api/net/probe/" + encodeURIComponent(ip));
    info = d.info || null; probeErr = d.error || null;
  } catch (e) { probeErr = e.message; }
  if (info && info.config_name && info.config_name === env) return true;
  return await showSafeConfirm({ ip, env, info, probeErr });
}

function showSafeConfirm({ ip, env, info, probeErr }) {
  const dlg = $("#dlg-safe");
  const body = $("#safe-body");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const rows = [[t("safe_target"), ip], [t("safe_env"), env]];
  if (info) {
    const items = [
      ["config_name", info.config_name], ["name", info.name], ["fr_name", info.fr_name],
      ["version", info.version], ["flash_date", info.flash_date],
    ].filter(([,v]) => v);
    items.forEach(([k,v]) => rows.push([k, v]));
  } else {
    rows.push([t("safe_device"), t("safe_no_info") + (probeErr ? " · " + probeErr : "")]);
  }
  body.innerHTML = '<table style="border-collapse:collapse;font:12px/1.4 ui-monospace,Menlo,monospace">'
    + rows.map(([k,v]) => {
        const mismatch = (k === "config_name" && v !== env);
        const style = mismatch ? ' style="color:var(--danger);font-weight:600"' : "";
        return `<tr><td style="padding:2px 10px 2px 0;color:var(--muted)">${esc(k)}</td><td${style}>${esc(v)}</td></tr>`;
      }).join("")
    + "</table>"
    + '<label class="safe-confirm"><input id="safe-confirm-check" type="checkbox"> '
    + esc(t("safe_confirm_check")) + "</label>";
  const proceed = dlg.querySelector('[value="ok"]');
  const check = $("#safe-confirm-check");
  proceed.disabled = true;
  check.onchange = () => { proceed.disabled = !check.checked; };
  toast(t("safe_notice"), "warn");
  return new Promise(resolve => {
    dlg.onclose = () => resolve(dlg.returnValue === "ok");
    dlg.showModal();
  });
}
$("#search").oninput = e => { state.search = e.target.value; render(); };
$$(".tab").forEach(b => b.onclick = async () => {
  state.tab = b.dataset.tab;
  if (state.tab === "common" && !state.common.loaded) await loadCommon();
  if (state.tab === "pio") await loadPio();
  if (state.tab === "sources" && !Object.keys(state.sources.groups).length) await loadSourcesIndex();
  render();
});
$("#pio-raw").oninput = e => { state.pio.raw = e.target.value; state.dirty.pioRaw = true; render(); };
$("#btn-view-source").onclick = async () => {
  if (!state.env) return;
  const p = "src/configs/" + state.env + ".h";
  await loadSource(p); state.tab = "sources"; render();
};
$("#btn-add-param").onclick = () => {
  const dlg = $("#dlg-add");
  $("#add-name").value = ""; $("#add-value").value = ""; $("#add-comment").value = "";
  dlg.showModal();
  dlg.onclose = () => {
    if (dlg.returnValue !== "ok") return;
    const n = $("#add-name").value.trim(); if (!n) return;
    addParameter(n, $("#add-value").value.trim(), $("#add-comment").value.trim());
  };
};
$("#serial-form").onsubmit = async e => {
  e.preventDefault();
  const inp = $("#serial-send"); const text = inp.value; if (!text) return;
  try { await j("/api/serial/send", { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ text }) }); inp.value = ""; } catch(err){ toast(err.message,"err"); }
};
$("#serial-hex-form").onsubmit = async e => {
  e.preventDefault();
  const inp = $("#serial-hex-send"); const hex = inp.value.trim(); if (!hex) return;
  try { await j("/api/serial/send_hex", { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ hex }) }); inp.value = ""; } catch(err){ toast(err.message,"err"); }
};
window.addEventListener("beforeunload", e => {
  if (state.dirty.personal || state.dirty.common) { e.preventDefault(); e.returnValue = ""; }
});

// ---------- init ----------
applyLang();
restoreDockHeight();
loadOtaTarget();
loadProjects().then(() => Promise.all([loadEnvs(), loadCommon(), loadModules(), loadEnums(), loadSourcesIndex()]))
  .then(loadPio).then(render);
loadPorts();
