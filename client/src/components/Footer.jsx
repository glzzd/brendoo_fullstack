import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const Footer = ({ sidebarOpen }) => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`bg-white mt-auto transition-all duration-300 lg:fixed lg:bottom-0 ${
        sidebarOpen ? 'lg:left-64 lg:w-[calc(100%-16rem)]' : 'lg:left-0 lg:w-full'
      }`}
    >
      <div className="max-w-7xl mx-auto  py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 ">
          <div className="flex w-full items-center justify-between ">
            <div className="flex items-center ">
              <img src="/metora.png" alt="Logo" className="h-6 w-auto" />
            </div>
            <div className="text-sm text-gray-500">
              © {currentYear}{" "}
              {t("allRightsReserved")} 
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
