import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
// Import SVG icons as React components
import { ReactComponent as SearchIcon } from '../assets/search.svg';
import { ReactComponent as UserIcon } from '../assets/user.svg';

// Import your logo (remains .jpg for now)
import lightLogo from '../assets/light_logo.jpg';
// If you change to SVG: import { ReactComponent as LightLogo } from '../assets/light_logo.svg';

const HeaderContainer = styled.header`
  background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
  border-bottom: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  padding: 0.5rem 0;
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
  height: 64px;    // Increased size
  width: auto;
  margin-right: 0.5rem;
`;

// If using SVG logo instead, comment above and use below
// const StyledLogo = styled(LightLogo)`
//   height: 64px;
//   width: auto;
//   margin-right: 0.5rem;
// `;

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

const ProductsDropdown = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
  &:hover {
    background-color: ${props => props.theme?.colors?.primary || '#00C896'}08;
  }
`;

const ProductsText = styled.span`
  color: ${props => props.theme?.colors?.text || '#111111'};
  font-size: 0.9rem;
  font-weight: 400;
`;

const DropdownArrow = styled.span`
  color: ${props => props.theme?.colors?.text || '#111111'};
  font-size: 0.7rem;
  transition: transform 0.2s ease;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: ${props => props.theme?.colors?.cardBackground || '#f8f9fa'};
  border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1001;
  display: ${props => props.show ? 'block' : 'none'};
`;

const DropdownItem = styled(Link)`
  display: block;
  padding: 10px 16px;
  color: ${props => props.theme?.colors?.text || '#111111'};
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  border-bottom: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background-color: ${props => props.theme?.colors?.primary || '#00C896'}10;
    color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
`;

// Make SVG icons black
const StyledSearchIcon = styled(SearchIcon)`
  width: 20px;
  height: 20px;
  margin-right: 8px;
  vertical-align: middle;
  fill: #111 !important;
`;

const StyledUserIcon = styled(UserIcon)`
  width: 22px;
  height: 22px;
  margin-right: 8px;
  vertical-align: middle;
  fill: #111 !important;
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
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const mainNavItems = [
    { path: '/crm', label: 'CRM' },
    { path: '/b2b-brokerage', label: 'B2B' },
    { path: '/b2c-marketplace', label: 'B2C' },
    { path: '/ai-dashboard', label: 'AI' },
    { path: '/blockchain', label: 'Blockchain' }
  ];

  const allNavItems = [
    { path: '/crm', label: 'CRM' },
    { path: '/b2b-brokerage', label: 'B2B Brokerage' },
    { path: '/b2c-marketplace', label: 'B2C Marketplace' },
    { path: '/affiliate-hub', label: 'Affiliate Hub' },
    { path: '/ecommerce', label: 'eCommerce' },
    { path: '/ai-dashboard', label: 'AI Dashboard' },
    { path: '/blockchain', label: 'Blockchain' },
    { path: '/fintech', label: 'Fintech' },
    { path: '/commerce-intelligence', label: 'Commerce Intelligence' },
    { path: '/developer', label: 'Developer' },
    { path: '/monetization', label: 'Monetization' },
    { path: '/usbh', label: 'USBH' }
  ];

  return (
    <HeaderContainer>
      <NavContainer>
        <LeftSection>
          <Logo to="/">
            <LogoImage
              src={lightLogo}
              alt="Logo"
              onError={e => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <span style={{ fontWeight: 600, fontSize: '1.35rem', color: '#111', display: 'none' }}>imuntuX</span>
            {/* If SVG logo is used, instead: <StyledLogo /> */}
          </Logo>
          <MainNav>
            {mainNavItems.map(item => (
              <NavLink key={item.path} to={item.path} className={location.pathname === item.path ? 'active' : ''}>
                {item.label}
              </NavLink>
            ))}
          </MainNav>
          <ProductsDropdown onClick={() => setShowDropdown(!showDropdown)}>
            <ProductsText>Products</ProductsText>
            <DropdownArrow style={{ transform: showDropdown ? 'rotate(180deg)' : 'none' }}>▼</DropdownArrow>
            <DropdownMenu show={showDropdown}>
              {allNavItems.map(item => (
                <DropdownItem key={item.path} to={item.path} onClick={() => setShowDropdown(false)}>
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </ProductsDropdown>
        </LeftSection>
        <RightSection>
          <SearchButton>
            <StyledSearchIcon />
            Search
          </SearchButton>
          <SignInButton>
            <StyledUserIcon />
            Sign in
          </SignInButton>
          <StartTrialButton to="/start-trial">
            Start free trial
          </StartTrialButton>
        </RightSection>
      </NavContainer>
    </HeaderContainer>
  );
};

export default Header;
