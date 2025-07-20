import { useState } from 'react'
import './ChatBot.css'

import ChatbotIcon from './ChatbotIcon'
import ChatForm from './ChatForm'
import ChatMessage from './ChatMessage'

const ChatBot = () => {

  const [chatHistory, setChatHistory] = useState([]);
  const generateBotResponse = (history) => {
    console.log(history)
  }

  return (
    <div className='container'>
      <div className="chatbot-popup">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="header-info">
            <ChatbotIcon />
            <h2 className="logo-text">Chatbot</h2>
          </div>
          <button className="material-symbols-rounded">
            keyboard_arrow_down
          </button>
        </div>
        {/* Chat Body */}
        <div className="chat-body">
          <div className="message bot-message">
            <ChatbotIcon />
            <p className='message-text'>
              Hey there 👋 <br />
              How can I help you today?
            </p>
          </div>

          {/* Render the chat history dynamically */}
          {chatHistory.map((chat, index) => (
            <ChatMessage key={index} chat={chat} />
          ))}

        </div>
        {/* Chatbot Footer */}
        <div className="chat-footer">
          <ChatForm chatHistory={chatHistory} setChatHistory={setChatHistory} generateBotResponse={generateBotResponse} />
        </div>
      </div>
    </div>
  )
}

export default ChatBot