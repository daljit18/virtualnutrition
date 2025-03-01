
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
  chatCollection = db.collection("chat");
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

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

let chatCollection;

app.post('/chat', async (req, res) => {
    const { chatName,message, chatSessionId, role } = req.body;
    if (!message || !chatSessionId || !role) {
        return res.status(400).json({ message: "Message, chatSessionId, and role are required" });
    }
    try {
        const result = await chatCollection.insertOne({ chatName,message, chatSessionId, role, timestamp: new Date() });
        console.log(`A chat message was inserted with the _id: ${result.insertedId}`);
        res.status(201).json({ message: "Chat message created successfully", messageId: result.insertedId });
    } catch (error) {
        console.error("Error creating chat message:", error);
        res.status(500).json({ message: "Error creating chat message", error: error.message });
    }
});

app.get('/chat/:chatSessionId', async (req, res) => {
    const { chatSessionId } = req.params;
    try {
        const messages = await chatCollection.find({ chatSessionId }).sort({ timestamp: 1 }).toArray();
        if (!messages) {
            return res.status(404).json({ message: "No messages found for this chat session" });
        }
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error getting chat messages:", error);
        res.status(500).json({ message: "Error getting chat messages", error: error.message });
    }
});

app.delete('/chat/:chatSessionId', async (req, res) => {
    const { chatSessionId } = req.params;
    try {
        const result = await chatCollection.deleteMany({ chatSessionId });
        console.log(`${result.deletedCount} chat messages were deleted for session: ${chatSessionId}`);
        res.status(200).json({ message: `Chat messages for session ${chatSessionId} deleted successfully`, deletedCount: result.deletedCount });
    } catch (error) {
        console.error("Error deleting chat messages:", error);
        res.status(500).json({ message: "Error deleting chat messages", error: error.message });
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