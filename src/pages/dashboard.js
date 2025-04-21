// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const Dashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const handleBookRoom = () => {
    navigate('/book-room');
  };

  const fetchDashboardData = async () => {
    if (!token) {
      setError('You must be logged in.');
      return;
    }

    try {
      const userRes = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const bookingsRes = await axios.get('http://localhost:5000/api/bookings/my-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserInfo(userRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const res = await axios.delete(`http://localhost:5000/api/bookings/cancel/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert(res.data.message);
      fetchDashboardData(); // refresh bookings
    } catch (err) {
      console.error(err);
      alert('Cancellation failed. Please try again.');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <div className="dashboard-container">
      <h2>Welcome to Your Dashboard</h2>

      {userInfo && (
        <div className="user-info" style={{ backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '8px' }}>
          <p><strong>Name:</strong> {userInfo.name || 'N/A'}</p>
          <p><strong>Username:</strong> {userInfo.username}</p>
          <p><strong>Email:</strong> {userInfo.email}</p>
          <p><strong>Phone:</strong> {userInfo.phone || 'N/A'}</p>
          <p><strong>ID Number:</strong> {userInfo.id_number || 'N/A'}</p>
          <p><strong>Address:</strong> {userInfo.address || 'N/A'}</p>
          <p><strong>Loyalty Points:</strong> {userInfo.loyalty_points}</p>
        </div>
      )}

      <button className="book-room-btn" onClick={handleBookRoom}>
        Book a Room
      </button>

      <h3>Your Bookings</h3>
      <div className="bookings">
        {bookings.length > 0 ? (
          bookings.map((booking, index) => (
            <div key={index} className="booking-card" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '6px' }}>
              <p><strong>Booking ID:</strong> {booking.id}</p>
              <p><strong>Room Number:</strong> {booking.room_number}</p>
              <p><strong>Check-In:</strong> {booking.check_in || 'N/A'}</p>
              <p><strong>Check-Out:</strong> {booking.check_out || 'N/A'}</p>
              <p><strong>Status:</strong> {booking.status || 'N/A'}</p>
              <button
                className="cancel-btn"
                onClick={() => cancelBooking(booking.id)}
                style={{
                  backgroundColor: '#ff4d4d',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Cancel Booking
              </button>
            </div>
          ))
        ) : (
          <p>No bookings found.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
