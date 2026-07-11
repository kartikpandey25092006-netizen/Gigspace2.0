import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PlusCircle, Search, DollarSign, ArrowRight, Tag, Star, Activity, BookOpen, Layers } from 'lucide-react';
import type { IGig, IRental, ICategory } from '../../../Shared/src/types';

export const Browse: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'gig' | 'rental'>('gig');
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states for listing creation
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Load categories and initial feed
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'gig' ? '/gigs' : '/rentals';
      const params = {
        search: search || undefined,
        category: selectedCategory || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        status: tab === 'gig' ? 'open' : 'available'
      };
      const res = await api.get(endpoint, { params });
      setListings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [tab, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeed();
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription || !newPrice || !newCategory) return;

    try {
      if (tab === 'gig') {
        await api.post('/gigs', {
          title: newTitle,
          description: newDescription,
          price: Number(newPrice),
          category: newCategory
        });
      } else {
        await api.post('/rentals', {
          title: newTitle,
          description: newDescription,
          pricePerDay: Number(newPrice),
          category: newCategory
        });
      }

      // Reset
      setShowModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewPrice('');
      setNewCategory('');
      fetchFeed();
    } catch (err) {
      console.error(err);
      alert('Failed to post item/gig');
    }
  };

  const activeCategories = categories.filter((c) => c.type === tab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Campus Marketplace</h1>
          <p className="text-slate-400 mt-1">Hire peers for student gigs or rent textbook calculators and campus items.</p>
        </div>
        <button
          onClick={() => {
            if (activeCategories.length > 0) {
              setNewCategory(activeCategories[0].name);
            }
            setShowModal(true);
          }}
          className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/20 transition"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {tab === 'gig' ? 'Post a Gig' : 'List a Rental'}
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => {
            setTab('gig');
            setSelectedCategory('');
          }}
          className={`py-4 px-6 text-sm font-semibold border-b-2 transition ${
            tab === 'gig' ? 'border-blue-400 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Gigs (Task Services)
          </div>
        </button>
        <button
          onClick={() => {
            setTab('rental');
            setSelectedCategory('');
          }}
          className={`py-4 px-6 text-sm font-semibold border-b-2 transition ${
            tab === 'rental' ? 'border-blue-400 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            Rentals (Gear & Books)
          </div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-xl mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={`Search ${tab}s by keyword (e.g. tutoring, calculator)...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-24 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <span className="text-slate-600">-</span>
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Apply Filters
          </button>
        </form>

        {/* Categories horizontally */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800/50">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center transition ${
              selectedCategory === '' ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1" />
            All Categories
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center transition ${
                selectedCategory === cat.name ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5 mr-1" />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Listings */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 font-medium">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-slate-500 glass-panel rounded-xl">
          <p className="text-lg">No active {tab}s found matching filters.</p>
          <p className="text-sm text-slate-600 mt-2">Try posting a new one or adjusting search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const owner = tab === 'gig' ? item.posterId : item.ownerId;
            const priceLabel = tab === 'gig' ? `$${item.price}` : `$${item.pricePerDay}/day`;

            return (
              <div
                key={item._id}
                onClick={() => navigate(tab === 'gig' ? `/gig/${item._id}` : `/rental/${item._id}`)}
                className="glass-panel p-6 rounded-xl hover:translate-y-[-4px] hover:border-slate-700 cursor-pointer transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-900/40 border border-blue-500/20 text-blue-400">
                      {item.category}
                    </span>
                    <span className="text-lg font-bold text-blue-400">{priceLabel}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-3 truncate">{item.title}</h3>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-3">{item.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Listed by</span>
                    <span className="text-xs font-semibold text-slate-300">{owner?.name || 'Student'}</span>
                    {owner?.ratingAvg > 0 && (
                      <span className="text-[10px] text-yellow-500 flex items-center mt-0.5">
                        <Star className="w-3 h-3 fill-yellow-500 stroke-yellow-500 mr-1" />
                        {owner.ratingAvg} ({owner.ratingCount})
                      </span>
                    )}
                  </div>
                  <button className="flex items-center text-xs font-semibold text-blue-400 hover:text-blue-300 transition">
                    View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 relative">
            <h2 className="text-xl font-bold text-white mb-4">
              {tab === 'gig' ? 'Post a New Campus Gig' : 'List a Rental Item'}
            </h2>
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label htmlFor="modal-title" className="block text-xs font-semibold text-slate-400 uppercase">Title</label>
                <input
                  id="modal-title"
                  type="text"
                  required
                  placeholder="e.g. Calculator helper, textbook, tutoring"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="modal-desc" className="block text-xs font-semibold text-slate-400 uppercase">Description</label>
                <textarea
                  id="modal-desc"
                  required
                  rows={3}
                  placeholder="Details, dates, instructions..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-price" className="block text-xs font-semibold text-slate-400 uppercase">
                    {tab === 'gig' ? 'Price ($)' : 'Price per Day ($)'}
                  </label>
                  <input
                    id="modal-price"
                    type="number"
                    required
                    min={0}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="modal-cat" className="block text-xs font-semibold text-slate-400 uppercase">Category</label>
                  <select
                    id="modal-cat"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {activeCategories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
                >
                  Post Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
