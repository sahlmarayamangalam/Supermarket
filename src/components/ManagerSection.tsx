import { useState, useEffect } from 'react';
import { LogOut, Plus, Edit2, Trash2, Users, ShoppingCart, Receipt, Key } from 'lucide-react';
import { supabase, Product, User, CartItem } from '../lib/supabase';
import { translations, Language } from '../lib/translations';

interface ManagerSectionProps {
  userId: string;
  userName: string;
  language: Language;
  onLogout: () => void;
}

export default function ManagerSection({ userId, userName, language, onLogout }: ManagerSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [userCarts, setUserCarts] = useState<{ [key: string]: CartItem[] }>({});
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'password'>('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const t = translations[language];

  const [productForm, setProductForm] = useState({
    name: '',
    category: 'vegetables',
    mrp: 0,
    image_url: '',
    stock: 0,
    offer_text: '',
    available: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchOnlineUsers();
    fetchAllUserCarts();

    const usersSubscription = supabase
      .channel('users_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchOnlineUsers();
      })
      .subscribe();

    const cartsSubscription = supabase
      .channel('carts_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carts' }, () => {
        fetchAllUserCarts();
      })
      .subscribe();

    return () => {
      usersSubscription.unsubscribe();
      cartsSubscription.unsubscribe();
    };
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('category');
    if (data) setProducts(data);
  };

  const fetchOnlineUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('is_online', true)
      .eq('role', 'user');
    if (data) setOnlineUsers(data);
  };

  const fetchAllUserCarts = async () => {
    const { data } = await supabase
      .from('carts')
      .select('*, products(*)')
      .order('created_at', { ascending: false });

    if (data) {
      const cartsByUser: { [key: string]: CartItem[] } = {};
      data.forEach((item) => {
        if (!cartsByUser[item.user_id]) {
          cartsByUser[item.user_id] = [];
        }
        cartsByUser[item.user_id].push(item);
      });
      setUserCarts(cartsByUser);
    }
  };

  const handleLogout = async () => {
    await supabase.from('users').update({ is_online: false }).eq('id', userId);
    onLogout();
  };

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        mrp: product.mrp,
        image_url: product.image_url,
        stock: product.stock,
        offer_text: product.offer_text,
        available: product.available,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: 'vegetables',
        mrp: 0,
        image_url: '',
        stock: 0,
        offer_text: '',
        available: true,
      });
    }
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    if (editingProduct) {
      await supabase
        .from('products')
        .update({ ...productForm, updated_at: new Date().toISOString() })
        .eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([productForm]);
    }
    setShowProductModal(false);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  const createBill = async (user: User) => {
    const cart = userCarts[user.id] || [];
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const items = cart.map((item) => ({
      name: item.products?.name,
      price: item.products?.mrp,
      quantity: item.quantity,
    }));

    const total = cart.reduce((sum, item) => {
      return sum + (item.products?.mrp || 0) * item.quantity;
    }, 0);

    await supabase.from('bills').insert([{
      user_id: user.id,
      manager_id: userId,
      items,
      total_amount: total,
      status: 'sent',
    }]);

    await supabase.from('carts').delete().eq('user_id', user.id);

    fetchAllUserCarts();
    setShowBillModal(false);
    setSelectedUser(null);
    alert(t.billSent);
  };

  const changePassword = async () => {
    if (!newPassword) {
      alert('Please enter a new password');
      return;
    }

    const { data: settings } = await supabase
      .from('manager_settings')
      .select('id')
      .single();

    if (settings) {
      await supabase
        .from('manager_settings')
        .update({ password: newPassword, updated_at: new Date().toISOString() })
        .eq('id', settings.id);

      alert('Password changed successfully');
      setNewPassword('');
    }
  };

  const categories = [
    'vegetables',
    'masalapowders',
    'oils',
    'biscuits',
    'snacks',
    'chocolates',
    'icecream',
    'phones',
    'biglaptops',
    'smalllaptops',
    'tabs',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <header className="bg-gradient-to-r from-green-600 to-blue-600 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">{t.managerSection}</h1>
              <p className="text-sm text-green-100">{userName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition flex items-center gap-2 font-medium"
            >
              <LogOut className="w-5 h-5" />
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {t.productManagement}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            {t.onlineUsers} ({onlineUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'password'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Key className="w-5 h-5" />
            {t.changePassword}
          </button>
        </div>

        {activeTab === 'products' && (
          <>
            <div className="mb-6">
              <button
                onClick={() => openProductModal()}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition shadow-md flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t.addProduct}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {product.name}
                  </h3>
                  <div className="space-y-1 text-sm mb-4">
                    <p className="text-gray-600">
                      {t.category}: {t[product.category as keyof typeof t] || product.category}
                    </p>
                    <p className="text-green-600 font-semibold text-lg">
                      {t.mrp}: ₹{product.mrp}
                    </p>
                    <p className="text-gray-600">
                      {t.stock}: {product.stock}
                    </p>
                    <p className={`font-medium ${product.available ? 'text-green-600' : 'text-red-600'}`}>
                      {product.available ? t.available : 'Unavailable'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openProductModal(product)}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t.editProduct}
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {onlineUsers.map((user) => {
              const cart = userCarts[user.id] || [];
              const total = cart.reduce((sum, item) => {
                return sum + (item.products?.mrp || 0) * item.quantity;
              }, 0);

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">{user.name}</h3>
                      <p className="text-gray-600">{user.phone}</p>
                      <p className="text-sm text-gray-500">
                        {t[user.language as keyof typeof t]}
                      </p>
                    </div>
                    {cart.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowBillModal(true);
                        }}
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition flex items-center gap-2 shadow-md"
                      >
                        <Receipt className="w-5 h-5" />
                        {t.createBill}
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <p className="text-gray-500">{t.emptyCart}</p>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.products?.image_url}
                                alt={item.products?.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium text-gray-800">
                                  {item.products?.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {t.quantity}: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-green-600">
                              ₹{((item.products?.mrp || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center text-xl font-bold">
                          <span>{t.total}:</span>
                          <span className="text-green-600">₹{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {onlineUsers.length === 0 && (
              <p className="text-center text-gray-500 py-12">
                No online users
              </p>
            )}
          </div>
        )}

        {activeTab === 'password' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {t.changePassword}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.newPassword}
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder={t.newPassword}
                  />
                </div>
                <button
                  onClick={changePassword}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition shadow-md"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingProduct ? t.editProduct : t.addProduct}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.productName}
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.category}
                </label>
                <select
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm({ ...productForm, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {t[cat as keyof typeof t] || cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.mrp}
                  </label>
                  <input
                    type="number"
                    value={productForm.mrp}
                    onChange={(e) =>
                      setProductForm({ ...productForm, mrp: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.stock}
                  </label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.imageUrl}
                </label>
                <input
                  type="text"
                  value={productForm.image_url}
                  onChange={(e) =>
                    setProductForm({ ...productForm, image_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.offerText}
                </label>
                <input
                  type="text"
                  value={productForm.offer_text}
                  onChange={(e) =>
                    setProductForm({ ...productForm, offer_text: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={productForm.available}
                  onChange={(e) =>
                    setProductForm({ ...productForm, available: e.target.checked })
                  }
                  className="w-5 h-5"
                />
                <label className="text-sm font-medium text-gray-700">
                  {t.available}
                </label>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowProductModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={saveProduct}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition shadow-md"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBillModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {t.createBill} - {selectedUser.name}
              </h2>
            </div>
            <div className="p-6">
              {(userCarts[selectedUser.id] || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 mb-4 pb-4 border-b"
                >
                  <img
                    src={item.products?.image_url}
                    alt={item.products?.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {item.products?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t.quantity}: {item.quantity}
                    </p>
                    <p className="text-green-600 font-medium">
                      ₹{item.products?.mrp} × {item.quantity} = ₹
                      {((item.products?.mrp || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center text-2xl font-bold mb-6">
                  <span>{t.total}:</span>
                  <span className="text-green-600">
                    ₹
                    {(userCarts[selectedUser.id] || [])
                      .reduce((sum, item) => {
                        return sum + (item.products?.mrp || 0) * item.quantity;
                      }, 0)
                      .toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowBillModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => createBill(selectedUser)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition shadow-md"
                  >
                    {t.sendBill}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
