// Pomocné funkce
function najdiJisticZTabulky(distributor, faze, ampery, sazba) {
  const z = jisticoveCeny.find(z =>
    z.distributor === distributor &&
    z.sazba === sazba &&
    z.faze == faze &&
    ampery >= z.min &&
    ampery <= z.max
  );
  if (!z) return 0;
  if (z.cena !== undefined) return z.cena;
  if (z.cenaZaAmp !== undefined) return ampery * z.cenaZaAmp;
  return 0;
}

function ziskejDistribucniCeny(distributor, sazba) {
  const distribuce = distribuceCeny.find(d =>
    d.distributor === distributor && d.sazba === sazba
  );
  return distribuce || { vt: 0, nt: 0, ote: 0, systemove: 0 };
}

// --- Nově: Načítání distribučních sazeb ---
const distributorSelect = document.getElementById('distributor');
const sazbaSelect = document.getElementById('sazba');

function naplnSazby() {
  const distributor = distributorSelect.value;
  const dostupneSazby = [...new Set(
    distribuceCeny.filter(item => item.distributor === distributor)
                  .map(item => item.sazba)
  )];

  sazbaSelect.innerHTML = dostupneSazby.map(
    sazba => `<option value="${sazba}">${sazba}</option>`
  ).join('');
}

// Při změně distributora načíst sazby
distributorSelect.addEventListener('change', naplnSazby);

// A hned při načtení stránky
naplnSazby();

// --- Výpočet ---
document.getElementById('spocitej').addEventListener('click', () => {
  const distributor = distributorSelect.value;
  const sazba = sazbaSelect.value;
  const vt = parseFloat(document.getElementById('vt').value) || 0;
  const nt = parseFloat(document.getElementById('nt').value) || 0;
  const cenaVT = parseFloat(document.getElementById('cenaVT').value) || 0;
  const cenaNT = parseFloat(document.getElementById('cenaNT').value) || 0;
  const poplatek = parseFloat(document.getElementById('poplatek').value) || 0;
  const faze = parseInt(document.getElementById('faze').value) || 1;
  const ampery = parseInt(document.getElementById('ampere').value) || 1;

  const distribuce = ziskejDistribucniCeny(distributor, sazba);
  const jisticCena = najdiJisticZTabulky(distributor, faze, ampery, sazba);

  const obchodVT = vt * cenaVT;
  const obchodNT = nt * cenaNT;
  const obchodPoplatek = poplatek * 12;
  const danElektrina = 28.3; // Kč/MWh
  const danTotal = (vt + nt) * danElektrina;

  const distribuceVTtotal = vt * distribuce.vt;
  const distribuceNTtotal = nt * distribuce.nt;
  const jisticTotal = jisticCena * 12;
  const oteTotal = distribuce.ote * 12;
  const systemoveTotal = (vt + nt) * distribuce.systemove;

  // Výpočet POZE
  const metodaA = faze * ampery * 12 * 84.70;
  const metodaB = (vt + nt) * 495;
  const poze = Math.min(metodaA, metodaB);

  // Výpočet celkových nákladů
  const rocniNaklady = obchodVT + obchodNT + obchodPoplatek + danTotal +
                       distribuceVTtotal + distribuceNTtotal +
                       jisticTotal + oteTotal + systemoveTotal + poze;
  const dphSazba = 0.21;
  const rocniNakladySDPH = rocniNaklady * (1 + dphSazba);
  const mesicniZaloha = (rocniNakladySDPH / 12).toFixed(2);

  // Výstup
  document.getElementById('vysledek').innerHTML = `
    <strong>Detail výpočtu:</strong><br>
    <div class="p-3 mb-3 border rounded bg-white">
      <h6 class="text-primary fw-bold"><i class="bi bi-lightning"></i> Obchodní složka</h6>
      Dodávka VT: ${vt} MWh × ${cenaVT} Kč = ${obchodVT.toFixed(2)} Kč<br>
      Dodávka NT: ${nt} MWh × ${cenaNT} Kč = ${obchodNT.toFixed(2)} Kč<br>
      Měsíční poplatek: ${poplatek} Kč × 12 = ${obchodPoplatek.toFixed(2)} Kč<br>
      Daň z elektřiny: ${danElektrina} Kč × ${(vt + nt).toFixed(3)} MWh = ${danTotal.toFixed(2)} Kč
    </div>

    <div class="p-3 mb-3 border rounded bg-light">
      <h6 class="text-success fw-bold"><i class="bi bi-truck"></i> Distribuční složka</h6>
      Distribuce VT: ${vt} MWh × ${distribuce.vt} Kč = ${distribuceVTtotal.toFixed(2)} Kč<br>
      Distribuce NT: ${nt} MWh × ${distribuce.nt} Kč = ${distribuceNTtotal.toFixed(2)} Kč
    </div>

    <div class="p-3 mb-3 border rounded bg-white">
      <h6 class="text-warning fw-bold"><i class="bi bi-gear"></i> Ostatní poplatky</h6>
      Hlavní jistič: ${jisticCena.toFixed(2)} Kč × 12 = ${jisticTotal.toFixed(2)} Kč<br>
      Cena OTE: ${distribuce.ote} Kč × 12 = ${oteTotal.toFixed(2)} Kč<br>
      Systémové služby: ${distribuce.systemove} Kč × ${(vt + nt).toFixed(3)} MWh = ${systemoveTotal.toFixed(2)} Kč<br>
      Podpora OZE: ${poze.toFixed(2)} Kč (${metodaA < metodaB ? 'Metoda A' : 'Metoda B'})
    </div>

    <hr>

    <div class="p-3 mb-3 border rounded bg-white">
      <h6 class="text-warning fw-bold"><i class="bi bi-award-fill"></i> Celkové náklady</h6>
      Roční náklady (bez DPH): ${rocniNaklady.toFixed(2)} Kč<br>
      DPH 21%: ${(rocniNaklady * dphSazba).toFixed(2)} Kč<br>
      Roční náklady (s DPH): ${rocniNakladySDPH.toFixed(2)} Kč
    </div>

    <hr>

    <div class="alert alert-success text-center fs-4 fw-bold mt-3">
      Měsíční záloha (s DPH): ${mesicniZaloha} Kč
    </div>
  `;
});
