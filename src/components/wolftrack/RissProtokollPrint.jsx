export function printRissProtokoll(riss) {
  const fmt = (d) => d ? new Date(d).toLocaleDateString("de-DE") : "–";

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Rissprotokoll – ${fmt(riss.incident_date)}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #111; }
    h1 { border-bottom: 2px solid #cc2200; padding-bottom: 8px; color: #cc2200; }
    h2 { color: #2d5a27; margin-top: 24px; font-size: 14px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    td { padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
    td:first-child { font-weight: bold; width: 200px; color: #555; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #e0f2e9; color: #2d5a27; font-size: 12px; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 8px 12px; border-radius: 4px; margin: 16px 0; font-size: 13px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>🩸 Rissprotokoll – Wolfssichtung</h1>
  <div class="warning">⚠️ Dieses Dokument dient als Grundlage für die Entschädigungsbeantragung und Meldung an die Behörde.</div>

  <h2>Vorfall</h2>
  <table>
    <tr><td>Datum</td><td>${fmt(riss.incident_date)}</td></tr>
    <tr><td>Ort</td><td>${riss.location_name || "–"}</td></tr>
    <tr><td>GPS</td><td>${riss.location_lat ?? "–"} / ${riss.location_lng ?? "–"}</td></tr>
  </table>

  <h2>Betroffene Tiere</h2>
  <table>
    <tr><td>Tierart</td><td>${riss.animal_species || "–"}</td></tr>
    <tr><td>Getötet</td><td>${riss.animal_count_dead ?? 0}</td></tr>
    <tr><td>Verletzt</td><td>${riss.animal_count_injured ?? 0}</td></tr>
    <tr><td>Tierhalter</td><td>${riss.owner_name || "–"}</td></tr>
    <tr><td>Kontakt Tierhalter</td><td>${riss.owner_contact || "–"}</td></tr>
  </table>

  <h2>Befund</h2>
  <table>
    <tr><td>Wolf bestätigt</td><td>${riss.wolf_confirmed ? "Ja" : "Nein"}</td></tr>
    <tr><td>Gutachter</td><td>${riss.gutachter_name || "–"}</td></tr>
    <tr><td>Gutachter informiert</td><td>${riss.gutachter_notified ? "Ja" : "Nein"}</td></tr>
    <tr><td>Entschädigung beantragt</td><td>${riss.compensation_applied ? "Ja" : "Nein"}</td></tr>
    <tr><td>Entschädigungsbetrag</td><td>${riss.compensation_amount ? riss.compensation_amount.toFixed(2) + " €" : "–"}</td></tr>
    <tr><td>Status</td><td><span class="badge">${riss.status || "–"}</span></td></tr>
  </table>

  <h2>Notizen</h2>
  <p style="font-size:13px; line-height:1.6">${riss.notes || "–"}</p>

  <p style="margin-top: 40px; font-size: 11px; color: #999;">Erstellt am ${new Date().toLocaleDateString("de-DE")} – NextHunt WolfTrack</p>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}