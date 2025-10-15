import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { ReactComponent as SearchIcon } from '../assets/search.svg';
import { ReactComponent as UserIcon } from '../assets/user.svg';
import lightLogo from '../assets/light_logo.jpg';

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
  height: 72px;
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

  const mainNavItems = [
    { path: '/about', label: 'About' },
    { path: '/pricing', label: 'Price' },
    { path: '/solutions', label: 'Solutions' },
    { path: '/products', label: 'Products' }, // Products as ordinary nav item
    { path: '/faq', label: 'FAQ' },
    { path: '/blog', label: 'Blog' }
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
