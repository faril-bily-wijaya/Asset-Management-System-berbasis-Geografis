# 🗺️ Asset Management System Berbasis Geografis

Sebuah aplikasi web moderen dan interaktif yang berfungsi sebagai **Sistem Informasi Geografis (GIS) untuk Manajemen Aset dan Inventaris IT/Telekomunikasi**. Aplikasi ini dirancang untuk memetakan, memonitor, dan menganalisis sebaran perangkat infrastruktur (seperti Catu Daya, Router, Switch, OLT, Genset, dll) di berbagai wilayah menggunakan integrasi peta *real-world*.

## ✨ Fitur Utama

- **Pemetaan Geografis Interaktif**: Memvisualisasikan ribuan titik perangkat di atas peta interaktif menggunakan `Leaflet.js`. Mendukung *clustering* cerdas saat *zoom out* untuk performa maksimal.
- **Tampilan Peta Resolusi Tinggi**: Pilihan gaya peta lengkap mulai dari mode Jalan (*Street Mode*) yang sangat detail hingga *Satelit Super* dengan tingkat akurasi *zoom* maksimal (Level 22).
- **Filter Inventaris Lanjutan (Advanced Filtering)**: Sistem pemfilteran *multi-layer* berdasarkan:
  - **Tipe Perangkat**: Catu Daya (Genset, Baterai, Rectifier) vs Non-Catu Daya (Switch, Router, Server).
  - **Status Operasional**: Operational, Tidak Berfungsi, Idle.
  - **Kondisi Fisik**: Normal vs Rusak.
  - **Merek (Brand)**: Pencarian presisi spesifik perangkat.
- **Pencarian Global**: Mencari spesifik berdasarkan Nama Lokasi, Kode Perangkat (UID), Tipe, Merek, maupun Status langsung melalui kotak pencarian super cepat.
- **Visualisasi Data Analitik**: Tampilan grafik dan bagan (Pie Chart & Bar Chart) *real-time* yang otomatis menyesuaikan diri dengan wilayah atau filter yang sedang aktif di peta.
- **Mode Heatmap**: Menampilkan peta kepadatan (*Heatmap*) sebaran perangkat untuk menganalisis beban dan konsentrasi perangkat di suatu area geografis.
- **Ekspor Data (CSV)**: Mengekspor secara instan tampilan tabel data atau seluruh data global ke dalam format CSV/Excel.
- **Geolokasi Otomatis (Koordinat Asli)**: Pemetaan data CSV secara dinamis ke dalam Longitude dan Latitude nyata yang berpusat di lokasi infrastruktur wilayah Sumatera dan sekitarnya.

## 🛠️ Teknologi yang Digunakan (Tech Stack)

Aplikasi ini dibangun di atas ekosistem JavaScript modern untuk performa tinggi dan tampilan UI/UX sekelas perangkat lunak *Enterprise*.

- **Framework Core**: [React.js](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Pemetaan (Maps)**: [React-Leaflet](https://react-leaflet.js.org/) + [Leaflet.js](https://leafletjs.com/)
- **Pengelompokan Penanda (Marker)**: React Leaflet Cluster
- **Styling (CSS)**: [TailwindCSS](https://tailwindcss.com/)
- **Ikonografi**: [Lucide React](https://lucide.dev/)
- **Animasi UI**: [Framer Motion](https://www.framer.com/motion/)
- **Grafik & Analitik**: [Recharts](https://recharts.org/)
- **Data Parsing**: [PapaParse](https://www.papaparse.com/)

## 🚀 Cara Menjalankan Aplikasi di Lokal (Development)

Prasyarat: Pastikan komputer Anda telah terinstal **Node.js** (versi 16 atau lebih baru).

1. **Kloning Repositori ini:**
   ```bash
   git clone https://github.com/faril-bily-wijaya/Asset-Management-System-berbasis-Geografis.git
   cd Asset-Management-System-berbasis-Geografis
   ```

2. **Instalasi Dependencies (Modul NPM):**
   ```bash
   npm install
   ```

3. **Jalankan Server Lokal:**
   ```bash
   npm run dev
   ```

4. Buka tautan URL yang muncul di terminal Anda (biasanya `http://localhost:5173`) pada peramban/browser modern pilihan Anda.

## 📁 Struktur Data dan File Penting

- `public/DATA/` : Menyimpan file `.csv` dan `.json` utama yang digunakan oleh aplikasi sebagai basis data lokal tanpa perlu backend SQL.
  - `data-grouped.json`: File hasil kompilasi script *preprocess* yang merangkum jumlah perangkat di koordinat tertentu.
  - `data-location.json`: Metadata titik kordinat latitude & longitude presisi untuk setiap nama lokasi.
- `src/App.jsx` : Berkas inti pengontrol antarmuka utama (UI Controller). Mengelola State, Sidebar, Modal, dan sinkronisasi filter ke *URL Parameters*.
- `src/utils/parser.js` : Modul pemroses (Parser) khusus yang mengubah mentahan file teks data dan kamus koordinat lokasi.
- `scripts/preprocess.js` : Skrip Node.js utilitas (berjalan di belakang layar saat proses *build*) yang membersihkan dan memformat struktur data inventaris menjadi peta geo-lokasi.

## ⚙️ Skrip Pendukung (Scripts)
- Menggabungkan/Mengekstrak data baru dari lokasi `.csv`: `node scripts/preprocess.js`
- Mengatur titik koordinat baru: `node scratch/update_coords.js` (Lalu jalankan ulang preprocess).

---

> *Sistem ini sedang dalam pengembangan berkesinambungan dan dapat dengan mudah diekspansi untuk menjadi Network Monitoring System (NMS) berbasis realtime ke depannya.*
