> # SMART DOOR LOCK

Sistem backend dan fronted untuk sistem smart door lock. Dokumentasi ini diharapkan bisa menjadi panduan untuk pengembangan aplikasi dimasa depan.

---

> ## Role Controller

Menjabarkan fungsi-fungsi pada controller **role**. **Role** sendiri merupakan sistem grouping yang digunakan untuk mengatur akses ke halaman website. Mislanya pengguna dengan role _ADMIN_ hanya bisa mengakses halaman yang berkaitan dengan proses menejemen website dan tidak bisa menggunakan view pengguna dengan role lainnya. Pada versi 1 terdapat 2 role yaitu _ADMIN_ dan _USER_, besar kemungkinan pada versi verikutnya terdapat role baru serta sistem **Role** digunakan untuk melakukan menejemen ruangan. Terdapat beberapa controleer yang diguanakan, dan list setiap fungsi bisa dilihat pada list di bawah ini.

1. [List](#list)
2. [Detail](#detail)
3. [Create](#create)
4. [Delete](#delete)
5. [Update](#update)

## List

Controller yang digunakan untuk menampilkan list role yang tersedia. Contrroler mengimplementasikan paginasi berbasis cursor dengan maksimal output setiap request adalah 10 object.

## Detail

Controller detail merupakan controller yang digunakan untuk menampilkan detail informasi dari setiap role. Controller ini memerlukan sebuah parameter yang akan didapat dari `req.params` yaitu roleId. `roleId` merupakan primery key yang digunakan untuk mengambil data dari database.

## Create

Merupakan contrroler yang digunakan untuk menambahkan data baru ke database. Data yang akan ditambahkan adalah nama role, nama role haruslah unik dan belum pernah tersimpan di database sebelumnya.

## Delete

Merupakan controller yang digunakan untuk menghapus data role dari database. Memerlukan sebuah parameter yaitu `roleId` sebagai acuan untuk menghapus data.

## Update

Merupakan controller yang digunkan untuk memperbaharui data role yang tersimpan di database. Memerlukan sebuah parameter yaitu `{roleId} = req.params` serta `{name} = req.body` sebagai acuan untuk memperbaharui data.
