import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { translations, Language } from '../lib/translations';

interface LoginProps {
  onLogin: (userId: string, role: string, language: Language) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Language>('english');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const t = translations[language];

  const handleUserLogin = async () => {
    if (!phone || !name) {
      alert('Please fill all fields');
      return;
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    let userId = existingUser?.id;

    if (!existingUser) {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ phone, name, language, role: 'user', is_online: true }])
        .select()
        .single();

      if (error) {
        alert('Error creating user');
        return;
      }
      userId = newUser.id;
    } else {
      await supabase
        .from('users')
        .update({ is_online: true, language, name })
        .eq('id', existingUser.id);
    }

    onLogin(userId, 'user', language);
  };

  const handleManagerLogin = () => {
    if (!phone || !name) {
      alert('Please fill all fields');
      return;
    }
    setShowPasswordModal(true);
  };

  const verifyPassword = async () => {
    const { data: settings } = await supabase
      .from('manager_settings')
      .select('password')
      .single();

    if (settings && password === settings.password) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      let userId = existingUser?.id;

      if (!existingUser) {
        const { data: newUser } = await supabase
          .from('users')
          .insert([{ phone, name, language, role: 'manager', is_online: true }])
          .select()
          .single();
        userId = newUser.id;
      } else {
        await supabase
          .from('users')
          .update({ is_online: true, language, name, role: 'manager' })
          .eq('id', existingUser.id);
      }

      setShowPasswordModal(false);
      onLogin(userId, 'manager', language);
    } else {
      setError(t.wrongPassword);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPassword('');
        setError('');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-4 shadow-lg">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t.appName}</h1>
          <p className="text-gray-600">{t.welcomeMessage}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.phoneNumber}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.fullName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.selectLanguage}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="english">{t.english}</option>
                <option value="malayalam">{t.malayalam}</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleUserLogin}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition shadow-md hover:shadow-lg"
              >
                {t.loginAsUser}
              </button>
              <button
                onClick={handleManagerLogin}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition shadow-md hover:shadow-lg"
              >
                {t.loginAsManager}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t.enterPassword}
            </h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition mb-4"
              placeholder={t.passwordPlaceholder}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setError('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={verifyPassword}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition shadow-md"
              >
                {t.submit}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
