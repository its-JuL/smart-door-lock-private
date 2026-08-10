> # SMART DOOR LOCK

Sistem backend dan fronted untuk sistem smart door lock. Dokumentasi ini diharapkan bisa menjadi panduan untuk pengembangan aplikasi dimasa depan.

---

Dokumentasi ini akan membahasa beberapa hal diantaranya teknologi inti yang digunakan. Penjelasan arsitekutur sistem dan sistem routing serta file, cara menjalankan server dan masih banyak lagi.

## Daftar Isi

1. [Arsitektur Sistem](#arsitektur-sistem)
2. [Menjalankan Server](#menjalankan-server)

## Arsitektur Sistem

Sistem beckend **Smart Door Lock** mengikuti arsitektur MVC (Model - View - Controler). Arsitektur ini dipilih karena akan memudahkan separasi fungsi yang nantinya akan memudahkan pengembangan aplikasi dan memudahkan proses pembacaan kode. Adapun gambaran struktur MVC yang digunakan pada sistem kali ini adalah.

```
project
│   app.js
│   router.js
└───api
|   |   controler.js
|   |   router.js
└───prisma (database)
|   |   schema
```

Setiap service/layanan yang dibuat nantinya akan di tempatkan dalam sebuah folder yang diawali dengan kata `api` atau `app` dan diikuti dengan nama yang mewakili fungsi atau layanan didalamnya. Seperti `api_user` yang akan memuat fungsi-fungsi terkait dengan sistem user (cth: login, register, logout). Di dalam folder tersebut akan dua file yang befungsi sebagi pengatur **view** dan **controler**. **controler** merupakan sebuah url dispatcher atau pengatur rute ketika user memasukan alamat tertentu, pada sistem kali ini **controler** akan direpresentasikan oleh file `router.js`. Sedangkan **view** merupakan sekumpulan fungsi yang akan menampilkan suatu hasil yang bisa dimengerti oleh user. Pada sistem kali ini **view** akan direpresentasikan oleh file `controller.js`.

File [`app.js`](app.js) merupakan file utama yang menampung fungsi-fungsi utama untuk menjalankan server.

File [`router.js`](router.js) merupakan file yang akan menampung semua fungsi router dari setiap service.

Folder [`prisma`](prisma) merupakan folder model atau database, di dalamnya terdapat sebuah file penting bernama [`scheme.primsa`](prisma/schema.prisma) yang merepresentasikan struktur database yang digunakan. Untuk versi 1.0 versi database yang digunakan sebagai berikut.

![struktur database](doc/Smart%20Door%20AIO.png)

Selain folder dan file-file utama yang telah disebutkan sebelumnya terdapat beberapa file pendukung seperti:

## Menjalankan Server

Hal pertama yang harus dilakukan untuk mengembangkan sistem ini adalah melakukan clonning dari repositori smart door lock. Setelah berhasil melakukan cloning repositori terdapat beberapa library yang harus diinstal terlebih dahulu. Instalasi program tersebut dapat dilakukan dengan npm atau yarn. Dalam dokumentasi sistem ini semua interaksi dengan command line akan menggunkan yarn. Lihat tata cara instalasi dan penggunaan yarn [disini](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable). Setelah menginstal yarn proses berikutnya adalah menginstal library. Library yang diperlukan dapat diinstal dengan perintah.

```shell
yarn install
```

Setelah semua library terinstal, hal berikutnya yang perlu dilakukan adalah migrasi database. Pastikan database server sudah menyala dan siap digunakan. Atur cridential untuk menghubungkan database pada variable `DATBASE_URL` yang terletak pada file [.env](.env). Atur tipe database yang digunakan diikuti dengan username, password, port yang digunakan dan nama database yang akan dibuat atau digunakan. Setelah pengaturan `DATBASE_URL` selesai proses berikutnya adalah melakukan mighrasi. Migrasi dapat dilakukan dengan menggunakan perintah berikut ini:

```shell
yarn db:migrate
```

Perintah di atas hanya digunakan ketika proses development berlangsung. Jika proses development sudah selesai dan sudah memasuki mode deployment maka command yang digunakan adalah:

```shell
yarn db:deploy
```

Atau dapat menggunakan berbagai macam command yang telah disedeiakan _prisma_. Referensi seluruh command dapat dilihat melalui [tautan berikut ini](https://www.prisma.io/docs/reference/api-reference/command-reference). Untuk melihat tampilan database dengan user interface dapat menggunakan command berikut ini:

```shell
yarn db:studio
```

Setelah migrasi berhasil, hal yang perlu diperhatiikan adalah proses seeding, atau membuat data dummy untuk superadmin ketika server pertama kali di jalankan. Ingat proses ini hanya perlu dilakukan sekali saja. Untuk melakukan seeding command yang digunakan adalah:

```shell
yarn prisma db seed
```

Setelah migrasi dan seeding sukses dilakukan, proses berikutnya adalah menjalankan server di development mode. Command yang digunakan adalah:

```shell
yarn dev
```

or

```shell
yarn watch
```

Perintah `yarn dev` hanya akan merefresh backend server ketika terjadi perubahan. Sedangkan `yarn watch` akan melakukan refresh pada backend server beserta dengan user interface.
