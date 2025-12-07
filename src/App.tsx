import { useState } from 'react';
import Login from './components/Login';
import UserSection from './components/UserSection';
import ManagerSection from './components/ManagerSection';
import { Language } from './lib/translations';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [language, setLanguage] = useState<Language>('english');

  const handleLogin = (id: string, role: string, lang: Language) => {
    setUserId(id);
    setUserRole(role);
    setLanguage(lang);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId('');
    setUserName('');
    setUserRole('');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (userRole === 'manager') {
    return (
      <ManagerSection
        userId={userId}
        userName={userName}
        language={language}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <UserSection
      userId={userId}
      userName={userName}
      language={language}
      onLogout={handleLogout}
    />
  );
}

export default App;
