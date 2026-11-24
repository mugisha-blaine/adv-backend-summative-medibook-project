const express = require("express");
const router = express.Router();

const en = require("../../locales/en.json");
const fr = require("../../locales/fr.json");

router.get("/", (req, res) => {
    const lang = req.query.lang === "fr" ? "fr" : "en";
    const content = lang === "fr" ? fr : en;

    const date = new Intl.DateTimeFormat(
        lang === "fr" ? "fr-FR" : "en-GB",
        {
            dateStyle: "long",
            timeZone: "Africa/Kigali"
        }
    ).format(new Date());

    const questions = content.questions.map((question, index) => `
    <div class="question">
      <label for="q${index + 1}">${index + 1}. ${question}</label>
      <textarea id="q${index + 1}" name="q${index + 1}"
        rows="4" required>${content.answers[index]}</textarea>
    </div>
  `).join("");

    res.type("html").send(`
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${content.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f5f7fa;
          margin: 0;
          padding: 30px;
          color: #243447;
        }
        main {
          max-width: 750px;
          margin: auto;
          background: white;
          padding: 30px;
          border-radius: 12px;
        }
        h1 { color: #1565c0; }
        .languages { margin-bottom: 20px; }
        .languages a { margin-right: 15px; }
        .question { margin: 22px 0; }
        label {
          display: block;
          font-weight: bold;
          margin-bottom: 10px;
        }
        textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid #bbb;
          border-radius: 6px;
          font: inherit;
        }
        button {
          background: #1565c0;
          color: white;
          border: 0;
          border-radius: 6px;
          padding: 12px 20px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <main>
        <nav class="languages">
          <a href="/feedback?lang=en">English</a>
          <a href="/feedback?lang=fr">Français</a>
        </nav>

        <h1>${content.title}</h1>
        <p>${content.instructions}</p>
        <p><strong>${content.dateLabel}:</strong> ${date}</p>

        <form id="feedbackForm">
          ${questions}
          <button type="submit">${content.submit}</button>
        </form>
      </main>
      <script>
        document.getElementById("feedbackForm")
          .addEventListener("submit", function(event) {
            event.preventDefault();
            alert(${JSON.stringify(
        lang === "fr"
            ? "Merci pour vos commentaires !"
            : "Thank you for your feedback!"
    )});
          });
      </script>
    </body>
    </html>
  `);
});

module.exports = router;
