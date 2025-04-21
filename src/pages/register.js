import React, { useState } from 'react';
import axios from 'axios';
import './register.css'; // Optional: if using separate CSS
import { Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    phone: '',
    id_number: '',
    address: ''
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData); // adjust if needed
      setMessage('Registration successful!');
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <input name="username" placeholder="Username" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="name" placeholder="Full Name" onChange={handleChange} />
        <input name="phone" placeholder="Phone" onChange={handleChange} />
        <input name="id_number" placeholder="ID Number" onChange={handleChange} />
        <textarea name="address" placeholder="Address" onChange={handleChange} />
        <button type="submit">Register</button>
      </form>
      {message && <p className="message">{message}</p>}

      <div className="login-link">
        Already have an account? <Link to="/login">Login</Link>
      </div>

    </div>
    
  );
};

export default Register;
