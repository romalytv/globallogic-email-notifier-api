const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendConfirmationEmail(email, repoName, token) {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const confirmUrl = `${baseUrl}/api/confirm/${token}`;

    const mailOptions = {
        from: '"GitHub Notifier" <' + process.env.SMTP_USER + '>',
        to: email,
        subject: `Підтвердження підписки на ${repoName}`,
        text: `Для підтвердження підписки на релізи ${repoName}, перейдіть за посиланням: ${confirmUrl}`,
        html: `
      <h3>Підтвердження підписки</h3>
      <p>Ви намагаєтесь підписатися на сповіщення про нові релізи для репозиторію <b>${repoName}</b>.</p>
      <p>Щоб підтвердити свій email, натисніть на посилання нижче:</p>
      <a href="${confirmUrl}"><b>Підтвердити підписку</b></a>
      <p><br>Якщо ви цього не робили, просто зігноруйте цей лист.</p>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Confirmation mail send on ${email}`);
        return info;
    } catch (error) {
        console.error(`Error sending confirmation mail on ${email}:`, error);
        throw error;
    }
}

async function sendNewReleaseEmail(email, repoName, tagName, token) {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${token}`;

    const mailOptions = {
        from: '"GitHub Notifier" <' + process.env.SMTP_USER + '>',
        to: email,
        subject: `Новий реліз у ${repoName}!`,
        text: `Вийшла нова версія ${tagName} для репозиторію ${repoName}.\n\nЩоб відписатися від оновлень, перейдіть за посиланням: ${unsubscribeUrl}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h3>Новий реліз!</h3>
              <p>Вийшла нова версія <b>${tagName}</b> для репозиторію <b>${repoName}</b>.</p>              
              <p style="font-size: 12px; color: #777;">
                Ви отримали цей лист, оскільки підписані на оновлення цього репозиторію.<br>
                Якщо ви більше не хочете отримувати ці сповіщення, ви можете 
                <a href="${unsubscribeUrl}" style="color: #d9534f; text-decoration: none;">відписатися за цим посиланням</a>.
              </p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Mail send to ${email}`);
        return info;
    } catch (error) {
        console.error(`Error sending mail to ${email}:`, error);
    }
}

module.exports = { sendConfirmationEmail, sendNewReleaseEmail };