import React, { createContext, useContext, useState, ReactNode } from 'react';

interface IssueAuthContextType {
  canManageIssues: boolean;
  canApproveIssues: boolean;
  canAssignIssues: boolean;
}

const IssueAuthContext = createContext<IssueAuthContextType | undefined>(undefined);

export const useIssueAuth = () => {
  const context = useContext(IssueAuthContext);
  if (context === undefined) {
    throw new Error('useIssueAuth must be used within an IssueAuthProvider');
  }
  return context;
};

interface IssueAuthProviderProps {
  children: ReactNode;
}

export const IssueAuthProvider: React.FC<IssueAuthProviderProps> = ({ children }) => {
  // Simple mock implementation - in a real app, this would be based on user roles
  const [permissions] = useState({
    canManageIssues: true,
    canApproveIssues: true,
    canAssignIssues: true,
  });

  return (
    <IssueAuthContext.Provider value={permissions}>
      {children}
    </IssueAuthContext.Provider>
  );
}; 