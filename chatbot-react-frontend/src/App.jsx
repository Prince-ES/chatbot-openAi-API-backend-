import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chats } from './Components/Chats';
import './App.css'

function App() {
  //one request was to get all the session and one to get the currect session(since we're generating id from backend.) we'll load all session once and run useState function only when a new session is created.

  const [chatSessionId,setChatSessionId] = useState(localStorage.getItem('activeSession'));
  console.log(chatSessionId);

  const [sessions,setSessions] = useState([]);
  console.log(sessions);
  useEffect(()=>{//getting all the sessions whenever sessions change.
    async function getAllSessions(){
       await axios.get('http://localhost:5000/api/sessions')
        .then((res)=>{
          setSessions(res.data);
        })
    }
    getAllSessions();
  },[]);
  
    useEffect(()=>{
      if(!chatSessionId){
      async function newSession(){
        const newChatSessionId = await  axios.post('http://localhost:5000/api/sessions',{});//creating a new session Id from backend;
        localStorage.setItem('activeSession',newChatSessionId.data.sessionId);
        setSessions(prev => [...prev,{sessionId:newChatSessionId.data.sessionId, title:newChatSessionId.data.title}])
        setChatSessionId(newChatSessionId.data.sessionId);
        console.log('sessionCreated')
      }
      newSession();

   }

    },[chatSessionId]);
  

  const [chatMessages, setChatMessages] = useState([]);

  useEffect(()=>{
    if (!chatSessionId) return;
    axios.get(`http://localhost:5000/api/chats/${chatSessionId}/messages`)
      .then((res)=>{
        setChatMessages(res.data);
      })
      .catch(err => console.error("failed to load chat history:", err));
  },[chatSessionId])

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
        sessionId:chatSessionId,
        sender:'user',
        message: inputText
      }
    ])
   

    setChatMessages([
      ...newChatMessages,{
        sessionId:chatSessionId,
        sender:'chatbot',
        message:'loading...',
      }
    ])

    const chatbotResponse = await axios.post(`http://localhost:5000/api/chats/${chatSessionId}/messages`,{
      sessionId: chatSessionId,
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
  }

  function startNewChat(){
    localStorage.removeItem('activeSession');
    setChatMessages([]);
    setChatSessionId(null);
  }

  function enterWorking(event) {
    if (event.key === 'Enter') {
      sendMessage();
      setInputText('');
    }
  } 

  function getParticularSession(sessionId){
    localStorage.setItem('activeSession',sessionId);
    console.log('got particular session:',sessionId);
    setChatSessionId(sessionId);

  }

  async function deleteParticularSession(sessionId){
    //deletng approach: if we delete a previous session then it'll just delete but if we dete current session, there are two cases:
    //case 1: no sessions left: In this case we're creating a new chat session and shifting user there.
    //case 2: more sessions exist: in this case we switch user to previous session.
    
    if(chatSessionId != sessionId){
      const res = await axios.delete(`http://localhost:5000/api/sessions/${sessionId}`,{});//this is to delete the session from backend 
      console.log(res.data.message);
      setSessions(prev=> prev.filter(s => s.sessionId !== sessionId));

    }else{
      const remainingSessions = sessions.filter((s)=>{
        return s.sessionId != sessionId;
      })
      const previousSession = remainingSessions[remainingSessions.length-1];

      if (remainingSessions.length > 0) {
        setChatSessionId(previousSession.sessionId);
        localStorage.setItem('activeSession', previousSession.sessionId);
      } else {
        setChatSessionId(null);
      }     

      setSessions(prev=> prev.filter(s => s.sessionId !== sessionId));
      
      const res = await axios.delete(`http://localhost:5000/api/sessions/${sessionId}`,{});//this is to delete the session from backend 
      console.log(res.data.message);    
    }
    //when current session is deleted, the chat messages are cleared, session is cleared from sidebar but the session id is still in localStorage somehow.
  }
  return (
    <>
      <div className="app">
        <label htmlFor="sidebar" className='problem'>
          <i className='fas fa-hamburger'></i>
        </label>
        <input type="checkbox" id="sidebar"/>
        <nav>
          <div className="top">
            <strong>Actions:-</strong>
            <label htmlFor='sidebar'>
              <div><i className='fas fa-times'></i></div>
            </label>          
          </div>
          <div className="bottom">
            <div className='all-actions'>

              <div className="start-new-chat">
                <i className='fas fa-plus'></i>
                <div className='new-chat' onClick={startNewChat}>New Chat</div>
              </div>
              
            </div>
            <div className="previous-chats">
              <h3 className="previous-chats-title">Previous Chats:-</h3>
              <ol>
                {[...sessions].reverse().map((session)=>{
                  const isActive = chatSessionId === session.sessionId;
                  return <li className={`session ${isActive? 'highlight-session' : ''}`} key={session.sessionId} onClick={()=>{
                    getParticularSession(session.sessionId)
                  }}>{session.title} <span className='delete-particular-session' onClick={(e)=>{
                    e.stopPropagation();
                    deleteParticularSession(session.sessionId);
                  }}>Delete</span></li>
                })}
              </ol>
            </div>
          </div>
        </nav>
        <header className="title-header"  >
            <h1 style={{ display:'inline'}} >chatbot <span style={{fontSize:'11px'}}>personalty no. 1</span></h1>
          </header>
        <div className="chat-container" ref= {chatMessagesRef}>          
          <Chats chatMessages={chatMessages} />
        </div>
        <div className="input-container">
          <div className="input-box">
            <input type="text" placeholder="Type a message..." onChange={controlledInput} value={inputText} onKeyDown={enterWorking} />
            <button onClick={()=>{
              sendMessage();
              setInputText('');
            }}>
              <i className='fas fa-arrow-up'></i>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
//current behaviour: you can switch between different sessions and delete a session. on clicking delete, a new session will be created on the spot and u'll be switched to it. 
//clicking on title will shift you to new session without deleting the current. 
//new sessions are at top and title is newChat+ time
