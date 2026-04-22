import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import transparentLogo from '../assets/dark_new_logo.jpeg';

const HeaderContainer = styled.header`
  background: #000000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transform: translateY(${props => props.isVisible ? '0' : '-100%'});
  transition: transform 0.3s ease-in-out;
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
  gap: 3rem;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
`;

const LogoImage = styled.img`
  height: 72px;
  width: auto;
  margin-right: 0.5rem;
  background: transparent;
  
  @media (max-width: 768px) {
    height: 56px;
  }
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
  color: white;
  text-decoration: none;
  font-weight: 400;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 1.375rem;
  white-space: nowrap;
  opacity: 0.9;
  &:hover {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    background-color: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }
  &.active {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    font-weight: 500;
    opacity: 1;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StyledSearchIcon = styled.div`
  width: 22px;
  height: 22px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  margin-right: 0.5rem;
`;

const StyledUserIcon = styled.div`
  width: 22px;
  height: 22px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  margin-right: 0.5rem;
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px 14px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.375rem;
  font-weight: 400;
  opacity: 0.9;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }
`;

const SignInButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px 14px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.375rem;
  font-weight: 400;
  opacity: 0.9;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }
`;

const StartTrialButton = styled(Link)`
  background-color: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 1.25rem;
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
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header at top of page
      if (currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Hide header when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const mainNavItems = [
    { path: '/about', label: 'About' },
    { path: '/pricing', label: 'Price' },
    { path: '/solutions', label: 'Solutions' },
    { path: '/benefits', label: 'Benefits' },
    { path: '/crm', label: 'CRM' },
    { path: '/products', label: 'Products' },
    { path: '/faq', label: 'FAQ' },
    { path: '/blog', label: 'Blog' }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <HeaderContainer isVisible={isVisible}>
      <NavContainer>
        <LeftSection>
          <Logo to="/">
            <LogoImage 
              src={transparentLogo} 
              alt="KimuX Logo"
              style={{ background: 'transparent' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
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
              <StartTrialButton to="/signup">Start Free Trial</StartTrialButton>
            </>
          )}
        </RightSection>
      </NavContainer>
    </HeaderContainer>
  );
};

export default Header;
