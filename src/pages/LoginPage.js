import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { parseJsonOrApiError } from '../utils/parseFetchJson';
import transparentLogo from '../assets/dark_new_logo.jpeg';

const LoginContainer = styled.div`
  min-height: 100vh;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const LoginCard = styled.div`
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65);
  width: 100%;
  max-width: 400px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #00c896, #daa520);
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  img {
    height: 72px;
    width: auto;
    display: inline-block;
    background: transparent;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, ${props => props.theme?.colors?.accent || '#DAA520'});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin-bottom: 0.5rem;
  font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
`;

const Subtitle = styled.p`
  text-align: center;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #0d0d0d;
  color: #ffffff;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  &:focus {
    outline: none;
    border-color: #00c896;
    box-shadow: 0 0 0 3px rgba(0, 200, 150, 0.2);
  }
`;

const ShowPasswordRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  user-select: none;
  margin-top: -0.25rem;
`;

const ShowPasswordCheckbox = styled.input`
  accent-color: #00c896;
  width: 1rem;
  height: 1rem;
  cursor: pointer;
`;

const Button = styled.button`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}, #00B085);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${props => props.theme?.colors?.primary || '#00C896'}40;
    
    &::before {
      left: 100%;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  color: rgba(255, 255, 255, 0.65);
`;

const StyledLink = styled(Link)`
  color: #00c896;
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(204, 51, 51, 0.15);
  color: #ff8a8a;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 100, 100, 0.35);
  margin-bottom: 1rem;
  text-align: center;
`;

const LoginPage = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await parseJsonOrApiError(response);

      const admin =
        !!(data.user?.is_admin ?? data.user?.isAdmin);

      const userData = {
        id: data.user.id,
        name: data.user.full_name,
        email: data.user.email,
        isActive: data.user.is_active ?? data.user.isActive,
        isAdmin: admin,
        joinDate: data.user.created_at
      };

      login(userData, data.access_token);
      navigate(admin ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <img src={transparentLogo} alt="KimuX" style={{ background: 'transparent' }} />
        </Logo>
        <Title>Welcome Back</Title>
        <Subtitle>Sign in to your KimuntuX account</Subtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
            <ShowPasswordRow htmlFor="show-password-login">
              <ShowPasswordCheckbox
                type="checkbox"
                id="show-password-login"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show password
            </ShowPasswordRow>
          </InputGroup>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Form>
        
        <LinkText>
          Don't have an account? <StyledLink to="/signup">Sign up</StyledLink>
        </LinkText>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;
