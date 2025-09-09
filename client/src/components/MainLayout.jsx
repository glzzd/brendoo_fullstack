import React, { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
 

    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
        }`}>
          <div className="p-6 pb-20">{children}</div>
        </main>
      </div>
      
      <Footer sidebarOpen={sidebarOpen} />
    </div>
  );
};

export default MainLayout;
