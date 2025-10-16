import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chats } from './Components/Chats';
import './App.css'

function App() {

  const [chatMessages, setChatMessages] = useState(JSON.parse(localStorage.getItem('chatMessages')) || [
    {
      sender: "user",
      message: "Hello!"
    },
    {
      sender: "chatbot",
      message: "Hello! How's going?"
    },
    {
      sender: "user",
      message: "Flip a coin."
    },
    {
      sender: "chatbot",
      message: `sure, you got a ${Math.random() > 0.5 ? 'heads' : 'tails'}`
    }
  ]);

  const chatMessagesRef = useRef(null);

  useEffect(()=>{
    const chatMessageElem = chatMessagesRef.current;
    if(chatMessageElem){
      chatMessageElem.scrollTop = chatMessageElem.scrollHeight;
    }

  },[chatMessages])

  let [inputText, setInputText] = useState('');

  function controlledInput(event) {
    setInputText(event.target.value);
  }

  async function sendMessage() {
     const newChatMessages= ([
      ...chatMessages,{
        sender:"user",
        message:inputText
      }
     ]);

    setChatMessages(newChatMessages);
    setInputText('');

    setChatMessages([
      ...newChatMessages,{
        sender:'chatbot',
        message:'loading...'
      }]
    )

    const chatbotResponse = await axios.post('http://localhost:5000/api/chat',{
      message:inputText     
    })

    setChatMessages([
      ...newChatMessages,{
        sender:"chatbot", message:chatbotResponse.data.reply
      }
    ])

    localStorage.setItem('chatMessages', JSON.stringify([
      ...newChatMessages,{
        sender:"chatbot", message:chatbotResponse.data.reply
      }
    ]))

  }

  function resetChats(){
    localStorage.removeItem('chatMessages');
    setChatMessages([]);
  }

  function enterWorking(event) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  }
  return (
    <>
      <div className="app">
        <header className="title-header" onClick={resetChats}>
            <h1>Chatbot 2.0</h1>
          </header>
        <div className="chat-container" ref= {chatMessagesRef}>          
          <Chats chatMessages={chatMessages} />
        </div>
        <div className="input-container">
          <div className="input-box">
            <input type="text" placeholder="Type a message..." onChange={controlledInput} value={inputText} onKeyDown={enterWorking} />
            <button onClick={sendMessage}>
              <i className='fas fa-arrow-up'></i>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
