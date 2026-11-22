"use strict";

const FAQ_CATEGORIES = [0,0,4,1,1,4,0,1,1,1,1,2,2,2,2,2,3,3,3,4,3,3,5,5,5,1,3,3];
const FAQ_ORDER = [26,27,...Array.from({length:26},(_,id)=>id)];
const MAP_POSTERS = {26:"vax-switch-server-view-en.png",27:"vax-hide-state-trucks-en.png"};
const TOPIC_ART = [
  ["0%", "0%", "⌂", "#ffc570"],
  ["50%", "100%", "▣", "#e8bd6e"],
  ["0%", "100%", "⚔", "#ef8795"],
  ["0%", "0%", "⚑", "#a3cba4"],
  ["50%", "0%", "◷", "#77c8e1"],
  ["100%", "100%", "✦", "#cfabed"]
];
const FAQ_LINKS = {4:"hq.html",5:"hq.html",6:"vehicles.html",7:"vehicles.html",11:"heroes.html",12:"heroes.html",13:"heroes.html",14:"heroes.html",15:"heroes.html",16:"vehicles.html",17:"vehicles.html",18:"vehicles.html",22:"heroes.html",23:"heroes.html"};
const ALIASES = {0:"arena reset timer diamonds",1:"apocalypse reset bounty truck",2:"refugee tickets orange free",3:"badge shop diamond refresh",4:"ar alliance recognition double reward",5:"help lab research",6:"fuel regeneration gas 40 150",7:"truck orange gear snapshot",8:"bounty book timer star",9:"website free pass point shop check in",10:"skill books recycling 1000 diamonds",11:"faction blood rose wings of dawn guard of order",12:"alloy power core forging stone exclusive weapon",13:"f1 low spender",14:"f2 low spender hq30",15:"f3 champion duel",16:"rss gathering wall defense",17:"boomer auto join 500 600",18:"canyon svs diamond mine treasure",19:"diplomat refugee help 90 30 45",20:"helicopter treasure tap shadow",21:"treasure double x2 time",22:"hero battlefield replay 20",23:"furylord faction",24:"tyrant rally",25:"vip10 diamond orange universal fragment"};
const LANGUAGE_KEY = "last-z-791-language";
const CHECKLIST_KEY = "vax-tips-checklist-v1";
const $ = id => document.getElementById(id);
const validLanguage = lang => Object.hasOwn(TIPS_DATA, lang);

function readSaved(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The guide also works when browser storage is unavailable.
  }
}

function readChecklist() {
  try {
    const saved = JSON.parse(readSaved(CHECKLIST_KEY, "[]"));
    return Array.from({length: 8}, (_, index) => saved[index] === true);
  } catch {
    return Array(8).fill(false);
  }
}

const requested = new URLSearchParams(location.search).get("lang");
const browserLanguage = (navigator.language || "en").split("-")[0];
let language = [requested, readSaved(LANGUAGE_KEY, ""), browserLanguage, "en"].find(validLanguage);
let selectedCategory = null;
let query = "";
let checkedTasks = readChecklist();
let expandedQuestions = new Set([0]);

function normalize(value) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase();
}

function updateLocation() {
  const url = new URL(location.href);
  url.searchParams.set("lang", language);
  try {
    history.replaceState(null, "", url);
  } catch {
    // Some local-file viewers restrict history updates.
  }
}

function applyLanguage() {
  const content = TIPS_DATA[language];
  const ui = content.ui;
  document.documentElement.lang = language === "zh" ? "zh-Hans" : language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.title = ui[0] + " · VAX Academy";
  $("language").value = language;
  const labels = {
    "page-title": 0,
    "intro": 1,
    "search-label": 3,
    "all-topics": 4,
    "no-results": 5,
    "daily-title": 7,
    "daily-help": 8,
    "reset-checklist": 9,
    "expand": 11,
    "collapse": 12,
    "language-label": 15,
    "clear-search": 16,
    "event-note": 17,
    "topics-title": 20,
    "start-link": 21,
    "routine-link": 22,
    "related-title": 23
  };
  for (const [id, index] of Object.entries(labels)) {
    $(id).textContent = ui[index];
  }
  $("search").placeholder = ui[2];
  $("daily-meter").setAttribute("aria-label", ui[18]);
  $("home").textContent = (language === "ar" ? "→ " : "← ") + ui[13];
  $("back-top").textContent = ui[10] + " ↑";

  renderTopics();
  renderChecklist();
  renderQuestions();
  renderRelated();
  save(LANGUAGE_KEY, language);
  updateLocation();
}

