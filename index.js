// Suggested code may be subject to a license. Learn more: ~LicenseLog:2843500856.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:2164146886.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:2030587553.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:1389594454.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:2889326863.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:572460612.
import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();

const app = express();
app.use(express.json());

const mongoUri = process.env.MONGO_URI;

const client = new MongoClient(mongoUri);

let usersCollection;

async function run() {
  await client.connect();
  console.log('Connected successfully to MongoDB server');
  const db = client.db('virtual-nutritionist-app');
  usersCollection = db.collection("users");
}
run().catch(console.dir);

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await usersCollection.insertOne({ name, email, password: hashedPassword });
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
    res.status(201).json({ message: "User created successfully", userId: result.insertedId });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
});

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

const port = parseInt(process.env.PORT || "3000");
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});