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
  const [rentalBrand, setRentalBrand] = useState('');
  const [rentalModel, setRentalModel] = useState('');
  const [rentalCondition, setRentalCondition] = useState<'new' | 'good' | 'fair' | 'worn'>('good');
  const [rentalAccessories, setRentalAccessories] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [gigLocationDetails, setGigLocationDetails] = useState('');
  const [gigRequirementNotes, setGigRequirementNotes] = useState('');

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
    if (tab === 'rental' && !pickupLocation.trim()) return;

    const accessoryList = rentalAccessories
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      if (tab === 'gig') {
        await api.post('/gigs', {
          title: newTitle,
          description: newDescription,
          price: Number(newPrice),
          category: newCategory,
          locationDetails: gigLocationDetails,
          requirementNotes: gigRequirementNotes
        });
      } else {
        await api.post('/rentals', {
          title: newTitle,
          description: newDescription,
          pricePerDay: Number(newPrice),
          category: newCategory,
          specs: {
            brand: rentalBrand,
            model: rentalModel,
            condition: rentalCondition,
            includesAccessories: accessoryList
          },
          pickupLocation,
          availabilityNotes
        });
      }

      // Reset
      setShowModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewPrice('');
      setNewCategory('');
      setRentalBrand('');
      setRentalModel('');
      setRentalCondition('good');
      setRentalAccessories('');
      setPickupLocation('');
      setAvailabilityNotes('');
      setGigLocationDetails('');
      setGigRequirementNotes('');
      fetchFeed();
    } catch (err) {
      console.error(err);
      alert('Failed to post item/gig');
    }
  };

  const activeCategories = categories.filter((c) => c.type === tab);

  return (
    <div className="atelier-page mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="atelier-kicker mb-3 text-xs font-medium uppercase">Student-to-student exchange <span className="text-[#ff6a1f]">•</span> live on campus</p>
          <h1 className="atelier-heading text-4xl sm:text-5xl">Campus Marketplace<span className="text-[#ff6a1f]">.</span></h1>
          <p className="atelier-copy mt-3 max-w-xl text-[15px] leading-6">Hire peers for student gigs or rent textbooks, calculators, and campus essentials.</p>
        </div>
        <button
          onClick={() => {
            if (activeCategories.length > 0) {
              setNewCategory(activeCategories[0].name);
            }
            setShowModal(true);
          }}
          className="atelier-primary flex items-center px-4 py-2.5 text-sm font-semibold transition"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {tab === 'gig' ? 'Post a Gig' : 'List a Rental'}
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="atelier-tabs mb-7 flex">
        <button
          onClick={() => {
            setTab('gig');
            setSelectedCategory('');
          }}
          className={`atelier-tab py-3 px-4 text-sm font-medium transition ${
            tab === 'gig' ? 'atelier-tab-active' : ''
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
          className={`atelier-tab py-3 px-4 text-sm font-medium transition ${
            tab === 'rental' ? 'atelier-tab-active' : ''
          }`}
        >
          <div className="flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            Rentals (Gear & Books)
          </div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="mb-9">
        <form onSubmit={handleSearchSubmit} className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
          <div className="atelier-search flex-1 relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4" />
            <input
              type="text"
              placeholder={`Search ${tab === 'gig' ? 'gigs' : 'rentals'} by intent (e.g. need help shifting stuff)...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border py-3 pl-11 pr-4 text-sm transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="atelier-filter-icon h-4 w-4" />
            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-28 rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-sm text-zinc-100 placeholder:text-[#8E8E93]"
            />
            <span className="text-zinc-600">–</span>
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-28 rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-sm text-zinc-100 placeholder:text-[#8E8E93]"
            />
          </div>

          <button
            type="submit"
            className="atelier-primary px-4 py-2.5 text-sm font-medium transition"
          >
            Apply Filters
          </button>
        </form>

        {/* Categories horizontally */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`atelier-chip flex shrink-0 items-center rounded-full px-3.5 py-2 text-xs font-medium transition ${
              selectedCategory === '' ? 'atelier-chip-active' : ''
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1" />
            All Categories
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`atelier-chip flex shrink-0 items-center rounded-full px-3.5 py-2 text-xs font-medium transition ${
                selectedCategory === cat.name ? 'atelier-chip-active' : ''
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
        <div className="text-center py-16 text-[#737373] font-medium">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="atelier-empty text-center py-16">
          <p className="text-lg">No active {tab}s found matching filters.</p>
          <p className="text-sm text-slate-600 mt-2">Try posting a new one or adjusting search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((item) => {
            const owner = tab === 'gig' ? item.posterId : item.ownerId;
            const priceLabel = tab === 'gig' ? `₹${item.price}` : `₹${item.pricePerDay}/day`;

            return (
              <div
                key={item._id}
                onClick={() => navigate(tab === 'gig' ? `/gig/${item._id}` : `/rental/${item._id}`)}
                className="atelier-card group flex min-h-[238px] cursor-pointer flex-col justify-between p-5 transition duration-200 hover:-translate-y-1"
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="atelier-category rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide">
                      {item.category}
                    </span>
                    <span className="atelier-price text-base font-semibold tracking-[-0.02em]">{priceLabel}</span>
                  </div>
                  <h3 className="atelier-display mt-4 truncate text-[20px]">{item.title}</h3>
                  <p className="atelier-muted mt-2 line-clamp-2 text-sm leading-5">{item.description}</p>
                </div>

                <div className="atelier-divider mt-6 flex items-center justify-between border-t pt-4">
                  <div className="flex flex-col">
                    <span className="atelier-muted text-xs">{owner?.isVerified ? '✓ Verified university student' : owner?.name || 'Campus student'}</span>
                    <span className="atelier-muted mt-0.5 text-[11px]">Recently posted</span>
                    {owner?.ratingAvg > 0 && (
                      <span className="text-[10px] text-yellow-500 flex items-center mt-0.5">
                        <Star className="w-3 h-3 fill-yellow-500 stroke-yellow-500 mr-1" />
                        {owner.ratingAvg} ({owner.ratingCount})
                      </span>
                    )}
                  </div>
                  <button className="flex items-center text-xs font-medium text-[#050505] transition">
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
          <div className="atelier-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
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

              {tab === 'gig' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="gig-location" className="block text-xs font-semibold text-slate-400 uppercase">Location Details</label>
                    <input
                      id="gig-location"
                      type="text"
                      placeholder="e.g. Library study room, remote"
                      value={gigLocationDetails}
                      onChange={(e) => setGigLocationDetails(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="gig-requirements" className="block text-xs font-semibold text-slate-400 uppercase">Requirements</label>
                    <input
                      id="gig-requirements"
                      type="text"
                      placeholder="e.g. Bring laptop, MATLAB skills"
                      value={gigRequirementNotes}
                      onChange={(e) => setGigRequirementNotes(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-price" className="block text-xs font-semibold text-slate-400 uppercase">
                    {tab === 'gig' ? 'Price (₹)' : 'Price per Day (₹)'}
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

              {tab === 'rental' && (
                <div className="space-y-4 pt-2 border-t border-slate-800/70">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="rental-brand" className="block text-xs font-semibold text-slate-400 uppercase">Brand</label>
                      <input
                        id="rental-brand"
                        type="text"
                        placeholder="e.g. Casio"
                        value={rentalBrand}
                        onChange={(e) => setRentalBrand(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="rental-model" className="block text-xs font-semibold text-slate-400 uppercase">Model</label>
                      <input
                        id="rental-model"
                        type="text"
                        placeholder="e.g. fx-991EX"
                        value={rentalModel}
                        onChange={(e) => setRentalModel(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="rental-condition" className="block text-xs font-semibold text-slate-400 uppercase">Condition</label>
                      <select
                        id="rental-condition"
                        value={rentalCondition}
                        onChange={(e) => setRentalCondition(e.target.value as typeof rentalCondition)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="new">New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="worn">Worn</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rental-accessories" className="block text-xs font-semibold text-slate-400 uppercase">Includes Accessories</label>
                    <input
                      id="rental-accessories"
                      type="text"
                      placeholder="Charger, case, manual"
                      value={rentalAccessories}
                      onChange={(e) => setRentalAccessories(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="pickup-location" className="block text-xs font-semibold text-slate-400 uppercase">Pickup Location</label>
                    <input
                      id="pickup-location"
                      type="text"
                      required={tab === 'rental'}
                      placeholder="e.g. Main gate, library lobby"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="availability-notes" className="block text-xs font-semibold text-slate-400 uppercase">Availability Notes</label>
                    <textarea
                      id="availability-notes"
                      rows={2}
                      placeholder="Available weekdays after 5pm"
                      value={availabilityNotes}
                      onChange={(e) => setAvailabilityNotes(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

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