function renderTopics() {
  const content = TIPS_DATA[language];
  $("topic-grid").replaceChildren(...content.categories.map(([title, description], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "topic-card";
    button.setAttribute("aria-pressed", selectedCategory === index ? "true" : "false");
    button.setAttribute("aria-controls", "questions");
    const [x, y, icon, accent] = TOPIC_ART[index];
    button.style.setProperty("--x", x);
    button.style.setProperty("--y", y);
    button.style.setProperty("--accent", accent);

    const symbol = document.createElement("span");
    symbol.className = "topic-icon";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = icon;
    const heading = document.createElement("span");
    heading.className = "topic-title";
    heading.textContent = title;
    const subtitle = document.createElement("span");
    subtitle.className = "topic-desc";
    subtitle.textContent = description;
    const count = document.createElement("span");
    count.className = "topic-count";
    count.textContent = new Intl.NumberFormat(language).format(FAQ_CATEGORIES.filter(category => category === index).length) + " " + content.ui[6];
    button.append(symbol, heading, subtitle, count);
    button.addEventListener("click", () => {
      selectedCategory = index;
      renderTopics();
      renderQuestions();
      $("guide").scrollIntoView({block: "start"});
    });
    return button;
  }));
}

function renderChecklist() {
  const content = TIPS_DATA[language];
  $("checklist").replaceChildren(...content.daily.map((title, index) => {
    const label = document.createElement("label");
    label.className = "check-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checkedTasks[index];
    const text = document.createElement("span");
    text.textContent = title;
    checkbox.addEventListener("change", () => {
      checkedTasks[index] = checkbox.checked;
      save(CHECKLIST_KEY, JSON.stringify(checkedTasks));
      updateProgress();
    });
    label.append(checkbox, text);
    return label;
  }));
  updateProgress();
}

function updateProgress() {
  const number = new Intl.NumberFormat(language);
  const completed = checkedTasks.filter(Boolean).length;
  $("daily-progress").textContent = number.format(completed) + " / " + number.format(8) + " · " + TIPS_DATA[language].ui[19];
  $("daily-meter").value = completed;
}

function visibleQuestionIds() {
  const tokens = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return TIPS_DATA[language].faq.flatMap(([question, answer], id) => {
    const inCategory = selectedCategory === null || FAQ_CATEGORIES[id] === selectedCategory;
    const english = TIPS_DATA.en.faq[id].join(" ");
    const haystack = normalize(question + " " + answer + " " + english + " " + (ALIASES[id] || ""));
    return inCategory && tokens.every(token => haystack.includes(token)) ? [id] : [];
  });
}

function renderQuestions() {
  const content = TIPS_DATA[language];
  const ids = visibleQuestionIds();
  const number = new Intl.NumberFormat(language);
  $("result-count").textContent = number.format(ids.length) + " " + content.ui[6];
  $("faq-title").textContent = selectedCategory === null ? content.ui[4] : content.categories[selectedCategory][0];
  $("all-topics").setAttribute("aria-pressed", selectedCategory === null ? "true" : "false");
  $("clear-search").hidden = query.length === 0;
  $("no-results").hidden = ids.length !== 0;
  $("expand").disabled = ids.length === 0;
  $("collapse").disabled = ids.length === 0;
  const groups = content.categories.flatMap(([title], category) => {
    const questionIds = FAQ_ORDER.filter(id => ids.includes(id) && FAQ_CATEGORIES[id] === category);
    if (questionIds.length === 0) return [];
    const group = document.createElement("section");
    group.className = "faq-group";
    const heading = document.createElement("h3");
    heading.className = "group-heading";
    heading.id = "group-" + category;
    heading.textContent = title;
    group.setAttribute("aria-labelledby", heading.id);
    group.append(heading, ...questionIds.map(createQuestion));
    return [group];
  });
  $("questions").replaceChildren(...groups);
}

