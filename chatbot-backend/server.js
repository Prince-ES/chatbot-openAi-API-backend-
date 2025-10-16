import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';//its a small libarry that allow us to get anvironment variables from .env file to process.env;
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


dotenv.config();//it will read the .env file and set the variables in process.env

const app = express();
app.use(cors());
app.use(express.json());//it is a middleware that allows us to parse jsaon data in the request body


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let conversationHistory=[];//to store previous messages

app.get('/', (req, res) => {
  const imagePath = path.join(__dirname, 'silver-surfer.jpg');
const image =fs.readFileSync(imagePath);
  res.contentType('image/jpeg');
  res.send(image);

});

app.listen(5000, () => { 
    console.log('server running on port 5000');
});

app.post("/api/chat", async(req,res)=>{
  const {message} = req.body;

  try{
    const completion = await openai.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[
        {role:"system", content: "You are a friendly chatbot that answers questions and always use the user's message to generate context-aware replies."},
        ...conversationHistory,//previous message stored in memory
        {role: "user", content: message},
      ],
    });

    //extract reply:-
    const reply = completion.choices[0].message.content;

    res.json({reply});
  }catch(error){
    console.error("Error Calling OpenAI API:", error);
    res.status(500).json({error: "Sorry, there was an error generationg a response."});
  }
});

app.listen(5000,()=>{
  console.log('Server is running on port 5000');
})