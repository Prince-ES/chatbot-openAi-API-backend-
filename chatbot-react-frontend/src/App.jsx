import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chats } from './Components/Chats';
import './App.css'

function App() {

  const chatSession = JSON.parse(localStorage.getItem('chats')) || localStorage.setItem('chats', JSON.stringify(crypto.randomUUID()));

  const [chatMessages, setChatMessages] = useState(JSON.parse(localStorage.getItem('chatMessages')) || []);

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
    //when clicked send, make a post request to backend ('/api/chat') with message, sender, sessionId and default time will be added in the backend itself.
    if (inputText.trim() === '') return;//if input is empty, do nothing

    let newChatMessages = ([
      ...chatMessages,{
        sessionId:chatSession,
        sender:'user',
        message: inputText
      }
    ])
   

    setChatMessages([
      ...newChatMessages,{
        sessionId:chatSession,
        sender:'chatbot',
        message:'loading...',
      }
    ])
    console.log(inputText);
    const chatbotResponse = await axios.post('http://localhost:5000/api/chat',{
      sessionId: chatSession,
      message: inputText,
    });

    const responseData = chatbotResponse.data;

    setChatMessages([
      ...newChatMessages,{
        sessionId: responseData.sessionId,
        sender: 'chatbot',
        message:responseData.reply
      }
    ])

    localStorage.setItem('chatMessages', JSON.stringify([
      ...newChatMessages,{
      sessionId: responseData.sessionId,
      sender:'chatbot',
      message:responseData.reply
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
      setInputText('');
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
