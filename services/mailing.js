const nodemailer = require("nodemailer");
const expbs = require("handlebars");
const path = require("path");
const fs = require("fs");

const emailVerificationTemplate = ({ username, url, exp_time, subject }) => {
    const filePath = path.join(
        __dirname,
        "../views/emailVerificationTemplate.handlebars"
    );
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = expbs.compile(source);
    const replacements = {
        username,
        url,
        subject,
        text_description:
            "Thank you for registering on our platform! Before you can start enjoying all the benefits of our service, we need to verify your email address.",
        text_call_to_action:
            "To complete the verification process, please click on the verification link below:",
        text_warning: `Please note that this link will only be active for the next ${exp_time}. If you don't verify your email address within that time, you will need to register again.`,
        text_note:
            "If you didn't register for our service, please ignore this email.",
        button: "Verify Your Email",
    };
    const htmlToSend = template(replacements);
    return htmlToSend;
};

const emailResetPasswordTemplate = ({ username, url, exp_time, subject }) => {
    const filePath = path.join(
        __dirname,
        "../views/emailVerificationTemplate.handlebars"
    );
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = expbs.compile(source);
    const replacements = {
        username,
        url,
        subject,
        text_description:
            "We have received a request to reset the password for your account with us.",
        text_call_to_action:
            "To reset your password, please follow the link below:",
        text_warning: `Please note that this link will only be active until ${exp_time}.  If you don't reset your password within that time, you will need to request another password reset.`,
        text_note:
            "If you didn't request a password reset, please ignore this email.",
        button: "Reset Your Password",
    };
    const htmlToSend = template(replacements);
    return htmlToSend;
};

const emailAcceptanceOfAccessRequestsTemplate = ({
    username,
    text_description,
    subject,
}) => {
    const filePath = path.join(
        __dirname,
        "../views/emailRoomRequestTemplate.handlebars"
    );
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = expbs.compile(source);
    const replacements = {
        username,
        subject,
        text_description,
        text_call_to_action:
            "You can now access the room and enjoy its facilities, We appreciate your interest in our facilities and hope that you enjoy using the room.",
        text_warning: `Please remember to abide by the rules and regulations of the room to ensure a pleasant experience for all users`,
        text_note:
            "If you didn't request that room access, please ignore this email.",
    };
    const htmlToSend = template(replacements);
    return htmlToSend;
};

const emailDeclineOfAccessRequestsTemplate = ({
    username,
    text_description,
    subject,
}) => {
    const filePath = path.join(
        __dirname,
        "../views/emailRoomRequestTemplate.handlebars"
    );
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = expbs.compile(source);
    const replacements = {
        username,
        subject,
        text_description,
        text_call_to_action:
            "We understand that this may be disappointing news, and we apologize for any inconvenience this may cause.",
        text_warning: `Thank you for your interest in our facilities and we hope to have the opportunity to serve you in the future.`,
        text_note:
            "If you didn't request that room access, please ignore this email.",
    };
    const htmlToSend = template(replacements);
    return htmlToSend;
};
/**
 * This function for sending email
 * @param {string} user_mail User email destination
 * @param {string} subject SUbject for use
 * @param {string} template Message for use
 */

const sendEmail = async (user_mail, subject, template) => {
    if (process.env.NODE_ENV === 'development') {
        console.log("\n===========================================");
        console.log(`[DEV MODE] Email seharusnya terkirim ke: ${user_mail}`);
        console.log(`[DEV MODE] Subject: ${subject}`);
        // Kita ekstrak URL dari template HTML untuk kemudahan
        const urlMatch = template.match(/href="([^"]+)"/);
        if (urlMatch && urlMatch[1]) {
            console.log(`[DEV MODE] Link Verifikasi: ${urlMatch[1]}`);
        }
        console.log("===========================================\n");
        return; // Keluar dari fungsi, tidak akan menjalankan nodemailer
    }

    try {
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_SERVER,
            port: Number(process.env.MAIL_PORT),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.MAIL_USER, // generated ethereal user
                pass: process.env.MAIL_SECRET, // generated ethereal password
            },
        });

        let info = await transporter.sendMail({
            from: '"Smart Room Authentication Service" <no-replay@smartroom.id>', // sender address
            to: `${user_mail}`, // list of receivers
            subject,
            html: template,
        });

        console.log("✅ Email berhasil dikirim. Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ Gagal mengirim email:", error.message);
        console.error("Pastikan variabel MAIL_SERVER, MAIL_PORT, MAIL_USER, dan MAIL_SECRET sudah diatur dengan benar di file .env");
    }
};

const urlTokenGenerator = (req, endpoint, token) => {
    let finalUrl = `${req.protocol}://${req.get(
        "host"
    )}/${endpoint}?token=${token}`;
    return finalUrl;
};

module.exports = {
    sendEmail,
    urlTokenGenerator,
    emailVerificationTemplate,
    emailResetPasswordTemplate,
    emailAcceptanceOfAccessRequestsTemplate,
    emailDeclineOfAccessRequestsTemplate,
};
