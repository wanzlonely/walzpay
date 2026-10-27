import type { ConvertOptions, DynamicQrisResult, QrisInfo } from "@/types";

function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

function getTagValue(payload: string, tag: string): string {
  let i = 0;
  while (i < payload.length - 4) {
    const currentTag = payload.substring(i, i + 2);
    const len = parseInt(payload.substring(i + 2, i + 4), 10);
    if (isNaN(len) || len < 0) break;
    const value = payload.substring(i + 4, i + 4 + len);
    if (currentTag === tag) return value;
    i += 4 + len;
  }
  return "";
}

function makeTag(tag: string, value: string): string {
  return `${tag}${value.length.toString().padStart(2, "0")}${value}`;
}

const MCC_LABELS: Record<string, string> = {
  "0742": "Dokter Hewan",
  "1520": "Kontraktor Bangunan",
  "1711": "Plumber / AC",
  "1731": "Listrik",
  "4111": "Transportasi",
  "4121": "Taksi / Ojek",
  "4131": "Bus / Angkutan",
  "4814": "Telekomunikasi",
  "4900": "Utilitas (Air/Listrik/Gas)",
  "5045": "Komputer & Elektronik",
  "5200": "Bahan Bangunan",
  "5251": "Toko Peralatan Rumah",
  "5310": "Toko Diskon",
  "5311": "Department Store",
  "5399": "Toko Umum",
  "5411": "Supermarket",
  "5422": "Produk Segar / Pasar",
  "5441": "Permen & Kue",
  "5451": "Susu & Dairy",
  "5462": "Bakeri / Roti",
  "5499": "Toko Makanan",
  "5511": "Dealer Mobil",
  "5541": "SPBU / Bensin",
  "5571": "Toko Motor",
  "5611": "Pakaian Pria",
  "5621": "Pakaian Wanita",
  "5631": "Pakaian Wanita & Anak",
  "5641": "Pakaian Anak",
  "5651": "Pakaian Keluarga",
  "5661": "Sepatu",
  "5691": "Pakaian Umum",
  "5699": "Fashion & Aksesoris",
  "5712": "Furnitur & Perabot",
  "5732": "Elektronik",
  "5812": "Restoran",
  "5813": "Bar / Kafe",
  "5814": "Fast Food",
  "5815": "Toko Digital / Aplikasi",
  "5912": "Apotek / Farmasi",
  "5940": "Toko Olahraga",
  "5945": "Toko Mainan",
  "5999": "Toko Ritel Lainnya",
  "6011": "ATM / Bank",
  "6300": "Asuransi",
  "7011": "Hotel / Penginapan",
  "7211": "Laundry",
  "7230": "Salon / Barbershop",
  "7298": "Spa & Kesehatan",
  "7299": "Jasa Umum",
  "7372": "Software / IT",
  "7512": "Rental Mobil",
  "7922": "Hiburan / Tiket",
  "7997": "Gym / Kebugaran",
  "8011": "Dokter",
  "8021": "Dokter Gigi",
  "8049": "Klinik",
  "8099": "Kesehatan Lainnya",
  "8211": "Sekolah",
  "8220": "Universitas",
  "8299": "Pendidikan Lainnya",
  "8999": "Jasa Profesional",
  "9399": "Layanan Pemerintah",
};

export function getMccLabel(mcc: string): string {
  return MCC_LABELS[mcc] || `Kategori ${mcc}`;
}

export const ISSUER_NAMES: Record<string, string> = {
  "ID.DANA.WWW":       "DANA",
  "ID.CO.SHOPEE.WWW":  "ShopeePay",
  "COM.GO-JEK.WWW":    "GoPay",
  "ID.CO.QRIS.WWW":    "QRIS (NOBU)",
  "ID.CO.BCA.WWW":     "BCA Mobile",
  "ID.CO.BNI.WWW":     "BNI Mobile",
  "ID.CO.BRI.WWW":     "BRI",
  "ID.CO.MANDIRI.WWW": "Mandiri",
  "ID.CO.OVO.WWW":     "OVO",
  "ID.CO.LINKAJA.WWW": "LinkAja",
};

