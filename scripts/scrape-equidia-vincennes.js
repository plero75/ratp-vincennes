import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import fs from "fs/promises";

// 1. Config : changer le mois si besoin
const mois = "2025-08";
const base = "https://www.equidia.fr";
const pageMois = `${base}/courses-hippique/trot?month=${mois}`;
const lieuVincennes = "Vincennes";

async function getJoursVincennes() {
  const html = await fetch(pageMois).then(r => r.text());
  const dom = new JSDOM(html);
  const jours = [];
  dom.window.document.querySelectorAll("a.meeting-card__content").forEach(link => {
    const url = link.href.startsWith("http") ? link.href : base + link.href;
    const lieu = link.querySelector(".meeting-card__title")?.textContent?.trim();
    const dateStr = link.querySelector(".meeting-card__date")?.textContent?.trim();
    if (!lieu || !dateStr) return;
    if (lieu.toLowerCase().includes("vincennes")) {
      // Date Equidia : "Dim. 11 août" -> on va chercher l’URL du détail, puis reparser pour date ISO
      jours.push({ url, lieu, dateStr });
    }
  });
  return jours;
}

function normaliseDate(d) {
  // Prend "Dim. 11 août" ou "Ven. 30 août" et mois courant, retourne yyyy-mm-dd
  const moisMap = {
    "janv": "01", "févr": "02", "mars": "03", "avr": "04", "mai": "05", "juin": "06",
    "juil": "07", "août": "08", "sept": "09", "oct": "10", "nov": "11", "déc": "12"
  };
  const match = d.match(/(\d{1,2})\s+([^\s]+)/);
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const moisTxt = match[2].toLowerCase();
  const month = moisMap[moisTxt] || "01";
  const year = mois.slice(0, 4);
  return `${year}-${month}-${day}`;
}

async function getCoursesDuJour(urlDetail) {
  const html = await fetch(urlDetail).then(r => r.text());
  const dom = new JSDOM(html);
  const result = [];
  dom.window.document.querySelectorAll(".race-card__header").forEach(el => {
    const heure = el.querySelector(".race-card__schedule")?.textContent?.trim();
    const nom = el.querySelector(".race-card__title")?.textContent?.trim();
    if (heure && nom) result.push({ heure, nom });
  });
  return result;
}

async function main() {
  const jours = await getJoursVincennes();
  const races = [];
  for (const jour of jours) {
    const date = normaliseDate(jour.dateStr);
    if (!date) continue;
    const courses = await getCoursesDuJour(jour.url);
    let heure = courses[0]?.heure || "";
    races.push({
      date,
      lieu: lieuVincennes,
      type: "Trot",
      heure,
      courses
    });
    console.log(`[OK] ${date} – ${courses.length} courses`);
  }
  await fs.writeFile("static/races.json", JSON.stringify(races, null, 2), "utf-8");
  console.log("Fichier static/races.json généré avec succès !");
}

main().catch(console.error);
