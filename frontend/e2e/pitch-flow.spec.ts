import { expect, test, type Page } from '@playwright/test';

// The full pitch story, driven only through the UI. Rerunnable: it starts with
// "Atur ulang data demo". UI_MODE=AI expects automatic AI analysis (real key or
// the Gemini stub); otherwise the labelled sample-data path is used.
const MODE = process.env.UI_MODE === 'AI' ? 'AI' : 'SAMPLE';

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('dialog', (dialog) => void dialog.accept());
  return errors;
}

const notice = (page: Page, text: RegExp) => expect(page.getByRole('status').filter({ hasText: text }).first()).toBeVisible();
const tab = (page: Page, name: string) => page.getByRole('tab', { name: new RegExp(name) }).click();

async function persona(page: Page, name: RegExp) {
  await page.locator('header button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
}

test('pitch: detect → explain → quantify → resolve → approve → monitor', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);

  // Phase A — project start
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Atur ulang data demo' }).first().click();
  await page.waitForURL('**/dashboard');
  await persona(page, /Budi Santoso/);
  await expect(page.getByRole('heading', { name: 'Eksekusi proyek' })).toBeVisible();
  await page.getByRole('link', { name: 'Proyek baru' }).click();
  await page.getByLabel('Nama proyek').fill('Sistem Manajemen Armada');
  await page.getByLabel('Nama klien').fill('PT Astra Sahabat Logistik');
  await page.getByText('Gunakan berkas contoh (demo)').click();
  await page.getByRole('button', { name: /Buat proyek/ }).click();
  await expect(page.getByRole('heading', { name: 'Sistem Manajemen Armada' })).toBeVisible();

  if (MODE === 'AI') {
    // No click: CLARA analyzes the uploaded contract automatically.
    await expect(page.getByRole('heading', { name: '3 · Tinjau dan koreksi' })).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText('Hasil analisis AI — wajib ditinjau')).toBeVisible();
  } else {
    await expect(page.getByRole('button', { name: /Muat data contoh/ })).toBeEnabled({ timeout: 60_000 });
    await page.getByRole('button', { name: /Muat data contoh/ }).click();
    await expect(page.getByRole('heading', { name: '3 · Tinjau dan koreksi' })).toBeVisible();
  }
  await expect(page.getByLabel('Nilai kontrak (Rp)')).toHaveValue('120000000');
  await expect(page.getByLabel('Tenggat')).toHaveValue('2026-11-30');
  await expect(page.getByLabel('Batas revisi termasuk nilai kontrak')).toHaveValue('3');
  await expect(page.locator('#ms-pct-0')).toHaveValue('25');
  await expect(page.locator('#term-revisionUnitPrice')).toHaveValue('2000000');
  await expect(page.getByText(/Total Rp\s?75\.000\.000/)).toBeVisible();
  await expect(page.getByText(/4\.1 Sebesar 25% dari nilai kontrak/).first()).toBeVisible();
  await page.getByRole('button', { name: /Setujui sebagai acuan V1/ }).click();
  await expect(page.getByText('Acuan V1', { exact: true }).first()).toBeVisible();

  // Phase B — continuous monitoring
  await tab(page, 'Pemantauan');
  await page.getByLabel('Progres (%)').fill('60');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await notice(page, /Progres diperbarui ke 60%/);
  await tab(page, 'Keuangan');
  await page.getByLabel('Jumlah (Rp)').fill('64000000');
  await page.getByLabel('Keterangan').fill('Biaya tim sampai UAT');
  await page.getByRole('button', { name: 'Catat biaya' }).click();
  await notice(page, /Biaya .* dicatat/);
  await tab(page, 'Pemantauan');
  const uatValue = await page.locator('#mon-milestone option', { hasText: /UAT/ }).getAttribute('value');
  await page.locator('#mon-milestone').selectOption(uatValue as string);
  await page.getByRole('button', { name: 'Tandai selesai' }).click();
  await notice(page, /ditandai selesai/);

  // Phase C — scope / revision anomaly
  await page.getByLabel('Jumlah', { exact: true }).fill('5');
  await page.getByLabel('Keterangan', { exact: true }).fill('Revisi dashboard dispatcher');
  await page.getByRole('button', { name: 'Catat', exact: true }).click();
  await notice(page, /5 revisi dicatat/);
  await tab(page, 'Ringkasan');
  await expect(page.getByText(/85,3% anggaran terpakai/)).toBeVisible();
  await expect(page.getByText(/Belum ditagih Rp\s?30\.000\.000/)).toBeVisible();

  await tab(page, 'Peringatan');
  await page.locator('article', { hasText: 'selesai, belum ditagih' }).getByRole('button', { name: 'Lihat bukti' }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByText(/4\.1 Sebesar 25% dari nilai kontrak dibayarkan setelah UAT diterima/)).toBeVisible();
  await expect(drawer.getByText('Tagihan untuk tahap ini tidak ditemukan')).toBeVisible();
  await expect(drawer.getByText('Perhitungan terverifikasi').first()).toBeVisible();
  if (MODE === 'AI') {
    await drawer.getByRole('button', { name: /Jelaskan dampak bisnis/ }).click();
    await expect(drawer.getByText(/angka berasal dari perhitungan terverifikasi/)).toBeVisible();
  }
  await drawer.getByRole('button', { name: 'Tutup rincian peringatan' }).click();

  // Phase D — AI remediation
  await page.locator('article', { hasText: 'revisi di luar acuan V1' }).getByRole('button', { name: 'Lihat bukti' }).click();
  await expect(page.getByRole('dialog').getByText(/5 revisi aktual − 3 revisi termasuk = 2/)).toBeVisible();
  await expect(page.getByRole('dialog').getByText(/Rp\s?4\.000\.000/).first()).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Buat permintaan perubahan (AI)' }).click();
  await expect(page.getByText('Disiapkan CLARA').first()).toBeVisible({ timeout: 60_000 });
  const card = page.locator('article', { hasText: 'Tambahan 2 putaran revisi' }).first();
  await expect(card.getByText(/2 × Rp\s?2\.000\.000 per putaran/)).toBeVisible();
  await card.getByRole('button', { name: 'Ajukan untuk persetujuan internal' }).click();
  await notice(page, /diajukan ke keuangan/);

  // Phase E — finance review
  await persona(page, /Siti Rahma/);
  await page.getByRole('link', { name: 'Dashboard' }).first().click();
  await page.getByRole('link', { name: /Tinjau dampak keuangan CR\// }).click();
  await page.getByRole('button', { name: 'Konfirmasi dampak & teruskan' }).click();
  await notice(page, /Diteruskan ke pimpinan/);

  // Phase F — decision
  await persona(page, /Hendra Wijaya/);
  await page.getByRole('link', { name: 'Dashboard' }).first().click();
  await page.getByRole('link', { name: /Putuskan CR\// }).click();
  await page.getByRole('button', { name: 'Setujui internal' }).click();
  await notice(page, /disetujui internal/);
  await expect(page.getByText('Acuan V1', { exact: true }).first()).toBeVisible();

  // Phase G — official change with client evidence
  await persona(page, /Budi Santoso/);
  await tab(page, 'Dokumen');
  await page.getByRole('button', { name: /Surat persetujuan klien/ }).click();
  await notice(page, /dilampirkan/);
  await expect(page.locator('article', { hasText: 'Persetujuan-Klien-CR-ASL.pdf' }).getByText(/^(Dianalisis|Analisis gagal)$/).first()).toBeVisible({ timeout: 60_000 });
  await tab(page, 'Perubahan');
  const approvalOption = await page.locator('select[id^="cd-"] option', { hasText: 'Persetujuan-Klien-CR-ASL.pdf' }).getAttribute('value');
  await page.locator('select[id^="cd-"]').selectOption(approvalOption as string);
  await page.locator('input[id^="cref-"]').fill('Surat 045/ASL-PROC/X/2026');
  await page.getByRole('button', { name: 'Catat persetujuan klien & resmikan' }).click();
  await notice(page, /resmi/);

  // Phase H — close the loop
  await expect(page.getByText('Acuan V2', { exact: true }).first()).toBeVisible();
  await tab(page, 'Acuan proyek');
  await expect(page.getByRole('heading', { name: 'Acuan aktif V2' })).toBeVisible();
  await expect(page.getByText('Diarsipkan')).toBeVisible();
  await expect(page.getByText(/Nilai kontrak: .*Rp\s?120\.000\.000.*→.*Rp\s?124\.000\.000/)).toBeVisible();
  await expect(page.getByText(/Tenggat: .*30 Nov 2026.*→.*5 Des 2026/)).toBeVisible();
  await tab(page, 'Peringatan');
  await expect(page.locator('article', { hasText: 'revisi di luar acuan' })).toHaveCount(0);
  await page.getByLabel('Tampilkan yang selesai').check();
  await expect(page.locator('article', { hasText: 'revisi di luar acuan' }).getByText('Dijelaskan perubahan resmi')).toBeVisible();

  await tab(page, 'Dokumen');
  const draftCard = page.locator('article').filter({ hasText: 'Validasi draf' }).filter({ hasText: 'Tambahan 2 putaran revisi' }).first();
  await draftCard.getByRole('button', { name: 'Setujui draf' }).click();
  await notice(page, /siap dikirim/);
  const download = page.waitForEvent('download');
  await draftCard.getByRole('button', { name: 'Ekspor PDF untuk dikirim' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.(pdf|md)$/);
  await expect(draftCard.getByText('Diekspor untuk dikirim')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Acuan V2', { exact: true }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard' }).first().click();
  await expect(page.locator('div', { hasText: /^Belum ditagihRp 30 Jt/ }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Pusat AI' }).first().click();
  await expect(page.getByRole('heading', { name: 'Pusat AI' })).toBeVisible();
  await expect(page.getByText('Persetujuan-Klien-CR-ASL.pdf').first()).toBeVisible();

  expect(errors, errors.join('\n')).toEqual([]);
});
