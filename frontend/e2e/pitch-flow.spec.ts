import { expect, test, type Page } from '@playwright/test';

// The full pitch scenario, driven only through the UI. Rerunnable: it starts
// with "Atur ulang data demo". UI_MODE=AI uses real AI analysis; otherwise the
// labelled sample data path is used.
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

async function notice(page: Page, text: RegExp) {
  await expect(page.getByRole('status').filter({ hasText: text }).first()).toBeVisible();
}

async function tab(page: Page, name: string) {
  await page.getByRole('tab', { name: new RegExp(name) }).click();
}

test('pitch: reset → V1 → monitoring → alerts with evidence → CR → V2 → persistence', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Atur ulang data demo' }).first().click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Persona: Budi
  await page.getByRole('button', { name: /Budi|BS/ }).first().click();
  await page.getByRole('menuitem', { name: /Budi Santoso/ }).click();
  await expect(page.getByRole('heading', { name: 'Eksekusi proyek' })).toBeVisible();

  // Open the pitch project waiting for a baseline
  await page.getByRole('link', { name: /Siapkan acuan/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Sistem Manajemen Armada & Logistik' })).toBeVisible();
  await expect(page.getByText('Kontrak-PKS-ASL-2026-089.pdf')).toBeVisible();

  // Analyse
  if (MODE === 'AI') await page.getByRole('button', { name: /Analisis dengan AI/ }).click();
  else await page.getByRole('button', { name: /Muat data contoh/ }).click();
  await expect(page.getByRole('heading', { name: '3 · Tinjau dan koreksi' })).toBeVisible({ timeout: 180_000 });

  // Review extracted values and evidence
  await expect(page.getByLabel('Nilai kontrak (Rp)')).toHaveValue('120000000');
  await expect(page.getByLabel('Tenggat')).toHaveValue('2026-11-30');
  await expect(page.getByLabel('Batas revisi termasuk nilai kontrak')).toHaveValue('3');
  await expect(page.locator('#ms-pct-0')).toHaveValue('25');
  await expect(page.getByText(/Total Rp\s?75\.000\.000/)).toBeVisible();
  await expect(page.getByText(/4\.1 Sebesar 25% dari nilai kontrak/).first()).toBeVisible();
  await expect(page.getByText(/Ditemukan di dokumen · hal\. 2/).first()).toBeVisible();

  // Confirm baseline V1
  await page.getByRole('button', { name: /Setujui sebagai acuan V1/ }).click();
  await expect(page.getByText('Acuan V1', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('tab', { name: /Ringkasan/ })).toBeVisible();

  // Progress 60%
  await tab(page, 'Pemantauan');
  await page.getByLabel('Progres (%)').fill('60');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await notice(page, /Progres diperbarui ke 60%/);

  // Actual cost Rp64M
  await tab(page, 'Keuangan');
  await page.getByLabel('Jumlah (Rp)').fill('64000000');
  await page.getByLabel('Keterangan').fill('Biaya tim sampai UAT');
  await page.getByRole('button', { name: 'Catat biaya' }).click();
  await notice(page, /Biaya .* dicatat/);
  await expect(page.getByText(/85,3% dari/)).toBeVisible();

  // UAT completed, no invoice
  await tab(page, 'Pemantauan');
  const uatOption = page.locator('#mon-milestone option', { hasText: /UAT/ });
  await page.locator('#mon-milestone').selectOption(await uatOption.getAttribute('value') as string);
  await page.getByRole('button', { name: 'Tandai selesai' }).click();
  await notice(page, /ditandai selesai/);

  // 5 revisions
  await page.getByLabel('Jumlah', { exact: true }).fill('5');
  await page.getByLabel('Keterangan', { exact: true }).fill('Revisi dashboard dispatcher');
  await page.getByRole('button', { name: 'Catat', exact: true }).click();
  await notice(page, /5 revisi dicatat/);

  // Overview: reconciliation numbers
  await tab(page, 'Ringkasan');
  await expect(page.getByText(/85,3% anggaran terpakai/)).toBeVisible();
  await expect(page.getByText('5 dari 3')).toBeVisible();
  await expect(page.getByText('+2 di luar acuan')).toBeVisible();
  await expect(page.getByText(/Belum ditagih Rp\s?30\.000\.000/)).toBeVisible();

  // Billing alert evidence
  await tab(page, 'Peringatan');
  const billing = page.locator('article', { hasText: 'selesai, belum ditagih' });
  await billing.getByRole('button', { name: 'Lihat bukti' }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByText(/4\.1 Sebesar 25% dari nilai kontrak dibayarkan setelah UAT diterima/)).toBeVisible();
  await expect(drawer.getByText('Tagihan untuk tahap ini tidak ditemukan')).toBeVisible();
  await expect(drawer.getByText(/25% × Rp\s?120\.000\.000 = Rp\s?30\.000\.000/)).toBeVisible();
  await expect(drawer.getByText('Selisih terverifikasi').first()).toBeVisible();
  await drawer.getByRole('button', { name: 'Tutup rincian peringatan' }).click();

  // Revision alert evidence
  const revision = page.locator('article', { hasText: 'revisi di luar acuan V1' });
  await revision.getByRole('button', { name: 'Lihat bukti' }).click();
  await expect(page.getByRole('dialog').getByText(/5 revisi aktual − 3 revisi termasuk = 2/)).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Tutup rincian peringatan' }).click();

  // Change request: +2 revisions, +Rp4M, +5 days
  await tab(page, 'Perubahan');
  await page.getByRole('button', { name: 'Isi otomatis' }).click();
  await expect(page.getByLabel('Tambahan revisi')).toHaveValue('2');
  await page.getByLabel('Tambahan nilai (Rp)').fill('4000000');
  await page.getByLabel('Perpanjangan (hari)').fill('5');
  await page.getByRole('button', { name: 'Ajukan', exact: true }).click();
  await notice(page, /Permintaan perubahan diajukan/);
  await expect(page.getByText('Acuan V1', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Setujui perubahan' }).click();
  await notice(page, /disetujui/);

  // V2 active, V1 archived, revision alert recomputed
  await expect(page.getByText('Acuan V2', { exact: true }).first()).toBeVisible();
  await tab(page, 'Acuan proyek');
  await expect(page.getByText('Diarsipkan')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Acuan aktif V2' })).toBeVisible();
  await expect(page.getByText(/Nilai kontrak: .*Rp\s?120\.000\.000.*→.*Rp\s?124\.000\.000/)).toBeVisible();
  await expect(page.getByText(/Tenggat: .*30 Nov 2026.*→.*5 Des 2026/)).toBeVisible();
  await tab(page, 'Ringkasan');
  await expect(page.getByText('5 dari 5')).toBeVisible();
  await tab(page, 'Peringatan');
  await expect(page.locator('article', { hasText: 'revisi di luar acuan' })).toHaveCount(0);
  await expect(page.locator('article', { hasText: 'selesai, belum ditagih' })).toHaveCount(1);

  // Persistence across reload
  await page.reload();
  await expect(page.getByText('Acuan V2', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Rp\s?124\.000\.000/).first()).toBeVisible();

  // Dashboard reflects the same numbers
  await page.getByRole('link', { name: 'Dashboard' }).first().click();
  await expect(page.getByText('Belum ditagih', { exact: true })).toBeVisible();
  await expect(page.locator('div', { hasText: /^Belum ditagihRp 30 Jt/ }).first()).toBeVisible();

  expect(errors, errors.join('\n')).toEqual([]);
});
