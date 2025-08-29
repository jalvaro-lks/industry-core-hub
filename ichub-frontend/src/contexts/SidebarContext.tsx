import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isVisible: boolean;
  content: ReactNode | null;
  showSidebar: (content: ReactNode) => void;
  hideSidebar: () => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);

  const showSidebar = (content: ReactNode) => {
    setContent(content);
    setIsVisible(true);
  };

  const hideSidebar = () => {
    setIsVisible(false);
    setContent(null);
  };

  const toggleSidebar = () => {
    setIsVisible(!isVisible);
  };

  return (
    <SidebarContext.Provider value={{
      isVisible,
      content,
      showSidebar,
      hideSidebar,
      toggleSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
