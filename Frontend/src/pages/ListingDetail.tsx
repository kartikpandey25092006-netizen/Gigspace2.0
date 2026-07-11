import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { api } from '../services/api';
import { Calendar, DollarSign, User as UserIcon, MessageSquare, Star, Award, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const isGig = location.pathname.startsWith('/gig/');
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking states (for rentals)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Rating States
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [transactionIdToRate, setTransactionIdToRate] = useState('');

  const fetchDetails = async () => {
    try {
      const endpoint = isGig ? `/gigs/${id}` : `/rentals/${id}`;
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, isGig]);

  const handleContact = () => {
    const targetOwner = isGig ? data.posterId : data.ownerId;
    if (!targetOwner) return;
    navigate('/chat', { state: { recipient: targetOwner } });
  };

  const handleAcceptGig = async () => {
    if (!window.confirm('Are you sure you want to accept this gig? Funds will be placed in simulated escrow.')) return;
    setBookingLoading(true);
    try {
      const res = await api.post(`/gigs/${id}/accept`);
      setData(res.data.gig);
      alert('Gig accepted successfully! Transaction created in escrow.');
      fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept gig');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCompleteGig = async () => {
    if (!window.confirm('Confirm gig completion? This releases funds from escrow to the worker.')) return;
    setBookingLoading(true);
    try {
      const res = await api.post(`/gigs/${id}/complete`);
      alert('Gig marked completed! Escrow funds released.');
      // Keep track of transaction to submit rating
      if (res.data.transaction) {
        setTransactionIdToRate(res.data.transaction._id);
        setShowRatingModal(true);
      }
      fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark gig complete');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleRentItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setBookingLoading(true);
    try {
      const res = await api.post(`/rentals/${id}/rent`, { startDate, endDate });
      alert('Rental booked successfully! Funds held in escrow.');
      fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to rent item');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReturnItem = async () => {
    // Find active escrow transaction for this rental
    try {
      const txRes = await api.get('/transactions');
      const activeTx = txRes.data.find(
        (tx: any) => tx.rentalId?._id === id && tx.status === 'held_in_escrow'
      );

      if (!activeTx) {
        alert('Active transaction not found.');
        return;
      }

      if (!window.confirm('Confirm item return? This releases escrow funds to the owner.')) return;

      setBookingLoading(true);
      const returnRes = await api.post('/rentals/return', { transactionId: activeTx._id });
      alert('Item returned successfully! Escrow funds released.');
      setTransactionIdToRate(activeTx._id);
      setShowRatingModal(true);
      fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to return item');
    } finally {
      setBookingLoading(false);
    }
  };

  const submitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/ratings', {
        transactionId: transactionIdToRate,
        stars,
        comment
      });
      alert('Rating submitted successfully! Thank you.');
      setShowRatingModal(false);
      setComment('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 font-medium">Loading details...</div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 glass-panel rounded-xl text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Error loading listing</h2>
        <p className="text-slate-400 mt-2">{error || 'Item not found'}</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition">
          Return Home
        </button>
      </div>
    );
  }

  const owner = isGig ? data.posterId : data.ownerId;
  const isMine = owner?._id === user?.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Hand: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
            <span className="px-3 py-1 rounded text-xs font-bold tracking-wider uppercase bg-blue-900/40 border border-blue-500/20 text-blue-400">
              {data.category}
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-4">{data.title}</h1>
            <p className="text-slate-300 mt-6 leading-relaxed whitespace-pre-wrap">{data.description}</p>
            
            <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Status</span>
                <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded text-xs font-semibold capitalize bg-slate-800 text-slate-300">
                  {data.status}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{isGig ? 'Budget' : 'Price / Day'}</span>
                <span className="text-2xl font-bold text-blue-400">
                  ${isGig ? data.price : data.pricePerDay}
                </span>
              </div>
            </div>
          </div>

          {/* Peer Owner details */}
          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-800 rounded-full text-slate-400">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Posted by</span>
                <span className="text-sm font-bold text-slate-200">{owner?.name}</span>
                <span className="text-xs text-slate-400 block">{owner?.college}</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {owner?.ratingAvg > 0 && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Rating</span>
                  <div className="flex items-center text-sm font-bold text-yellow-500">
                    <Star className="w-4 h-4 mr-1 fill-yellow-500 stroke-yellow-500" />
                    {owner.ratingAvg}
                  </div>
                </div>
              )}
              {!isMine && (
                <button
                  onClick={handleContact}
                  className="flex items-center px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg transition"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Hand: Context Call-to-actions */}
        <div className="space-y-6">
          {/* Gig modules actions */}
          {isGig && (
            <div className="glass-panel p-6 rounded-2xl text-center space-y-4">
              <h3 className="text-lg font-bold text-white">Gig Booking</h3>
              <p className="text-xs text-slate-400">Gigs transactions enforce a secure, locked escrow system.</p>
              {data.status === 'open' && !isMine && (
                <button
                  onClick={handleAcceptGig}
                  disabled={bookingLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition"
                >
                  Accept Gig Task
                </button>
              )}
              {data.status === 'accepted' && isMine && (
                <button
                  onClick={handleCompleteGig}
                  disabled={bookingLoading}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition"
                >
                  Approve Task Completed
                </button>
              )}
              {data.status === 'accepted' && (
                <p className="text-xs text-green-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Working in Escrow
                </p>
              )}
              {data.status === 'completed' && (
                <p className="text-xs text-slate-400">This gig task has been successfully finalized.</p>
              )}
              {isMine && data.status === 'open' && (
                <p className="text-xs text-slate-500">Awaiting applications from campus peers.</p>
              )}
            </div>
          )}

          {/* Rental modules actions */}
          {!isGig && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white text-center">Rental Calendar</h3>
              {data.status === 'available' && !isMine && (
                <form onSubmit={handleRentItem} className="space-y-3">
                  <div>
                    <label htmlFor="rent-start" className="block text-[10px] font-semibold text-slate-400 uppercase">Start Date</label>
                    <input
                      id="rent-start"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="rent-end" className="block text-[10px] font-semibold text-slate-400 uppercase">End Date</label>
                    <input
                      id="rent-end"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition"
                  >
                    Rent Now
                  </button>
                </form>
              )}
              {data.status === 'rented' && (
                <div className="text-center space-y-3">
                  <p className="text-xs text-yellow-400">Currently rented by a student.</p>
                  {!isMine && (
                    <button
                      onClick={handleReturnItem}
                      disabled={bookingLoading}
                      className="w-full py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition"
                    >
                      Confirm Item Returned
                    </button>
                  )}
                </div>
              )}
              {isMine && data.status === 'available' && (
                <p className="text-xs text-slate-500 text-center">Listed and available for campus bookings.</p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Review Dialog Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-center space-y-4">
            <Award className="w-12 h-12 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">Rate the Transaction</h2>
            <p className="text-xs text-slate-400">Give a review to help maintain a trusted campus community.</p>
            <form onSubmit={submitRating} className="space-y-4">
              <div>
                <label htmlFor="rating-stars" className="block text-xs font-semibold text-slate-400 uppercase">Rating Score</label>
                <select
                  id="rating-stars"
                  value={stars}
                  onChange={(e) => setStars(Number(e.target.value))}
                  className="mt-1 block w-20 mx-auto px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-sm focus:outline-none"
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>
              <div>
                <label htmlFor="rating-comment" className="block text-xs font-semibold text-slate-400 uppercase">Feedback Message</label>
                <textarea
                  id="rating-comment"
                  rows={3}
                  placeholder="Tell us about the interaction..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg transition"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
