import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';

const HeaderContainer = styled.header`
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
  border-bottom: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

const NavContainer = styled.div`
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
`;

const LogoImage = styled.img`
  height: 75px;
  width: auto;
  margin-right: 0.5rem;
`;

const MainNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;
  @media (max-width: 1024px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: ${props => props.theme?.colors?.text || '#111111'};
  text-decoration: none;
  font-weight: 400;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  white-space: nowrap;
  &:hover {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    background-color: ${props => props.theme?.colors?.primary || '#00C896'}08;
  }
  &.active {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    font-weight: 500;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StyledSearchIcon = styled.div`
  width: 18px;
  height: 18px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  margin-right: 0.5rem;
`;

const StyledUserIcon = styled.div`
  width: 18px;
  height: 18px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  margin-right: 0.5rem;
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: ${props => props.theme?.colors?.text || '#111111'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 400;
  &:hover {
    background-color: ${props => props.theme?.colors?.primary || '#00C896'}08;
  }
`;

const SignInButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: ${props => props.theme?.colors?.text || '#111111'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 400;
  &:hover {
    background-color: ${props => props.theme?.colors?.primary || '#00C896'}08;
  }
`;

const StartTrialButton = styled(Link)`
  background-color: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  &:hover {
    background-color: #00B085;
  }
`;

const Header = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const location = useLocation();

  const mainNavItems = [
    { path: '/about', label: 'About' },
    { path: '/pricing', label: 'Price' },
    { path: '/solutions', label: 'Solutions' },
    { path: '/products', label: 'Products' },
    { path: '/faq', label: 'FAQ' },
    { path: '/blog', label: 'Blog' }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <HeaderContainer>
      <NavContainer>
        <LeftSection>
          <Logo to="/">
            <LogoImage 
              src={isDarkMode ? '/dark_logo.jpg' : '/light_logo.jpg'} 
              alt="KimuntuX Logo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{ display: 'none', alignItems: 'center', gap: '4px', fontSize: '1.5rem' }}>
              <span style={{ color: '#00C896', fontWeight: '700' }}>K</span>
              <span style={{ color: isDarkMode ? '#FFFFFF' : '#111111', fontWeight: '700' }}>imuntuX</span>
            </div>
          </Logo>
          <MainNav>
            {mainNavItems.map(item => (
              <NavLink key={item.path} to={item.path} className={location.pathname === item.path ? 'active' : ''}>
                {item.label}
              </NavLink>
            ))}
          </MainNav>
        </LeftSection>
        <RightSection>
          <SearchButton>
            <StyledSearchIcon />
            Search
          </SearchButton>
          {user ? (
            <>
              <SignInButton onClick={handleLogout}>
                <StyledUserIcon />
                Logout
              </SignInButton>
              <StartTrialButton to="/dashboard">Dashboard</StartTrialButton>
            </>
          ) : (
            <>
              <SignInButton as={Link} to="/login">
                <StyledUserIcon />
                Sign in
              </SignInButton>
              <StartTrialButton to="/signup">Start free trial</StartTrialButton>
            </>
          )}
        </RightSection>
      </NavContainer>
    </HeaderContainer>
  );
};

export default Header;