export function parseQris(qrisString: string): QrisInfo {
  const clean = qrisString.trim();
  const merchantName = getTagValue(clean, "59") || "Merchant";
  const city         = getTagValue(clean, "60") || "-";
  const postalCode   = getTagValue(clean, "61") || undefined;
  const methodCode   = getTagValue(clean, "01");
  const method       = methodCode === "12" ? "dynamic" : "static";
  const mcc          = getTagValue(clean, "52");
  const category     = mcc ? getMccLabel(mcc) : undefined;

  let issuer = "Unknown";
  for (const key of Object.keys(ISSUER_NAMES)) {
    if (clean.includes(key)) {
      issuer = key;
      break;
    }
  }

  return {
    merchantName: merchantName.trim(),
    city: city.trim(),
    postalCode,
    issuer,
    method,
    category,
    currency: "IDR",
    rawString: clean,
  };
}

/**
 * Convert QRIS Statis → Dinamis dengan TLV parsing yang benar.
 * Tidak menggunakan regex untuk manipulasi tag — aman dari korupsi data.
 */
export function convertToDynamic(
  staticQris: string,
  options: ConvertOptions
): DynamicQrisResult {
  const { amount, feeType = "none", feeValue = 0 } = options;

  if (!staticQris || amount <= 0) {
    throw new Error("QRIS statis dan nominal wajib diisi");
  }

  // Strip CRC dari akhir string
  let payload = staticQris.trim().replace(/6304[A-Fa-f0-9]{4}$/i, "");

  // Ubah Point of Initiation: static(11) → dynamic(12)
  payload = payload.replace("010211", "010212");

  // Tag yang dihapus (akan di-replace dengan nilai baru)
  const SKIP_TAGS = new Set(["54", "55", "56", "57"]);

  let rebuilt = "";
  let amountInjected = false;
  let i = 0;

  // Sequential TLV parsing — aman, tidak pakai regex
  while (i < payload.length) {
    if (i + 4 > payload.length) {
      rebuilt += payload.slice(i);
      break;
    }

    const tag = payload.substring(i, i + 2);
    const len = parseInt(payload.substring(i + 2, i + 4), 10);

    if (isNaN(len) || len < 0 || i + 4 + len > payload.length) {
      rebuilt += payload.slice(i);
      break;
    }

    const chunk = payload.substring(i, i + 4 + len);
    i += 4 + len;

    if (SKIP_TAGS.has(tag)) continue;

    rebuilt += chunk;

    // Inject nominal + fee tepat setelah tag 53 (Transaction Currency = "360")
    if (tag === "53" && !amountInjected) {
      rebuilt += makeTag("54", Math.floor(amount).toString());

      if (feeType === "fixed" && feeValue > 0) {
        rebuilt += makeTag("55", "02");
        rebuilt += makeTag("56", Math.floor(feeValue).toString());
      } else if (feeType === "percent" && feeValue > 0) {
        rebuilt += makeTag("55", "03");
        rebuilt += makeTag("57", feeValue.toFixed(2));
      }

      amountInjected = true;
    }
  }

  // Fallback: tag 53 tidak ditemukan — inject sebelum country code (5802) atau di akhir
  if (!amountInjected) {
    let inject = makeTag("54", Math.floor(amount).toString());
    if (feeType === "fixed" && feeValue > 0) {
      inject += makeTag("55", "02") + makeTag("56", Math.floor(feeValue).toString());
    } else if (feeType === "percent" && feeValue > 0) {
      inject += makeTag("55", "03") + makeTag("57", feeValue.toFixed(2));
    }
    const pos = rebuilt.indexOf("5802");
    rebuilt = pos !== -1
      ? rebuilt.slice(0, pos) + inject + rebuilt.slice(pos)
      : rebuilt + inject;
  }

  const crc = calculateCRC16(rebuilt + "6304");
  const finalString = rebuilt + "6304" + crc;
  const info = parseQris(staticQris);
  const feeAmount =
    feeType === "fixed"
      ? Math.floor(feeValue)
      : feeType === "percent"
      ? Math.round((amount * feeValue) / 100)
      : 0;

  return {
    qrisString: finalString,
    amount,
    totalAmount: amount + feeAmount,
    feeAmount,
    merchantName: info.merchantName,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 menit
  };
}

export function isValidQris(qrisString: string): boolean {
  if (!qrisString || qrisString.length < 50) return false;
  if (!qrisString.trim().startsWith("000201")) return false;
  return /6304[A-F0-9]{4}$/i.test(qrisString.trim());
}
