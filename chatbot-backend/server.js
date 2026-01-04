import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';//its a small libarry that allow us to get anvironment variables from .env file to process.env;
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { time } from 'console';
import crypto from 'crypto';


dotenv.config();//it will read the .env file and set the variables in process.env

const app = express();
app.use(cors());
app.use(express.json());//it is a middleware that allows us to parse jsaon data in the request body

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("connnected to mongoDb");

  }).catch(err => console.error("❌ MongoDB connection error:", err));

const openai = new OpenAI({// initializing openai instance
  apiKey: process.env.OPENAI_API_KEY,
})

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()//generating unique session id if not provided
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'chatbot'],// only these two values are allowed
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
})

const sessionSchema = new mongoose.Schema({
  sessionId:{
    type: String,
    required: true
  },
  title:{
    type: String,
    required: true,
  }
})

const sessionModel = mongoose.model('session',sessionSchema);



const ChatModel = mongoose.model('chat', chatSchema);

let conversationHistory = [];//to store previous messages

app.post("/api/chats/:sessionId/messages", async (req, res) => {
  const { message, sessionId } = req.body;

  try {
    //save user messate first:-
    const userChat = new ChatModel({
      sessionId: sessionId,
      sender: 'user',
      message: message
    })

    await userChat.save();

    //get conversation history from DB
    const history = await ChatModel.find({ sessionId: userChat.sessionId })
      .sort({timestamp:-1})//getting latest messages first
      .limit(10);//get the last 20 messages


      const formattedHistory = history.reverse().map(chat=>({//in formatted history we're making it familiar to what kind of format of request we can send to openai api. so when this /api/chat endpoint runs, openai APi is told to be helpful assistant and then all the formatted history is transferred with new message so it gets the whole context and replies accordingly.
          role:chat.sender === 'user' ? 'user' : 'assistant',
          content:chat.message
        }
      ))

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "you've to match users vibe. And reply based on user input."},
        ...formattedHistory,
      ],
    });

    //extract reply:-
    const reply = completion.choices[0].message.content;

    //save ai response:-
    const chatbotChat = new ChatModel({
      sessionId: userChat.sessionId,
      sender: 'chatbot',
      message: reply
    });

    await chatbotChat.save();

    res.json({ reply, sessionId: userChat.sessionId,messageId:chatbotChat._id });

  } catch (error) {
    console.error("Error Calling OpenAI API:", error);
    res.status(500).json({ error: "Sorry, there was an error generationg a response." });
  }
});

app.get('/api/chats/:sessionId/messages', async (req, res) => {
  const chats = await ChatModel.find({sessionId:req.params.sessionId}).sort({timeStamp:1});

  res.json(chats);
})

app.post('/api/sessions',async (req,res)=>{
  const newSessionId = crypto.randomUUID();
  const sessionId = newSessionId;
  const title = `New Chat ${Date.now()}`;
  try{
    const session = new sessionModel({
      sessionId,
      title
    })
    await session.save();
  }catch(err){
    console.log('Error calling backend to post session', err);
    res.status(500).json({err: "sorry there was error, saving session"});
  }
  res.json({
    sessionId,
    title
  });  
})

app.get('/api/sessions',async(req,res)=>{
    const allSession = await sessionModel.find({});
    res.json(allSession);
})

app.listen(5000, () => {
  console.log('Server is running on port 5000');
})