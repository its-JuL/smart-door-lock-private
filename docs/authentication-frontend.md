# Frontend Autentikasi

Dokumen ini menjelaskan menu **Autentikasi** pada dashboard Smart Door Lock, yang berisi Card, PIN, Fingerprint, dan Face Recognition.

## Mengakses halaman

Login sebagai **Admin** atau **Operator**, buka Dashboard, lalu tekan menu **Autentikasi** pada sidebar.

| Menu | URL | Halaman |
| --- | --- | --- |
| Card | `/dashboard/card/list` | `views/cardList.handlebars` |
| PIN | `/dashboard/pin/list` | `views/pinList.handlebars` |
| Fingerprint | `/dashboard/fingerprint/list` | `views/fingerprintList.handlebars` |
| Face Recognition | `/dashboard/face-recognition` | `views/faceRecognition.handlebars` |

## Lokasi kode

| Kebutuhan | File |
| --- | --- |
| Item dropdown Admin | `views/layouts/base.hbs` |
| Item dropdown Operator | `views/layouts/operatorBase.hbs` |
| Gaya sidebar/dropdown | `public/style/navbar.css` |
| Rute halaman | `app_dashboard/router.js` |
| Data render halaman | `app_dashboard/dashboardControllers.js` |
| Gaya ketiga halaman | `public/style/credentials.css` |
| Interaksi browser/API | `public/js/credentials.js` |

## Mengubah item dropdown

Tambahkan atau hapus tautan di dalam elemen `<div id="authentication-menu">` pada kedua layout. Gunakan pola berikut:

```hbs
<a href="/dashboard/contoh" class="nav-authentication-item {{contoh}}">Contoh</a>
```

Nilai `{{contoh}}` dipakai controller untuk memberi penanda halaman aktif. Set nilai tersebut pada data `res.render`, misalnya `contoh: "bg-neutral-4"`.

Jika item baru membutuhkan halaman sendiri, tambahkan rutenya di `app_dashboard/router.js`, lalu buat fungsi render di `app_dashboard/dashboardControllers.js` dan template `.handlebars` di folder `views`.

## Mengubah posisi label Autentikasi

Dropdown sengaja tidak memakai ikon. Posisi teks diatur oleh `padding-left` pada `.nav-authentication-toggle` dalam `public/style/navbar.css`. Nilai `5.6rem` menyetarakan posisi teks dengan label menu lain yang memiliki ikon. Ubah nilai itu sedikit bila ukuran ikon atau padding sidebar berubah.

## Integrasi API

- **PIN** menggunakan API `/api/v1/pin/list`, `/register`, `/update/:id`, dan `/delete/:id`.
- **Fingerprint** menggunakan API `/api/v1/fingerprint/list`, `/update/:id`, dan `/delete/:id`.
- **Face Recognition** saat ini menggunakan MQTT pada service Python (`doorlock/{deviceId}/face/registration`). Agar tombol capture dapat benar-benar mengirim perintah, buat endpoint Node.js yang menerbitkan command MQTT tersebut, lalu panggil endpoint itu dari `public/js/credentials.js`.

## Setelah perubahan

Restart aplikasi Node.js agar rute, controller, stylesheet, dan template yang berubah dimuat kembali. Jika memakai nodemon, perubahan biasanya dimuat otomatis.
