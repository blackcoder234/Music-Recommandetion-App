import nodemailer from "nodemailer"
import 'dotenv/config'

const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    })
}

export default sendEmail
