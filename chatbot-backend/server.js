import express from 'express';
import cors from 'cors';



const app = express();                            

app.get('/',(req,res)=>{
  res.send('Hello World');
})

app.get('/api/chats',(req,res)=>{
  
})

app.listen(3000,()=>{  
  console.log('Server is running on port 3000');
})