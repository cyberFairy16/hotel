import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admindashboard.css';

const AdminDashboard = () => {
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);

  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('');
  const [roomPrice, setRoomPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [deleteRoomNumber, setDeleteRoomNumber] = useState('');

  const [serviceIdToUpdate, setServiceIdToUpdate] = useState('');

  const [availabilityRoomNumber, setAvailabilityRoomNumber] = useState('');
  const [availabilityResult, setAvailabilityResult] = useState(null);

  const [bookingIdInput, setBookingIdInput] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);

  const [bookingRevenue, setBookingRevenue] = useState(0);
  const [serviceRevenue, setServiceRevenue] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const handleSearch = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/user-bookings', {
        params: { usernameOrEmail: searchInput },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setResults(response.data.bookings);
    } catch (err) {
      alert(err.response?.data?.error || 'Search failed');
    }
  };

  const handleFetchCustomerInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/user-info', {
        params: { usernameOrEmail: searchInput },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCustomerInfo(response.data.user);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to fetch customer info');
      setCustomerInfo(null);
    }
  };

  const handleAddRoom = async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/admin/add-room',
        {
          room_number: roomNumber,
          type: roomType,
          base_price: parseFloat(roomPrice),
          is_available: isAvailable ? 1 : 0
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      alert('Room added successfully');
      setRoomNumber('');
      setRoomType('');
      setRoomPrice('');
      setIsAvailable(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add room');
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/admin/rooms/${deleteRoomNumber}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Room deleted successfully');
      setDeleteRoomNumber('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete room');
    }
  };

  const handleUpdateServiceStatus = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/guest-services/${serviceIdToUpdate}/status`,
        { status: 'Completed' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Guest service status updated to completed');
      setServiceIdToUpdate('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update guest service');
    }
  };

  const handleCheckAvailability = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/check-room-availability', {
        params: { room_number: availabilityRoomNumber },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAvailabilityResult(response.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check room availability');
      setAvailabilityResult(null);
    }
  };

  const handleFetchBookingDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/booking-details/${bookingIdInput}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBookingDetails(response.data.booking);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to fetch booking details');
      setBookingDetails(null);
    }
  };

  // Fetch total revenue on component mount
  useEffect(() => {
    const fetchTotalRevenue = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/revenue', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setBookingRevenue(parseFloat(response.data.booking || 0));
        setServiceRevenue(parseFloat(response.data.services || 0));
        setTotalRevenue(parseFloat(response.data.total || 0));
      } catch (err) {
        console.error("Error fetching total revenue:", err); // Log full error for debugging
        alert('Failed to fetch total revenue');
      }
    };

    fetchTotalRevenue();
  }, []);

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>

      <div className="search-section">
        <label>Search by Username or Email:</label>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Enter username or email"
        />
        <button onClick={handleSearch}>Search Bookings</button>
        <button onClick={handleFetchCustomerInfo}>View Customer Info</button>
      </div>

      {customerInfo && (
        <div className="customer-info">
          <h3>Customer Info</h3>
          <p><strong>Name:</strong> {customerInfo.name}</p>
          <p><strong>Email:</strong> {customerInfo.email}</p>
          <p><strong>Phone:</strong> {customerInfo.phone}</p>
          <p><strong>ID Number:</strong> {customerInfo.id_number}</p>
          <p><strong>Address:</strong> {customerInfo.address}</p>
          <p><strong>Loyalty Points:</strong> {customerInfo.loyalty_points}</p>
        </div>
      )}

      <hr />

      <div className="room-management">
        <h3>Add Room</h3>
        <input
          type="text"
          placeholder="Room Number"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="Room Type (e.g., single, double)"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
        />
        <input
          type="number"
          placeholder="Price"
          value={roomPrice}
          onChange={(e) => setRoomPrice(e.target.value)}
        />
        <label>
          Available:
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
          />
        </label>
        <button onClick={handleAddRoom}>Add Room</button>
      </div>

      <div className="room-deletion">
        <h3>Delete Room</h3>
        <input
          type="text"
          placeholder="Room Number to Delete"
          value={deleteRoomNumber}
          onChange={(e) => setDeleteRoomNumber(e.target.value)}
        />
        <button onClick={handleDeleteRoom}>Delete Room</button>
      </div>

      <div className="service-update">
        <h3>Update Guest Service Request</h3>
        <input
          type="text"
          placeholder="Service ID to Mark as Completed"
          value={serviceIdToUpdate}
          onChange={(e) => setServiceIdToUpdate(e.target.value)}
        />
        <button onClick={handleUpdateServiceStatus}>Mark as Completed</button>
      </div>

      <div className="room-availability-check">
        <h3>Check Room Availability</h3>
        <input
          type="text"
          placeholder="Enter Room Number"
          value={availabilityRoomNumber}
          onChange={(e) => setAvailabilityRoomNumber(e.target.value)}
        />
        <button onClick={handleCheckAvailability}>Check Availability</button>

        {availabilityResult && (
          <div className="availability-result">
            <p><strong>Room Type:</strong> {availabilityResult.type}</p>
            <p><strong>Marked Available in System:</strong> {availabilityResult.is_available ? 'Yes' : 'No'}</p>
            <p><strong>Currently Booked:</strong> {availabilityResult.currently_booked ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>

      <div className="booking-detail-check">
        <h3>Check Booking Details</h3>
        <input
          type="text"
          placeholder="Enter Booking ID"
          value={bookingIdInput}
          onChange={(e) => setBookingIdInput(e.target.value)}
        />
        <button onClick={handleFetchBookingDetails}>Fetch Details</button>

        {bookingDetails && (
          <div className="booking-detail-result">
            <p><strong>Booking ID:</strong> {bookingDetails.booking_id}</p>
            <p><strong>Status:</strong> {bookingDetails.booking_status}</p>
            <p><strong>Check-In:</strong> {bookingDetails.check_in}</p>
            <p><strong>Check-Out:</strong> {bookingDetails.check_out}</p>
            <p><strong>Total Price:</strong> ${bookingDetails.total_price}</p>
            <p><strong>Customer:</strong> {bookingDetails.customer_name}</p>
            <p><strong>Email:</strong> {bookingDetails.email}</p>
            <p><strong>Phone:</strong> {bookingDetails.phone}</p>
            <p><strong>Room Number:</strong> {bookingDetails.room_number}</p>
            <p><strong>Room Type:</strong> {bookingDetails.room_type}</p>
            <p><strong>Base Price:</strong> ${bookingDetails.base_price}</p>
            <p><strong>Room Available:</strong> {bookingDetails.is_available ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>

      <div className="total-revenue">
        <h3>Total Revenue</h3>
        <p><strong>From Bookings:</strong> ${bookingRevenue.toFixed(2)}</p>
        <p><strong>From Guest Services:</strong> ${serviceRevenue.toFixed(2)}</p>
        <p><strong>Total:</strong> ${totalRevenue.toFixed(2)}</p>
      </div>

      <hr />

      {results.length > 0 && (
        <div className="results-section">
          <h3>Booking History</h3>
          {results.map((b, i) => (
            <div key={i} className="booking-card">
              <p><strong>Room:</strong> {b.room_type}</p>
              <p><strong>Check-in:</strong> {b.check_in}</p>
              <p><strong>Check-out:</strong> {b.check_out}</p>
              <p><strong>Total Price:</strong> ${b.total_price}</p>
              {b.services.length > 0 && (
                <>
                  <p><strong>Services:</strong></p>
                  <ul>
                    {b.services.map((s, j) => (
                      <li key={j}>
                        {s.name} - ${s.cost} - Status: {s.status}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
