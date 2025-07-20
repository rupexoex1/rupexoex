import { Outlet } from 'react-router-dom';
import BottomBar from '../components/BottomBar.jsx';
import ChatBot from '../components/chatbot/ChatBot.jsx';

export default function Layout() {
  return (
    <div className="bg-gray-700 min-h-screen flex justify-center">
      <div className="relative w-[425px] min-h-screen bg-primary shadow-md">
        <div className="pb-16"> {/* Prevent bottom bar overlap */}
          <Outlet />
        </div>
        <ChatBot/>
        <BottomBar />
      </div>
    </div>
  );
}
