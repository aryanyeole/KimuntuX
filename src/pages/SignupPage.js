import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
  padding: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SignupCard = styled.div`
  background-color: ${props => props.theme?.colors?.cardBackground || '#f8f9fa'};
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: ${props => props.theme?.colors?.primary || '#00C896'};
  text-align: center;
  margin-bottom: 2rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 8px;
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
  color: ${props => props.theme?.colors?.text || '#111111'};
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
`;

const Button = styled.button`
  background-color: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #00B085;
    transform: translateY(-2px);
  }
`;

const SignupPage = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Signup data:', formData);
    alert('Signup functionality will be implemented!');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <PageContainer>
      <SignupCard>
        <Title>Start Your Free Trial</Title>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            type="text"
            name="company"
            placeholder="Company Name"
            value={formData.company}
            onChange={handleChange}
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Button type="submit">Start Free Trial</Button>
        </Form>
        <p style={{ 
          textAlign: 'center', 
          marginTop: '1rem', 
          color: theme.colors?.text || '#111111',
          opacity: 0.8
        }}>
          Already have an account? <Link to="/login" style={{ color: theme.colors?.primary || '#00C896' }}>Sign in</Link>
        </p>
      </SignupCard>
    </PageContainer>
  );
};

export default SignupPage;
