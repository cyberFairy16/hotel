// src/pages/BookRoom.js
import React, { useState } from 'react';
import './bookroom.css';
import axios from 'axios';


const roomTypes = [
  {
    id: 10,
    type: 'Single',
    price: 125,
    amenities: ['1 Bed', 'Wi-Fi', 'TV', 'Private Bathroom']
  },
  {
    id: 11,
    type: 'Double',
    price: 175,
    amenities: ['2 Beds', 'Wi-Fi', 'TV', 'Private Bathroom', 'Balcony']
  },
  {
    id: 12,
    type: 'Suite',
    price: 200,
    amenities: ['King Bed', 'Living Area', 'Wi-Fi', 'Mini Bar', 'TV', 'Private Bathroom']
  },
  {
    id: 13,
    type: 'Luxury',
    price: 300,
    amenities: ['King Bed', 'Living Area', 'Hot Tub', 'Sea View', 'Wi-Fi', 'TV', 'Private Bathroom', 'Room Service']
  }
];


const guestServices = [
  { name: 'Spa Treatment', price: 60 },
  { name: 'Massage', price: 90 },
  { name: 'First Class Dinner', price: 100 },
  { name: 'Breakfast Bar Access', price: 30 },
  { name: 'Drink Package', price: 50 }
];


const BookRoom = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');


  const toggleService = (serviceName) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter(name => name !== serviceName)
        : [...prev, serviceName]
    );
  };


  const calculateNights = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = (end - start) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  };


  const handleBooking = async () => {
    if (!selectedRoom || !checkIn || !checkOut) {
      alert('Please select a room and dates.');
      return;
    }


    const nights = calculateNights();
    if (nights === 0) {
      alert('Check-out must be after check-in.');
      return;
    }


    const services = selectedServices.map(name => {
      const service = guestServices.find(s => s.name === name);
      return { service_name: service.name, cost: service.price };
    });


    try {
      const response = await axios.post(
        'http://localhost:5000/api/bookings/book-room',
        {
          room_id: selectedRoom.id,
          check_in: checkIn,
          check_out: checkOut,
          guest_services: services
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );


      const { message, total_price, pointsEarned } = response.data;


      alert(`${message}\nTotal Price: $${total_price.toFixed(2)}\nPoints Earned: ${pointsEarned}`);


      // Reset state
      setSelectedRoom(null);
      setSelectedServices([]);
      setCheckIn('');
      setCheckOut('');


    } catch (error) {
      console.error('Booking failed:', error.response?.data || error.message);
      alert('Booking failed. Please try again.');
    }
  };


  return (
    <div className="book-room-container">
      <h2>Book a Room</h2>


      <label>Check-In Date:</label>
      <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />


      <label>Check-Out Date:</label>
      <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} />


      <h3>Select a Room Type</h3>
      <div className="room-options">
        {roomTypes.map((room, idx) => (
          <div
            key={idx}
            className={`room-card ${selectedRoom?.type === room.type ? 'selected' : ''}`}
            onClick={() => setSelectedRoom(room)}
          >
            <h4>{room.type} - ${room.price}/night</h4>
            <ul>
              {room.amenities.map((amenity, i) => <li key={i}>{amenity}</li>)}
            </ul>
          </div>
        ))}
      </div>


      <h3>Add Guest Services</h3>
      <div className="service-options">
        {guestServices.map((service, idx) => (
          <label key={idx} className="service-label">
            <input
              type="checkbox"
              checked={selectedServices.includes(service.name)}
              onChange={() => toggleService(service.name)}
            />
            {service.name} - ${service.price}
          </label>
        ))}
      </div>


      <button onClick={handleBooking} className="book-btn">Book Now</button>
    </div>
  );
};


export default BookRoom;