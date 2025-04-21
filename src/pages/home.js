import React from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css'; // optional styling

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Welcome to Hotel Breeze</h1>
      <p>Where luxury meets style</p>
      <div className="button-group">
        <button onClick={() => navigate('/register')}>Register</button>
        <button onClick={() => navigate('/login')}>Login</button>
      </div>
    </div>
  );
};

export default Home;
