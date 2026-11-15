/**
 * Membuat / memastikan akun superadmin ada di database.
 *
 * Berbeda dengan `yarn db:seed` (yang membuat API key, device, room, role, dan user
 * sekaligus dan gagal bila dijalankan dua kali), script ini idempoten: aman
 * dijalankan berulang kapan saja.
 *
 * Pemakaian:
 *   yarn db:create
 *   SUPERADMIN_USERNAME=admin SUPERADMIN_EMAIL=admin@kampus.ac.id \
 *   SUPERADMIN_PASSWORD='Rahasia.123' yarn db:create
 *   yarn db:create --reset-password      (paksa set ulang password)
 */
const prisma = require("./client");
const { hasher } = require("../services/auth");
const defaults = require("./superAdmin");

const base = defaults.user[0];
const resetPassword = process.argv.includes("--reset-password");

const username = process.env.SUPERADMIN_USERNAME || base.username;
const email = process.env.SUPERADMIN_EMAIL || base.email;
const rawPassword = process.env.SUPERADMIN_PASSWORD || null;
const passwordHash = rawPassword ? hasher(rawPassword) : base.password;

async function ensureRoles() {
    for (const r of defaults.role) {
        await prisma.role.upsert({
            where: { name: r.name },
            update: {},
            create: { name: r.name },
        });
    }
    console.log(`[ok] role tersedia: ${defaults.role.map((r) => r.name).join(", ")}`);
}

async function ensureSuperAdmin() {
    const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
        include: { profil: true },
    });

    if (existing) {
        const data = {
            role: { connect: { name: "ADMIN" } },
            emailIsVerified: true,
            accountIsVerified: true,
        };
        if (resetPassword) {
            data.password = passwordHash;
            data.passwordUpdatedAt = new Date(Date.now() - 1000);
        }

        await prisma.user.update({ where: { id: existing.id }, data });

        if (!existing.profil) {
            await prisma.profil.create({
                data: { userId: existing.id, full_name: existing.username },
            });
        }

        console.log(`[ok] superadmin sudah ada, tidak dibuat ulang: ${existing.username} <${existing.email}>`);
        console.log(`[ok] role dipastikan ADMIN, email & akun ditandai terverifikasi`);
        if (resetPassword) console.log("[ok] password di-set ulang sesuai SUPERADMIN_PASSWORD / default");
        return;
    }

    const created = await prisma.user.create({
        data: {
            username,
            email,
            password: passwordHash,
            emailIsVerified: true,
            accountIsVerified: true,
            passwordUpdatedAt: new Date(Date.now() - 1000),
            role: { connect: { name: "ADMIN" } },
            profil: { create: { full_name: username } },
        },
    });

    console.log(`[ok] superadmin dibuat: ${created.username} <${created.email}> (role ADMIN)`);
    if (!rawPassword) {
        console.log("[!] password memakai nilai default dari prisma/superAdmin.js — segera ganti setelah login");
    }
}

(async () => {
    try {
        await ensureRoles();
        await ensureSuperAdmin();
    } catch (err) {
        console.error("❌ Gagal membuat superadmin:", err.message);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
})();
