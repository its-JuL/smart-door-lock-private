# Panduan Kode Website Smart Door Lock

Dokumen ini menjelaskan alur website yang sedang digunakan agar perubahan antarmuka dapat dilakukan tanpa mengubah kontrak API, MQTT, atau perangkat keras.

## Batasan Website

Website terdiri dari server Express, template Handlebars, JavaScript browser, stylesheet, dan endpoint API yang telah ada. File di `api_*`, `connection/mqtt.js`, serta `services` yang berkaitan dengan pendaftaran/perangkat adalah kontrak backend dan hardware. Jangan mengubah payload, topic MQTT, atau rute API hanya untuk merapikan tampilan.

## Titik Masuk dan Routing

`app.js` adalah titik masuk server yang dipakai oleh `yarn start`, `yarn dev`, `yarn watch`, dan `Procfile`. File ini memuat konfigurasi environment, middleware Express, aset statis di `public`, mesin Handlebars, Socket.IO, koneksi MQTT, lalu memasang router utama dari `router.js`.

`router.js` adalah router tingkat aplikasi. Router ini menerapkan `setUser` pada request GET, menyediakan `GET /js.cookie.js`, lalu memasang router API dan router UI. Halaman dashboard dipasang pada awalan `/dashboard`, autentikasi pada `/auth`, profil pada `/profile`, dan halaman pengguna umum pada `/`.

Rute halaman dashboard berada di `app_dashboard/router.js`. Setiap rute dilindungi middleware sesuai peran (`loginRequired`, `allowedRole`, dan umumnya `accountIsVerified`) sebelum fungsi controller dijalankan.

## Render Halaman

`app_dashboard/dashboardControllers.js` menyiapkan data untuk `res.render`. Data yang umum dipakai adalah:

- penanda menu aktif seperti `room`, `card`, atau `authentication`;
- `styles`, yaitu urutan stylesheet khusus halaman;
- `scripts`, yaitu urutan JavaScript khusus halaman;
- `layout`, yaitu nama layout berdasarkan peran pengguna.

`services/layout.js` memilih layout `base`, `operatorBase`, `adminteknisBase`, atau `userBase` berdasarkan role pengguna. Layout berada di `views/layouts`. Setiap layout memuat stylesheet umum di bagian `head`, isi template melalui `{{{body}}}`, utilitas JavaScript umum di bagian akhir dokumen, lalu semua item `scripts` secara berurutan.

Urutan script adalah bagian dari kontrak halaman. Utilitas global seperti `fetcher.js`, `alert.js`, `toast.js`, dan `loader.js` dimuat lebih dulu oleh layout. Karena itu, script halaman dapat memakai fungsi global tersebut. Jangan mengubah urutan script dalam controller tanpa memeriksa dependensinya.

## Struktur Frontend

`views/` berisi template halaman Handlebars. `public/js/` berisi perilaku khusus halaman dan `public/js/util/` berisi utilitas browser bersama. `public/style/` berisi stylesheet. Semua file di `public` tersedia langsung dari root URL, misalnya `public/js/roomDetail.js` diakses sebagai `/js/roomDetail.js`.

Halaman detail ruang adalah contoh pembagian kode yang sengaja dipertahankan. Controller `roomDetail` memuat script berikut secara berurutan:

1. `/js/roomDetail.js` untuk detail dasar ruang;
2. `/js/roomDetailAccaptableCard.js` untuk kartu yang mempunyai akses;
3. `/js/roomDetailAccaptableRequestUser.js` untuk permintaan akses pengguna;
4. `/js/roomDetailHistory.js` untuk riwayat.

Keempat file dapat berbagi elemen DOM dan variabel global berdasarkan urutan tersebut. Jangan menggabungkan atau memecahnya kembali kecuali dependensi halaman sudah diperiksa.

Halaman PIN, fingerprint, dan face recognition memakai helper `authenticationPage` dalam `app_dashboard/dashboardControllers.js`. Ketiganya menggunakan `views/pinList.handlebars`, `views/fingerprintList.handlebars`, atau `views/faceRecognition.handlebars`, serta frontend bersama `/js/credentials.js`.

## Konvensi Perubahan Aman

Untuk perubahan tampilan, ubah template, stylesheet, dan script halaman yang relevan terlebih dahulu. Untuk halaman baru, tambahkan rute di `app_dashboard/router.js`, controller render di `app_dashboard/dashboardControllers.js`, template di `views/`, kemudian script/style melalui array `scripts` dan `styles`.

Simpan fungsi yang hanya dipakai satu halaman di file halaman tersebut. Gunakan `public/js/util/` hanya jika fungsi benar-benar dipakai lintas halaman. Pendekatan ini mencegah fungsi kecil tersebar ke banyak file tanpa kebutuhan.

Sebelum menghapus file, cari referensi nama file dan URL aset di seluruh repository. Aset vendor tidak boleh dihapus hanya berdasarkan nama folder; pastikan tidak ada layout, controller, template, atau konsumen statis lain yang memakainya.

## Menjalankan dan Memeriksa

Instal dependensi dengan `yarn install`. Salin dan isi konfigurasi environment yang diperlukan, terutama koneksi database. Jalankan server dengan `yarn dev` saat pengembangan atau `yarn start` untuk Node.js biasa. Aplikasi memakai `app.js` sebagai entry point.

Test saat ini berupa file Node.js mandiri di `tests/*.test.js`. Jalankan satu test dengan `node tests/namaTest.test.js`. Setelah dependensi diinstal, jalankan seluruh test dengan:

```sh
for f in tests/*.test.js; do node "$f"; done
```

Sebagian test yang memuat `services/mqttRegistrationBridge.js` membutuhkan paket Prisma yang tersedia setelah instalasi dependensi. Jalankan pemeriksaan sintaks file JavaScript yang diubah dengan `node --check path/ke/file.js`, lalu lakukan smoke test halaman yang terdampak setelah server aktif.

## Pembersihan September 2026

Pembersihan website hanya menghapus artefak yang tidak memiliki referensi repository dan tidak mengubah alur halaman aktif. Artefak yang dihapus adalah salinan lama `public/js/roomDetail copy.js`, snapshot `credentials.js.before_user_owned_pins`, serta snapshot template PIN dan fingerprint. Fungsi `formTemplate` yang tidak pernah dipanggil juga dihapus dari `public/js/roomDetailAccaptableCard.js`; formulir aktif tetap berada di `views/roomDetail.handlebars`.

Bundle vendor `public/js/splide/` dan `public/style/three-dots-master/` belum dihapus dalam pembersihan ini. Walaupun tidak ditemukan referensi internal, keduanya dibiarkan agar konsumen file statis di luar repository tidak terpengaruh.
