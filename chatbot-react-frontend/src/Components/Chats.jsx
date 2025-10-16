
export function Chats({chatMessages}) {

  return (
    <div className="chats">
      {chatMessages.map((chatMessage, index) => {
        return <div className={`chat-message-${chatMessage.sender}`} key={index}>
          <div className={`${chatMessage.sender}-chat`}>
            <div className={`${chatMessage.sender}-pfp`}>
              <img src={`/images/${chatMessage.sender}.jpg`} alt="" />
            </div>
            <div className={`${chatMessage.sender}-message`}>
              {chatMessage.message}
            </div>
          </div>
        </div>
      })}

      {/* <div className="chat-message-chatbot">
        <div className="chatbot-chat">
          <div className="chatbot-pfp">
            <img src="images/robot.jpg" alt="" />
          </div>
          <div className="chatbot-message">
            Hello! How's going? hwo ae yu how are you are you
          </div>
        </div>
      </div> */}
    </div>
  )
}