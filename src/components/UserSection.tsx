import { useState, useEffect } from 'react';
import { ShoppingCart, LogOut, Receipt } from 'lucide-react';
import { supabase, Product, CartItem, Bill } from '../lib/supabase';
import { translations, Language } from '../lib/translations';

interface UserSectionProps {
  userId: string;
  userName: string;
  language: Language;
  onLogout: () => void;
}

export default function UserSection({ userId, userName, language, onLogout }: UserSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [showBills, setShowBills] = useState(false);

  const t = translations[language];

  const categories = [
    'all',
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

  useEffect(() => {
    fetchProducts();
    fetchCart();
    fetchBills();

    const billsSubscription = supabase
      .channel('bills_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${userId}` }, () => {
        fetchBills();
      })
      .subscribe();

    return () => {
      billsSubscription.unsubscribe();
    };
  }, [userId]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('available', true)
      .order('category');
    if (data) setProducts(data);
  };

  const fetchCart = async () => {
    const { data } = await supabase
      .from('carts')
      .select('*, products(*)')
      .eq('user_id', userId);
    if (data) setCart(data);
  };

  const fetchBills = async () => {
    const { data } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setBills(data);
  };

  const addToCart = async (productId: string) => {
    const existingItem = cart.find((item) => item.product_id === productId);

    if (existingItem) {
      await supabase
        .from('carts')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);
    } else {
      await supabase
        .from('carts')
        .insert([{ user_id: userId, product_id: productId, quantity: 1 }]);
    }
    fetchCart();
  };

  const removeFromCart = async (cartId: string) => {
    await supabase.from('carts').delete().eq('id', cartId);
    fetchCart();
  };

  const updateQuantity = async (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
    } else {
      await supabase.from('carts').update({ quantity }).eq('id', cartId);
      fetchCart();
    }
  };

  const handleLogout = async () => {
    await supabase.from('users').update({ is_online: false }).eq('id', userId);
    onLogout();
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => {
    return sum + (item.products?.mrp || 0) * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t.appName}</h1>
              <p className="text-sm text-gray-600">{userName}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBills(true)}
                className="relative px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                <Receipt className="w-5 h-5" />
                {bills.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {bills.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="relative px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t.categories}</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t[category as keyof typeof t] || category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
            >
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-lg mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {t[product.category as keyof typeof t] || product.category}
                </p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-green-600">
                    ₹{product.mrp}
                  </span>
                  <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? t.inStock : t.outOfStock}
                  </span>
                </div>
                {product.offer_text && (
                  <p className="text-sm text-orange-600 mb-3">{product.offer_text}</p>
                )}
                <button
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock === 0}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-2 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.addToCart}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{t.myCart}</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t.emptyCart}</p>
              ) : (
                <>
                  {cart.map((item) => (
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
                        <p className="text-green-600 font-medium">
                          ₹{item.products?.mrp}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        {t.removeFromCart}
                      </button>
                    </div>
                  ))}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>{t.total}:</span>
                      <span className="text-green-600">₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showBills && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{t.myBills}</h2>
                <button
                  onClick={() => setShowBills(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              {bills.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t.noBills}</p>
              ) : (
                <div className="space-y-4">
                  {bills.map((bill) => (
                    <div
                      key={bill.id}
                      className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {t.billNumber}{bill.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(bill.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                          ₹{bill.total_amount}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {bill.items.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
