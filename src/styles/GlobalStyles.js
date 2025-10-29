import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Montserrat:wght@400;500;600&family=Roboto:wght@300;400;500;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${props => props.theme?.fonts?.body || 'Roboto, sans-serif'};
    background-color: ${props => props.theme?.colors?.background || '#FFFFFF'};
    color: ${props => props.theme?.colors?.text || '#111111'};
    line-height: 1.6;
    transition: all 0.3s ease;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme?.fonts?.title || 'Poppins, sans-serif'};
    font-weight: 600;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
  }

  h2 {
    font-size: 2rem;
  }

  h3 {
    font-size: 1.5rem;
  }

  p {
    font-family: ${props => props.theme?.fonts?.body || 'Roboto, sans-serif'};
    margin-bottom: 1rem;
  }

  a {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    text-decoration: none;
    transition: color 0.3s ease;
  }

  a:hover {
    color: ${props => props.theme?.colors?.accent || '#DAA520'};
  }

  button {
    font-family: ${props => props.theme?.fonts?.subtitle || 'Montserrat, sans-serif'};
    cursor: pointer;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .card {
    background-color: ${props => props.theme?.colors?.cardBackground || '#f8f9fa'};
    border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .grid {
    display: grid;
    gap: 24px;
  }

  .grid-2 {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .grid-3 {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .grid-4 {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .btn-primary {
    background-color: ${props => props.theme?.colors?.primary || '#00C896'};
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-primary:hover {
    background-color: #00B085;
    transform: translateY(-2px);
  }

  .btn-secondary {
    background-color: transparent;
    color: ${props => props.theme?.colors?.text || '#111111'};
    border: 2px solid ${props => props.theme?.colors?.primary || '#00C896'};
    padding: 10px 22px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-secondary:hover {
    background-color: ${props => props.theme?.colors?.primary || '#00C896'};
    color: white;
  }

  .metric-card {
    background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#00C896'}15, ${props => props.theme?.colors?.accent || '#DAA520'}15);
    border: 1px solid ${props => props.theme?.colors?.border || '#E5E5E5'};
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    margin-bottom: 8px;
  }

  .metric-label {
    font-size: 0.9rem;
    color: ${props => props.theme?.colors?.text || '#111111'};
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    .container {
      padding: 0 16px;
    }
    
    h1 {
      font-size: 2rem;
    }
    
    h2 {
      font-size: 1.5rem;
    }
    
    .grid-2,
    .grid-3,
    .grid-4 {
      grid-template-columns: 1fr;
    }
  }
`;
