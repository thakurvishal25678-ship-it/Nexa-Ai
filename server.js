import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash"
});


// ========================================
// STREAMING CHAT
// ========================================

app.post("/chat", async (req, res) => {

    try {

        const message = req.body.message;

        if (!message || !message.trim()) {
            return res.status(400).send("Please enter a message.");
        }


        const prompt = `
You are Nexa AI, a helpful and friendly AI assistant.

Rules:
- Reply in the same language as the user.
- If the user uses Hinglish, reply in simple Hinglish.
- If the user uses Hindi, reply in Hindi.
- If the user uses English, reply in English.
- Keep normal answers clear and reasonably concise.
- Give detailed answers when the user asks for detail.
- Use headings and bullet points when useful.

User:
${message}
`;


        // Streaming response
       const result =
    await model.generateContentStream(prompt);

res.setHeader(
    "Content-Type",
    "text/plain; charset=utf-8"
);

res.setHeader(
    "Cache-Control",
    "no-cache"
);

res.setHeader(
    "Connection",
    "keep-alive"
);

for await (const chunk of result.stream) {

    const text = chunk.text();

    if (text) {
        res.write(text);
    }
}

res.end();


    } catch (error) {

        console.error(
            "Gemini Streaming Error:",
            error.message
        );


        if (!res.headersSent) {

            res.status(500).send(
                "Sorry, AI response nahi de pa raha."
            );

        } else {

            res.end();

        }

    }

});


// ========================================
// SERVER
// ========================================

app.listen(3000, () => {

    console.log(
        "✅ Nexa AI Streaming Server running on http://localhost:3000"
    );

});