function createQuestion(id) {
  const content = TIPS_DATA[language];
  const [question, answer] = content.faq[id];
  const details = document.createElement("details");
  details.className = "faq";
  details.id = "faq-" + id;
  details.open = expandedQuestions.has(id);
  const summary = document.createElement("summary");
  const heading = document.createElement("span");
  heading.className = "question";
  heading.textContent = question;
  const toggle = document.createElement("span");
  toggle.className = "toggle";
  toggle.setAttribute("aria-hidden", "true");
  toggle.textContent = "+";
  summary.append(heading, toggle);

  const body = document.createElement("div");
  body.className = "answer";
  for (const paragraph of answer.split("\n")) {
    const p = document.createElement("p");
    const prefix = paragraph.match(/^(.{1,38}?[：:])\s*(.*)$/u);
    if (prefix) {
      const strong = document.createElement("strong");
      strong.textContent = prefix[1] + " ";
      p.append(strong, prefix[2]);
    } else {
      p.textContent = paragraph;
    }
    body.append(p);
  }
  if (FAQ_LINKS[id]) {
    const link = document.createElement("a");
    link.className = "guide-link";
    link.href = "./" + FAQ_LINKS[id] + "?lang=" + language;
    link.textContent = content.ui[14] + (language === "ar" ? " ←" : " →");
    body.append(link);
  }

  if (MAP_POSTERS[id]) {
    const figure = document.createElement("figure");
    figure.className = "reference-figure poster-reference";
    const link = document.createElement("a");
    link.href = "./" + MAP_POSTERS[id];
    const image = document.createElement("img");
    image.src = link.href;
    image.alt = question;
    image.width = 1024;
    image.height = 1536;
    image.loading = "lazy";
    link.append(image);
    const caption = document.createElement("figcaption");
    caption.textContent = content.ui[25];
    figure.append(link, caption);
    body.append(figure);
  }
  if (id === 20) {
    const figure = document.createElement("figure");
    figure.className = "reference-figure";
    const link = document.createElement("a");
    link.href = "./helicopter-treasure-reference.jpg";
    const image = document.createElement("img");
    image.src = link.href;
    image.alt = content.faq[20][0];
    image.width = 946;
    image.height = 2048;
    image.loading = "lazy";
    link.append(image);
    const caption = document.createElement("figcaption");
    caption.textContent = content.ui[24];
    figure.append(link, caption);
    body.append(figure);
  }
  if (id === 9) {
    const official = document.createElement("a");
    official.className = "guide-link";
    official.href = "https://last-z.com/#/en/news";
    official.target = "_blank";
    official.rel = "noopener noreferrer";
    official.textContent = "Last Z ↗";
    body.append(official);
  }
  details.append(summary, body);
  details.addEventListener("toggle", () => {
    if (!details.isConnected) return;
    if (details.open) expandedQuestions.add(id);
    else expandedQuestions.delete(id);
  });
  return details;
}

function renderRelated() {
  const names = {
    en: ["HQ & Research", "Heroes & Formations", "Vehicles & Combat", "Glossary"],
    es: ["HQ e investigación", "Héroes y formaciones", "Vehículos y combate", "Glosario"],
    pt: ["QG e pesquisa", "Heróis e formações", "Veículos e combate", "Glossário"],
    fr: ["QG et recherche", "Héros et formations", "Véhicules et combat", "Glossaire"],
    ro: ["HQ și cercetare", "Eroi și formații", "Vehicule și luptă", "Glosar"],
    de: ["HQ und Forschung", "Helden und Formationen", "Fahrzeuge und Kampf", "Glossar"],
    zh: ["总部与研究", "英雄与阵容", "载具与战斗", "术语表"],
    ko: ["본부와 연구", "영웅과 편성", "차량과 전투", "용어집"],
    ar: ["المقر والأبحاث", "الأبطال والتشكيلات", "المركبات والقتال", "المصطلحات"]
  };
  $("related-links").replaceChildren(...["hq", "heroes", "vehicles", "glossary"].map((page, index) => {
    const a = document.createElement("a");
    a.href = "./" + page + ".html?lang=" + language;
    a.textContent = names[language][index];
    return a;
  }));
}

$("language").addEventListener("change", event => {
  language = validLanguage(event.target.value) ? event.target.value : "en";
  applyLanguage();
});

$("search").addEventListener("input", event => {
  query = event.target.value;
  renderQuestions();
});

$("clear-search").addEventListener("click", () => {
  query = "";
  $("search").value = "";
  renderQuestions();
  $("search").focus();
});

$("all-topics").addEventListener("click", () => {
  selectedCategory = null;
  renderTopics();
  renderQuestions();
});

$("expand").addEventListener("click", () => {
  visibleQuestionIds().forEach(id => expandedQuestions.add(id));
  renderQuestions();
});

$("collapse").addEventListener("click", () => {
  visibleQuestionIds().forEach(id => expandedQuestions.delete(id));
  renderQuestions();
});

$("reset-checklist").addEventListener("click", () => {
  checkedTasks = Array(8).fill(false);
  save(CHECKLIST_KEY, JSON.stringify(checkedTasks));
  renderChecklist();
});

$("routine-link").addEventListener("click", () => {
  $("daily-panel").open = true;
});

applyLanguage();

