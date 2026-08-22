const Groq = require("groq-sdk");
const dotenv = require("dotenv");
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  console.log("Fetching Groq models list...");
  try {
    const list = await groq.models.list();
    console.log("Available models:");
    list.data.forEach(m => console.log(`- ${m.id}`));
  } catch (err) {
    console.error("Groq Error:", err.message);
  }
}

main();
