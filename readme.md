# Smart Door Lock - Panduan Menjalankan Sistem Lokal

Dokumentasi ini menjelaskan arsitektur sistem dan langkah lengkap untuk menjalankan aplikasi Smart Door Lock di lingkungan lokal (Node.js, PostgreSQL/Prisma, MQTT broker, dan service Face Recognition Python).

---

## 1. Prasyarat Sistem

Pastikan perangkat lokal sudah terpasang:
- **Node.js** (rekomendasi LTS / v20+) dan **yarn**
- **PostgreSQL** (default port 5432)
- **Python** (v3.10 - 3.12 untuk service face recognition)
- **MQTT Broker** (misal Eclipse Mosquitto pada port 1883/1884 jika ingin menguji komunikasi hardware/sensor live)

---

## 2. Struktur Arsitektur Singkat

Aplikasi ini menggunakan pola layered MVC dengan integrasi IoT:
- **`app.js`**: Entry point Express, Socket.IO, session, aset statis, dan inisialisasi koneksi MQTT logger.
- **`router.js`**: Router utama aplikasi yang membagi lalu lintas ke:
  - UI Dashboards (`/dashboard`, `/auth`, `/profile`, `/`)
  - REST API (`/api/v1/*`, `/api/v2/*`)
- **`prisma/`**: Schema ORM (`schema.prisma`), migrasi PostgreSQL, wrapper client, dan script bootstrap akun superadmin (`createSuperAdmin.js`).
- **`services/`**: Normalisasi access record, logger MQTT, layout selector, email transporter, dan operator scope.
- **`services/faceRecognition/`**: Worker Python independen untuk deteksi (MTCNN) dan inferensi wajah via MQTT.
- **`capture/`**: Penyimpanan foto tangkapan kamera untuk verifikasi autentikasi wajah (diekspos secara web-relative via `/capture/<filename>`).

---

## 3. Konfigurasi Environment (`.env`)

Buat atau sesuaikan file `.env` di root folder proyek:

```env
PORT=8000
NODE_ENV=development
SECRET=kunci_rahasia_jwt_session_lokal_anda

# Koneksi PostgreSQL Lokal
DATABASE_URL="postgresql://postgres:password_anda@localhost:5432/doorlock_db?schema=public"

# Koneksi MQTT Broker (sesuaikan dengan broker lokal atau VPS development)
MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_USERNAME=smart-doorlock
MQTT_PASSWORD=password_broker_anda

# Konfigurasi Mailer (opsional di dev, fallback ke mock/console)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=email_anda@gmail.com
MAIL_SECRET=app_password_anda
MAIL_FROM=email_anda@gmail.com
```

---

## 4. Langkah Menjalankan Aplikasi Secara Lokal

### Langkah 1: Install Dependensi Node.js
```bash
yarn install
```

### Langkah 2: Setup Database & Prisma
Pastikan service database PostgreSQL aktif dan database `doorlock_db` sudah dibuat, lalu jalankan:

```bash
# Validasi schema prisma
yarn prisma validate

# Terapkan migrasi terbaru ke database lokal
yarn db:deploy

# Generate Prisma Client & DBML
yarn db:generate
```

*Catatan:* Jika database masih baru/kosong dan memerlukan inisialisasi akun Superadmin default:
```bash
yarn db:create
```

### Langkah 3: Menjalankan Backend Node.js
Gunakan salah satu perintah berikut:

```bash
# Mode development dengan hot-reload
yarn dev

# Mode watch (backend + aset template)
yarn watch

# Mode produksi langsung
yarn start
```
Server akan berjalan di `http://localhost:8000`.

---

## 5. Menjalankan Service Face Recognition (Python)

Jika ingin menguji alur autentikasi dan registrasi wajah:

1. Buka terminal baru dan masuk ke direktori service:
   ```bash
   cd services/faceRecognition
   ```
2. Buat dan aktifkan virtual environment (opsional tetapi direkomendasikan):
   ```bash
   python -m venv venv
   # Di Windows:
   venv\Scripts\activate
   # Di Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependensi Python:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan service:
   ```bash
   python face_recognition_service.py
   ```

Service ini akan berlangganan ke topik MQTT kamera, memproses frame capture, menyimpan bukti tangkapan ke folder `capture/`, dan mempublikasikan status hasil autentikasi.

---

## 6. Fitur Baru: Riwayat Autentikasi & Seleksi Kamera

1. **Riwayat Terpadu:**
   - Halaman: `/dashboard/authentication/history`
   - Hanya dapat diakses oleh role **SUPERADMIN (ADMIN)** dan **OPERATOR**.
   - Menampilkan catatan autentikasi berhasil maupun gagal untuk seluruh metode (RFID, PIN, Fingerprint, Face).
   - Mendukung filter waktu, metode autentikasi, status (berhasil/gagal), dan identitas hardware.
   - Menyertakan detail alasan (misal `unknown_face`, `invalid_pin`) dan tautan bukti capture wajah bila tersedia.

2. **Dropdown / Search Hardware Kamera:**
   - Pada halaman `/dashboard/face-recognition`, preview foto mewajibkan pemilihan hardware aktif terlebih dahulu.
   - Endpoint capture bersifat aman dan terisolasi per perangkat: `/api/v1/face/latest-capture/:deviceId`.

---

## 7. Pengujian (Testing)

Sebelum melakukan commit atau deployment, selalu jalankan pengujian:

```bash
# Full test suite Node.js
node --test test/*.test.js

# Test kontrak Face Recognition (Python)
python -m unittest services/faceRecognition/tests/test_face_mqtt_contract.py
```
