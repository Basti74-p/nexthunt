import React, { createContext, useContext, useState, useEffect } from "react";

const LANG_KEY = "nh_language";

// ─────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────
export const translations = {
  de: {
    // Navigation
    nav_dashboard: "Dashboard",
    nav_map: "Karte",
    nav_reviere: "Reviere",
    nav_jagdeinrichtungen: "Jagdeinrichtungen",
    nav_wildmanagement: "Wildmanagement",
    nav_rotwild: "Rotwild",
    nav_schwarzwild: "Schwarzwild",
    nav_rehwild: "Rehwild",
    nav_wolf: "Wolf",
    nav_strecke: "Strecke",
    nav_abschussplan: "Abschussplan",
    nav_wildkammer: "Wildkammer",
    nav_lager: "Lager",
    nav_wildverkauf: "Wildverkauf",
    nav_archiv: "Archiv",
    nav_jagdkalender: "Jagdkalender",
    nav_alle_jagden: "Alle Jagden",
    nav_live_monitor: "Live-Monitor",
    nav_jagdgaeste: "Jagdgäste",
    nav_personal: "Personal",
    nav_aufgaben: "Aufgaben",
    nav_personen: "Personen",
    nav_berechtigungen: "Berechtigungen",
    nav_oeffentlichkeit: "Öffentlichkeit",
    nav_support: "Support",
    nav_einstellungen: "Einstellungen",
    nav_system_admin: "System-Administration",
    nav_aktiver_tenant: "Aktiver Tenant",
    nav_tenant_waehlen: "Tenant wählen...",

    // Mobile tabs
    tab_map: "Karte",
    tab_strecke: "Strecke",
    tab_aufgaben: "Aufgaben",
    tab_kalender: "Kalender",
    tab_einrichtungen: "Einrichtungen",

    // Dashboard
    welcome: "Willkommen",
    jaeger: "Jäger",
    testphase_aktiv: "Testphase aktiv – noch",
    tag: "Tag",
    tage: "Tage",
    kostenloser_zugriff: "kostenloser Zugriff",
    lizenz_kaufen: "Lizenz kaufen",
    testphase_abgelaufen: "Testphase abgelaufen – bitte Lizenz erwerben.",
    ihre_reviere: "Ihre Reviere",
    grenzen_einzeichnen: "Grenzen einzeichnen",
    alle_anzeigen: "Alle anzeigen",
    keine_reviere: "Noch keine Reviere angelegt.",
    offene_aufgaben: "Offene Aufgaben",
    stat_reviere: "Reviere",
    stat_offene_aufgaben: "Offene Aufgaben",
    stat_strecke: "Strecke (gesamt)",
    stat_geplante_jagden: "Geplante Jagden",
    willkommen_nexthunt: "Willkommen bei NextHunt",
    noch_kein_mandant: "Sie sind noch keinem Mandanten zugewiesen.",
    reviergrenzen_einzeichnen: "Reviergrenzen einzeichnen",
    boundary_help_text: "Um Reviergrenzen einzuzeichnen, gehen Sie zur Karte und nutzen Sie den Button \"Reviergrenze einzeichnen\".",
    so_funktioniert: "So funktioniert es:",
    boundary_step1: "Klicken Sie auf den Button \"Reviergrenze einzeichnen\"",
    boundary_step2: "Klicken Sie auf die Karte, um Punkte zu setzen",
    boundary_step3: "Setzen Sie mindestens 3 Punkte",
    boundary_step4: "Klicken Sie \"Fertig\", um die Grenze zu speichern",
    boundary_step5: "Wählen Sie ein Revier und eine Farbe",
    boundary_step6: "Klicken Sie \"Speichern\"",
    zur_karte: "Zur Karte",

    // Common
    speichern: "Speichern",
    abbrechen: "Abbrechen",
    loeschen: "Löschen",
    bearbeiten: "Bearbeiten",
    erstellen: "Erstellen",
    hinzufuegen: "Hinzufügen",
    laden: "Laden...",
    suchen: "Suchen...",
    alle: "Alle",
    offen: "Offen",
    erledigt: "Erledigt",
    aktiv: "Aktiv",
    inaktiv: "Inaktiv",
    ja: "Ja",
    nein: "Nein",
    zurueck: "Zurück",
    weiter: "Weiter",
    fertig: "Fertig",
    schliessen: "Schließen",
    kein_ergebnis: "Keine Ergebnisse",
    trial_wird_vorbereitet: "Trial wird vorbereitet...",
    bitte_anmelden: "Bitte melden Sie sich an",
    anmelden: "Anmelden",

    // Language selection
    sprache_waehlen: "Sprache wählen",
    sprache_waehlen_subtitle: "Bitte wählen Sie Ihre bevorzugte Sprache",
    weiter_btn: "Weiter",
    sprache_de: "Deutsch",
    sprache_en: "English",
    sprache_lt: "Lietuvių",
  },

  en: {
    // Navigation
    nav_dashboard: "Dashboard",
    nav_map: "Map",
    nav_reviere: "Areas",
    nav_jagdeinrichtungen: "Hunting Facilities",
    nav_wildmanagement: "Wildlife Management",
    nav_rotwild: "Red Deer",
    nav_schwarzwild: "Wild Boar",
    nav_rehwild: "Roe Deer",
    nav_wolf: "Wolf",
    nav_strecke: "Harvest",
    nav_abschussplan: "Shooting Plan",
    nav_wildkammer: "Game Chamber",
    nav_lager: "Storage",
    nav_wildverkauf: "Game Sales",
    nav_archiv: "Archive",
    nav_jagdkalender: "Hunting Calendar",
    nav_alle_jagden: "All Hunts",
    nav_live_monitor: "Live Monitor",
    nav_jagdgaeste: "Hunting Guests",
    nav_personal: "Staff",
    nav_aufgaben: "Tasks",
    nav_personen: "Persons",
    nav_berechtigungen: "Permissions",
    nav_oeffentlichkeit: "Public Portal",
    nav_support: "Support",
    nav_einstellungen: "Settings",
    nav_system_admin: "System Administration",
    nav_aktiver_tenant: "Active Tenant",
    nav_tenant_waehlen: "Select tenant...",

    // Mobile tabs
    tab_map: "Map",
    tab_strecke: "Harvest",
    tab_aufgaben: "Tasks",
    tab_kalender: "Calendar",
    tab_einrichtungen: "Facilities",

    // Dashboard
    welcome: "Welcome",
    jaeger: "Hunter",
    testphase_aktiv: "Trial active – ",
    tag: "day",
    tage: "days",
    kostenloser_zugriff: "free access remaining",
    lizenz_kaufen: "Buy License",
    testphase_abgelaufen: "Trial expired – please purchase a license.",
    ihre_reviere: "Your Areas",
    grenzen_einzeichnen: "Draw Boundaries",
    alle_anzeigen: "Show all",
    keine_reviere: "No areas created yet.",
    offene_aufgaben: "Open Tasks",
    stat_reviere: "Areas",
    stat_offene_aufgaben: "Open Tasks",
    stat_strecke: "Harvest (total)",
    stat_geplante_jagden: "Planned Hunts",
    willkommen_nexthunt: "Welcome to NextHunt",
    noch_kein_mandant: "You are not yet assigned to a tenant.",
    reviergrenzen_einzeichnen: "Draw area boundaries",
    boundary_help_text: "To draw area boundaries, go to the Map and use the \"Draw boundary\" button.",
    so_funktioniert: "How it works:",
    boundary_step1: "Click the \"Draw boundary\" button",
    boundary_step2: "Click on the map to set points",
    boundary_step3: "Set at least 3 points",
    boundary_step4: "Click \"Done\" to save the boundary",
    boundary_step5: "Select an area and a color",
    boundary_step6: "Click \"Save\"",
    zur_karte: "Go to Map",

    // Common
    speichern: "Save",
    abbrechen: "Cancel",
    loeschen: "Delete",
    bearbeiten: "Edit",
    erstellen: "Create",
    hinzufuegen: "Add",
    laden: "Loading...",
    suchen: "Search...",
    alle: "All",
    offen: "Open",
    erledigt: "Done",
    aktiv: "Active",
    inaktiv: "Inactive",
    ja: "Yes",
    nein: "No",
    zurueck: "Back",
    weiter: "Next",
    fertig: "Done",
    schliessen: "Close",
    kein_ergebnis: "No results",
    trial_wird_vorbereitet: "Preparing trial...",
    bitte_anmelden: "Please sign in",
    anmelden: "Sign in",

    // Language selection
    sprache_waehlen: "Choose Language",
    sprache_waehlen_subtitle: "Please select your preferred language",
    weiter_btn: "Continue",
    sprache_de: "Deutsch",
    sprache_en: "English",
    sprache_lt: "Lietuvių",
  },

  lt: {
    // Navigation
    nav_dashboard: "Suvestinė",
    nav_map: "Žemėlapis",
    nav_reviere: "Medžioklės plotai",
    nav_jagdeinrichtungen: "Medžioklės įrenginiai",
    nav_wildmanagement: "Laukinių gyvūnų valdymas",
    nav_rotwild: "Elniai",
    nav_schwarzwild: "Šernai",
    nav_rehwild: "Stirnos",
    nav_wolf: "Vilkas",
    nav_strecke: "Laimikis",
    nav_abschussplan: "Medžioklės planas",
    nav_wildkammer: "Žvėrienos kamera",
    nav_lager: "Sandėlis",
    nav_wildverkauf: "Žvėrienos pardavimas",
    nav_archiv: "Archyvas",
    nav_jagdkalender: "Medžioklės kalendorius",
    nav_alle_jagden: "Visos medžioklės",
    nav_live_monitor: "Tiesioginis stebėjimas",
    nav_jagdgaeste: "Medžioklės svečiai",
    nav_personal: "Personalas",
    nav_aufgaben: "Užduotys",
    nav_personen: "Asmenys",
    nav_berechtigungen: "Leidimai",
    nav_oeffentlichkeit: "Viešas portalas",
    nav_support: "Pagalba",
    nav_einstellungen: "Nustatymai",
    nav_system_admin: "Sistemos administravimas",
    nav_aktiver_tenant: "Aktyvus nuomininkas",
    nav_tenant_waehlen: "Pasirinkti nuomininką...",

    // Mobile tabs
    tab_map: "Žemėlapis",
    tab_strecke: "Laimikis",
    tab_aufgaben: "Užduotys",
    tab_kalender: "Kalendorius",
    tab_einrichtungen: "Įrenginiai",

    // Dashboard
    welcome: "Sveiki",
    jaeger: "Medžiotojas",
    testphase_aktiv: "Bandomasis laikotarpis – liko",
    tag: "diena",
    tage: "dienos/dienų",
    kostenloser_zugriff: "nemokamos prieigos",
    lizenz_kaufen: "Pirkti licenciją",
    testphase_abgelaufen: "Bandomasis laikotarpis baigėsi – įsigykite licenciją.",
    ihre_reviere: "Jūsų medžioklės plotai",
    grenzen_einzeichnen: "Žymėti ribas",
    alle_anzeigen: "Rodyti visus",
    keine_reviere: "Dar nėra sukurtų plotų.",
    offene_aufgaben: "Atviros užduotys",
    stat_reviere: "Plotai",
    stat_offene_aufgaben: "Atviros užduotys",
    stat_strecke: "Laimikis (iš viso)",
    stat_geplante_jagden: "Planuojamos medžioklės",
    willkommen_nexthunt: "Sveiki atvykę į NextHunt",
    noch_kein_mandant: "Jūs dar nepriskirtas jokiam nuomininkui.",
    reviergrenzen_einzeichnen: "Žymėti ploto ribas",
    boundary_help_text: "Norėdami pažymėti ploto ribas, eikite į Žemėlapį ir naudokite mygtuką 'Žymėti ribas'.",
    so_funktioniert: "Kaip tai veikia:",
    boundary_step1: "Spustelėkite mygtuką 'Žymėti ribas'",
    boundary_step2: "Spustelėkite žemėlapyje, kad nustatytumėte taškus",
    boundary_step3: "Nustatykite bent 3 taškus",
    boundary_step4: "Spustelėkite „Baigta", kad išsaugotumėte ribą",
    boundary_step5: "Pasirinkite plotą ir spalvą",
    boundary_step6: "Spustelėkite „Išsaugoti"",
    zur_karte: "Į žemėlapį",

    // Common
    speichern: "Išsaugoti",
    abbrechen: "Atšaukti",
    loeschen: "Ištrinti",
    bearbeiten: "Redaguoti",
    erstellen: "Sukurti",
    hinzufuegen: "Pridėti",
    laden: "Kraunama...",
    suchen: "Ieškoti...",
    alle: "Visi",
    offen: "Atvira",
    erledigt: "Atlikta",
    aktiv: "Aktyvus",
    inaktiv: "Neaktyvus",
    ja: "Taip",
    nein: "Ne",
    zurueck: "Atgal",
    weiter: "Toliau",
    fertig: "Baigta",
    schliessen: "Uždaryti",
    kein_ergebnis: "Rezultatų nerasta",
    trial_wird_vorbereitet: "Paruošiamas bandomasis laikotarpis...",
    bitte_anmelden: "Prisijunkite",
    anmelden: "Prisijungti",

    // Language selection
    sprache_waehlen: "Pasirinkite kalbą",
    sprache_waehlen_subtitle: "Pasirinkite pageidaujamą kalbą",
    weiter_btn: "Tęsti",
    sprache_de: "Deutsch",
    sprache_en: "English",
    sprache_lt: "Lietuvių",
  },
};

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || null);

  const setLanguage = (l) => {
    localStorage.setItem(LANG_KEY, l);
    setLang(l);
  };

  const t = (key) => {
    const dict = translations[lang] || translations.de;
    return dict[key] || translations.de[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLanguage, t, isLanguageSelected: !!lang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}