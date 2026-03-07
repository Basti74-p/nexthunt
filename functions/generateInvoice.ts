import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenant_id, customer_name, items } = await req.json();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // Header
    doc.setFontSize(20);
    doc.text('RECHNUNG', margin, y);
    y += 12;

    // Customer info
    doc.setFontSize(10);
    doc.text(`Kunde: ${customer_name}`, margin, y);
    y += 6;
    doc.text(`Ausgestellt: ${new Date().toLocaleDateString('de-DE')}`, margin, y);
    y += 12;

    // Table header
    doc.setFontSize(9);
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
    doc.text('Wildart', margin + 2, y + 5);
    doc.text('Altersklasse', margin + 30, y + 5);
    doc.text('Geschl.', margin + 60, y + 5);
    doc.text('Gewicht (kg)', margin + 80, y + 5);
    doc.text('Preis (€)', margin + 110, y + 5);
    doc.text('Summe (€)', pageWidth - margin - 20, y + 5);
    y += 8;

    // Items
    let totalSum = 0;
    items.forEach(item => {
      const species = item.species.charAt(0).toUpperCase() + item.species.slice(1);
      const ageClass = item.age_class || '–';
      const gender = item.gender === 'maennlich' ? 'M' : item.gender === 'weiblich' ? 'W' : '–';
      const weight = item.gewicht_kalt || 0;
      const price = item.verkaufspreis || 0;
      const sum = weight * price;
      totalSum += sum;

      doc.text(species, margin + 2, y);
      doc.text(ageClass, margin + 30, y);
      doc.text(gender, margin + 60, y);
      doc.text(weight.toString(), margin + 80, y);
      doc.text(price.toFixed(2), margin + 110, y);
      doc.text(sum.toFixed(2), pageWidth - margin - 20, y);
      y += 6;

      if (y > 250) {
        doc.addPage();
        y = margin;
      }
    });

    // Total
    y += 2;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('GESAMTSUMME:', margin + 110, y + 5);
    doc.text(totalSum.toFixed(2) + ' €', pageWidth - margin - 20, y + 5);

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Rechnung_${customer_name}_${new Date().toISOString().split('T')[0]}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});