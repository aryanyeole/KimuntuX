import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import {
  listContentForScheduler,
  mapSchedulerCardToCampaignPayload,
  deleteCampaignRecord,
  updateCampaignRecord,
} from '../services/contentSchedulerRepository';
import xLogo from '../assets/x.svg';
import instagramLogo from '../assets/instagram.svg';
import linkedinLogo from '../assets/icons8-linkedin.svg';
import facebookLogo from '../assets/facebook.svg';
import youtubeLogo from '../assets/youtube.svg';
import emailLogo from '../assets/email-8-svgrepo-com.svg';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme?.colors?.background || '#f8f9fa'};
  padding: 120px 20px 2rem 20px;
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.9rem;
`;

const PageTitle = styled.h1`
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin: 0;
`;

const CalendarControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1.75rem;
`;

const MonthNavigator = styled.div`
  display: flex;
  align-items: center;
  gap: 1.1rem;
`;

const NavButton = styled.button`
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 10px;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.theme?.colors?.text || '#111111'};
  font-size: 1.35rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme?.colors?.primary || '#00C896'};
    color: white;
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
`;

const MonthYearDisplay = styled.div`
  font-size: 1.35rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.text || '#111111'};
  min-width: 220px;
  text-align: center;
`;

const TodayButton = styled.button`
  background: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1.25rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
`;

const CalendarGrid = styled.div`
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow:
    0 0 0 1px ${props => `${props.theme?.colors?.primary || '#00C896'}1A`},
    0 0 22px ${props => `${props.theme?.colors?.primary || '#00C896'}1F`};
`;

const WeekdaysRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const WeekdayLabel = styled.div`
  text-align: center;
  font-weight: 600;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.7;
  font-size: 0.875rem;
  padding: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  grid-auto-rows: 110px; /* lock all day cells to same height */

  @media (max-width: 768px) {
    grid-auto-rows: 90px;
  }
`;

const DayCell = styled.div`
  height: 100%;            /* fill fixed grid row */
  min-height: 0;
  overflow: hidden;        /* prevent content from stretching cell */
  background: ${props => {
    if (props.isSelected) return `${props.theme?.colors?.accent || '#DAA520'}15`;
    if (props.isToday) return `${props.theme?.colors?.primary || '#00C896'}10`;
    if (props.isOtherMonth) return 'transparent';
    return props.theme?.colors?.background || '#f8f9fa';
  }};
  border: 2px solid ${props => {
    if (props.isSelected) return props.theme?.colors?.accent || '#DAA520';
    if (props.isToday) return props.theme?.colors?.primary || '#00C896';
    return 'transparent';
  }};
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${props => props.theme?.colors?.primary || '#00C896'}15;
    transform: translateY(-2px);
  }
`;

const DayNumber = styled.div`
  font-weight: ${props => props.isToday ? '700' : '500'};
  color: ${props => {
    if (props.isOtherMonth) return `${props.theme?.colors?.text || '#111111'}30`;
    if (props.isToday) return props.theme?.colors?.primary || '#00C896';
    return props.theme?.colors?.text || '#111111';
  }};
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const EventIndicators = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 0.25rem;
`;

const EventDot = styled.div`
  width: 100%;
  height: 3px;
  background: ${props => props.theme?.colors?.primary || '#00C896'};
  border-radius: 2px;
  opacity: 0.6;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: stretch;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const SidebarColumn = styled.div`
  position: relative;
  min-height: 0;
`;

const Sidebar = styled.aside`
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 12px;
  padding: 1rem;
  position: absolute;
  inset: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 0 0 1px ${props => `${props.theme?.colors?.primary || '#00C896'}14`},
    0 0 18px ${props => `${props.theme?.colors?.primary || '#00C896'}1A`};

  @media (max-width: 1100px) {
    position: relative;
    inset: auto;
  }
`;

const SidebarTitle = styled.h3`
  margin: 0 0 0.75rem 0;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  align-items: center;
  justify-content: space-between;
`;

const TabGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const TabButton = styled.button`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  background: ${props => (props.active ? (props.theme?.colors?.primary || '#00C896') : 'transparent')};
  color: ${props => (props.active ? '#fff' : (props.theme?.colors?.text || '#111111'))};
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
`;

const SidebarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-right: 0.25rem;
`;

const ContentCard = styled.div`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 10px;
  padding: 0.75rem;
  background: ${props => props.isHighlighted 
    ? `${props.theme?.colors?.accent || '#DAA520'}20`
    : (props.theme?.colors?.background || '#f8f9fa')};
  border-color: ${props => props.isHighlighted 
    ? (props.theme?.colors?.accent || '#DAA520')
    : (props.theme?.colors?.border || '#e5e5e5')};
  transition: all 0.3s ease;
  position: relative;
  cursor: ${props => props.draggable ? 'grab' : 'default'};
  padding-left: 1rem;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${props => props.color || '#00C896'};
    border-radius: 10px 0 0 10px;
  }
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
`;

const CardTitle = styled.div`
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  margin-bottom: 0.35rem;
  flex: 1;
`;

const CardMeta = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.5rem;
`;

const PlatformRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.2rem;
`;

const PlatformText = styled.span`
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const PlatformIconWrap = styled.span`
  width: 20px;
  height: 20px;
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 6px;
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
`;

const PlatformIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
`;

const EmailBadge = styled.span`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 6px;
  padding: 0.1rem 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${props => props.theme?.colors?.text || '#111111'};
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const IconButton = styled.button`
  background: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const EditButton = styled(IconButton)`
  background: ${props => props.theme?.colors?.primary || '#00C896'};
`;

const ViewButton = styled(IconButton)`
  background: #3B82F6;
  
  &:hover {
    background: #2563EB;
  }
`;

const EventBox = styled.button`
  width: 18px;
  height: 18px;
  background: ${props => props.color || '#00C896'};
  border-radius: 3px;
  opacity: 0.8;
  transition: all 0.2s ease;
  border: none;
  padding: 0;
  cursor: pointer;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const EventBoxes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 0.25rem;
  max-width: 100%;
  position: relative;
  z-index: 2;
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ColorOption = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid ${props => props.selected ? '#111' : 'transparent'};
  background: ${props => props.color};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    border-color: #111;
  }
`;

const AddButton = styled.button`
  background: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
    transform: scale(1.05);
  }
`;

const DangerSquareButton = styled(IconButton)`
  background: #DC2626;
  margin-left: auto;

  &:hover {
    background: #B91C1C;
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalCard = styled.div`
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h2`
  margin: 0 0 1.5rem 0;
  color: ${props => props.theme?.colors?.text || '#111111'};
  font-size: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &:has(> ${props => props.fullWidth ? 'div' : 'CheckboxRow'}) {
    grid-column: 1 / -1;
  }
`;

const Label = styled.label`
  font-weight: 600;
  color: ${props => props.theme?.colors?.text || '#111111'};
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 8px;
  font-size: 1rem;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  color: ${props => props.theme?.colors?.text || '#111111'};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 8px;
  font-size: 1rem;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  color: ${props => props.theme?.colors?.text || '#111111'};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  
  input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }
`;

const PlatformOptionText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.variant === 'secondary' 
    ? 'transparent' 
    : (props.theme?.colors?.primary || '#00C896')};
  color: ${props => props.variant === 'secondary' 
    ? (props.theme?.colors?.text || '#111111')
    : 'white'};
  border: ${props => props.variant === 'secondary' 
    ? `1px solid ${props.theme?.colors?.border || '#e5e5e5'}`
    : 'none'};
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const TimelineModalCard = styled(ModalCard)`
  max-width: 900px;
`;

const TimelineHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const TimelineTitle = styled.h3`
  margin: 0;
  color: ${p => p.theme?.colors?.text || '#111111'};
`;

const TimelineBody = styled.div`
  max-height: 70vh;
  overflow: auto;
  border: 1px solid ${p => p.theme?.colors?.border || '#e5e5e5'};
  border-radius: 10px;
  background: ${p => p.theme?.colors?.background || '#f8f9fa'};
`;

const TimelineGrid = styled.div`
  position: relative;
  min-height: 1460px; /* 24h + top/bottom spacing for labels */
  padding-top: 10px;
  padding-bottom: 10px;
`;

const HourRow = styled.div`
  height: 60px; /* 1 hour = 60px */
  border-top: 1px solid ${p => p.theme?.colors?.border || '#e5e5e5'};
  position: relative;
  margin-left: 78px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    border-top: 1px dashed ${p => `${p.theme?.colors?.border || '#e5e5e5'}AA`};
  }

  &::before { top: 15px; }
  &::after { top: 45px; }
`;

const QuarterLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 30px;
  border-top: 1px dashed ${p => `${p.theme?.colors?.border || '#e5e5e5'}AA`};
`;

const HourLabel = styled.div`
  position: absolute;
  left: -70px;
  top: -9px;
  width: 62px;
  font-size: 0.75rem;
  text-align: right;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: 0.75;
`;

const TimelineEndLabel = styled.div`
  position: absolute;
  left: 8px;
  bottom: 1px;
  width: 62px;
  font-size: 0.75rem;
  text-align: right;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: 0.75;
`;

const TimelineEventCard = styled.button`
  position: absolute;
  left: 90px;
  right: 12px;
  min-height: 26px;
  border: 1px solid ${p => p.theme?.colors?.border || '#e5e5e5'};
  border-left: 6px solid ${p => p.color || '#00C896'};
  background: ${p => p.theme?.colors?.cardBackground || '#ffffff'};
  color: ${p => p.theme?.colors?.text || '#111111'};
  border-radius: 8px;
  text-align: left;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
`;

const TimelineEventTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const TimelinePlatformRow = styled.div`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.2rem;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem 1rem;
  margin-top: 0.5rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  font-size: 0.9rem;
  color: ${p => p.theme?.colors?.text || '#111111'};
  opacity: 0.9;
`;

const ColorSwatch = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-left: 0.4rem;
  background: ${p => p.color || '#00C896'};
`;

export default function ContentSchedulerPage() {
  const theme = useTheme();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledContent, setScheduledContent] = useState([]);
  const [sidebarTab, setSidebarTab] = useState('inMonth');
  const [selectedDate, setSelectedDate] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalMode, setModalMode] = useState('calendar');
  const [draggingItemId, setDraggingItemId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    startTime: '09:00',
    interval: 'once',
    endDate: '',
    platforms: [],
    cost: '',
    color: '#00C896'
  });

  const colorOptions = [
    '#00C896', '#DAA520', '#60A5FA', '#34D399', 
    '#F97316', '#F472B6', '#A78BFA', '#FCD34D',
    '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'
  ];

  const platformOptions = [
    { value: 'Email', label: 'Email', logo: emailLogo },
    { value: 'YouTube', label: 'YouTube', logo: youtubeLogo },
    { value: 'LinkedIn', label: 'LinkedIn', logo: linkedinLogo },
    { value: 'X', label: 'X', logo: xLogo },
    { value: 'Facebook', label: 'Facebook', logo: facebookLogo },
    { value: 'Instagram', label: 'Instagram', logo: instagramLogo }
  ];

  const getNormalizedPlatform = (platform) => {
    if (!platform) return '';
    const value = String(platform).trim().toLowerCase();
    if (value === 'youtube') return 'YouTube';
    if (value === 'linkedin' || value === 'linked in') return 'LinkedIn';
    if (value === 'x' || value === 'twitter') return 'X';
    if (value === 'facebook') return 'Facebook';
    if (value === 'instagram') return 'Instagram';
    if (value === 'email' || value === 'e-mail') return 'Email';
    return platform;
  };

  const getPlatformConfig = (platform) => {
    const normalized = getNormalizedPlatform(platform);
    return platformOptions.find((option) => option.value === normalized) || null;
  };

  const renderPlatformChip = (platform, keyPrefix = 'platform') => {
    const platformConfig = getPlatformConfig(platform);
    if (!platformConfig) return null;

    return (
      <PlatformIconWrap key={`${keyPrefix}-${platformConfig.value}`} title={platformConfig.label} aria-label={platformConfig.label}>
        <PlatformIcon src={platformConfig.logo} alt={platformConfig.label} />
      </PlatformIconWrap>
    );
  };

  useEffect(() => {
    const controller = new AbortController();

    listContentForScheduler({ signal: controller.signal })
      .then((items) => {
        const itemsWithColors = items.map((item, index) => ({
          ...item,
          color: item.color || colorOptions[index % colorOptions.length]
        }));
        setScheduledContent(itemsWithColors);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('Error loading content:', err);
        }
      });

    return () => controller.abort();
  }, []);

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get days to fill the first week
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = firstDayOfWeek;
  
  // Get days to fill the last week
  const totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;
  const nextMonthDays = totalCells - (daysInMonth + firstDayOfWeek);

  // array of all days to display
  const calendarDays = [];
  
  // Previous month days
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthLastDay - i,
      isOtherMonth: true,
      date: new Date(year, month - 1, prevMonthLastDay - i)
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isOtherMonth: false,
      date: new Date(year, month, i)
    });
  }
  
  // Next month days
  for (let i = 1; i <= nextMonthDays; i++) {
    calendarDays.push({
      day: i,
      isOtherMonth: true,
      date: new Date(year, month + 1, i)
    });
  }

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return scheduledContent.filter(item => isOccurrenceOnDate(item, date));
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isInCurrentMonth = (date) =>
    date.getFullYear() === year && date.getMonth() === month;

  const inCalendarContent = scheduledContent.filter(item => item.isUsed);
  const unusedContent = scheduledContent.filter(item => !item.isUsed);

  const openEditModal = (item) => {
    setIsEditMode(true);
    setEditingId(item.id);
    setModalMode(item.sendDate ? 'calendar' : 'unused');
    setFormData({
      name: item.title || '',
      startDate: item.sendDate || '',
      startTime: item.sendTime || '09:00',
      interval: item.recurrence || 'once',
      endDate: item.endDate || '',
      platforms: item.platforms || [],
      cost: item.cost || '',
      color: item.color || '#00C896'
    });
    setShowModal(true);
  };

  const isOccurrenceOnDate = (item, date) => {
    if (!item.sendDate) return false;

    // parse as local dates
    const [startYear, startMonth, startDay] = item.sendDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    start.setHours(0, 0, 0, 0);

    let end;
    if (item.endDate) {
      const [endYear, endMonth, endDay] = item.endDate.split('-').map(Number);
      end = new Date(endYear, endMonth - 1, endDay);
    } else {
      end = new Date(start);
    }
    end.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    if (target < start || target > end) return false;

    const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24));

    if (item.recurrence === 'weekly') return diffDays % 7 === 0;
    if (item.recurrence === 'biweekly') return diffDays % 14 === 0;

    return diffDays === 0;
  };

  const selectedDateContent = selectedDate
    ? inCalendarContent.filter(item => isOccurrenceOnDate(item, selectedDate))
    : inCalendarContent;

  const togglePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleSave = () => {
    setShowModal(false);
  };

  const handleDragStart = (itemId) => {
    setDraggingItemId(itemId);
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
  };

  const handleCalendarDrop = async (dropDate, event) => {
    event?.preventDefault();
    if (!draggingItemId || !dropDate) return;

    const startDate = `${dropDate.getFullYear()}-${String(dropDate.getMonth() + 1).padStart(2, '0')}-${String(dropDate.getDate()).padStart(2, '0')}`;
    const endDate = window.prompt('Enter end date (YYYY-MM-DD) or leave blank:', '');

    const item = scheduledContent.find(entry => entry.id === draggingItemId);
    if (!item) return;

    try {
      const payload = mapSchedulerCardToCampaignPayload(item, {
        campaignId: item.id,
        used: true,
        startDate,
        endDate: endDate || '',
      });
      const updated = await updateCampaignRecord(item.id, payload);
      setScheduledContent(prev => prev.map(entry => (entry.id === item.id ? updated : entry)));
      setSelectedDate(dropDate);
      setSidebarTab('inMonth');
      setDraggingItemId(null);
    } catch (err) {
      window.alert(err.message || 'Unable to schedule campaign');
    }
  };

  const handleRemoveFromCalendar = async (item) => {
    try {
      const payload = mapSchedulerCardToCampaignPayload(item, {
        campaignId: item.id,
        used: false,
        startDate: '',
        endDate: '',
      });
      const updated = await updateCampaignRecord(item.id, payload);
      setScheduledContent(prev => prev.map(entry => (entry.id === item.id ? updated : entry)));
      setSidebarTab('unused');
    } catch (err) {
      window.alert(err.message || 'Unable to remove campaign from calendar');
    }
  };

  const handleDeleteCampaign = async (item) => {
    const confirmed = window.confirm(`Delete "${item.title}" permanently? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteCampaignRecord(item.id);
      setScheduledContent(prev => prev.filter(entry => entry.id !== item.id));
      if (viewingItem?.id === item.id) {
        setViewingItem(null);
      }
      if (detailItem?.id === item.id) {
        setDetailItem(null);
      }
    } catch (err) {
      window.alert(err.message || 'Unable to delete campaign');
    }
  };

  const handleDayClick = (date, hasEvents) => {
    if (hasEvents) {
      setSelectedDate(date);
      setSidebarTab('inMonth');
    } else {
      setSelectedDate(null);
    }
  };

  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isItemHighlighted = (item) => {
    if (!selectedDate || !item.sendDate) return false;
    return isOccurrenceOnDate(item, selectedDate);
  };

  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineDate, setTimelineDate] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const jumpToItemDate = (item) => {
    if (!item?.sendDate) return;
    const d = parseLocalDate(item.sendDate);
    if (!d) return;
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
    setSidebarTab('inMonth');
  };

  const openTimeline = (date) => {
    setTimelineDate(date);
    setShowTimeline(true);
  };

  const openCampaignModal = (item) => {
    setViewingItem(item);
    setDetailItem(null);
    setShowTimeline(false);
  };

  const timelineEvents = (timelineDate ? getEventsForDate(timelineDate) : [])
    .slice()
    .sort((a, b) => (a.sendTime || '00:00').localeCompare(b.sendTime || '00:00'));

  const getMinutes = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const formatHour = (h) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:00 ${suffix}`;
  };

  return (
    <PageContainer>
      <Container>
        <Layout>
          <MainColumn>
            <Header>
              <PageTitle>Campaign Scheduler</PageTitle>
              <CalendarControls>
                <TodayButton onClick={goToToday}>Today</TodayButton>
                <MonthNavigator>
                  <NavButton onClick={goToPreviousMonth}>‹</NavButton>
                  <MonthYearDisplay>
                    {monthNames[month]} {year}
                  </MonthYearDisplay>
                  <NavButton onClick={goToNextMonth}>›</NavButton>
                </MonthNavigator>
              </CalendarControls>
            </Header>

            <CalendarGrid
            >
              <WeekdaysRow>
                {weekdays.map(day => (
                  <WeekdayLabel key={day}>{day}</WeekdayLabel>
                ))}
              </WeekdaysRow>
              
              <DaysGrid>
                {calendarDays.map((dayInfo, index) => {
                  const events = getEventsForDate(dayInfo.date);
                  return (
                    <DayCell
                      key={index}
                      isToday={isToday(dayInfo.date)}
                      isOtherMonth={dayInfo.isOtherMonth}
                      isSelected={isDateSelected(dayInfo.date)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleCalendarDrop(dayInfo.date, e)}
                      onClick={() => handleDayClick(dayInfo.date, events.length > 0)}
                    >
                      <DayNumber
                        isToday={isToday(dayInfo.date)}
                        isOtherMonth={dayInfo.isOtherMonth}
                      >
                        {dayInfo.day}
                      </DayNumber>
                      {events.length > 0 && (
                        <EventBoxes>
                          {events.slice(0, 6).map((event, idx) => (
                            <EventBox
                              key={`${event.id}-${idx}`}
                              color={event.color}
                              onClick={(e) => {
                                e.stopPropagation();
                                openTimeline(dayInfo.date);
                              }}
                              aria-label={`Open timeline for ${dayInfo.date.toDateString()}`}
                              title={`${event.title} (${event.sendTime || 'No time'})`}
                              type="button"
                            />
                          ))}
                        </EventBoxes>
                      )}
                    </DayCell>
                  );
                })}
              </DaysGrid>
            </CalendarGrid>
          </MainColumn>

          <SidebarColumn>
            <Sidebar>
              <SidebarTitle>Campaign Library</SidebarTitle>
              <Tabs>
                <TabGroup>
                  <TabButton
                    active={sidebarTab === 'inMonth'}
                    onClick={() => setSidebarTab('inMonth')}
                  >
                    In Calendar
                  </TabButton>
                  <TabButton
                    active={sidebarTab === 'unused'}
                    onClick={() => setSidebarTab('unused')}
                  >
                    Unused
                  </TabButton>
                </TabGroup>
              </Tabs>

              <SidebarList>
                {(sidebarTab === 'inMonth' ? selectedDateContent : unusedContent).map(item => (
                  <ContentCard
                    key={item.id}
                    draggable={sidebarTab === 'unused'}
                    onDragStart={() => handleDragStart(item.id)}
                    onDragEnd={handleDragEnd}
                    isHighlighted={isItemHighlighted(item)}
                    color={item.color}
                    onClick={() => jumpToItemDate(item)}
                    title={item.sendDate ? 'Jump to date on calendar' : 'Not scheduled yet'}
                  >
                    <CardHeader>
                      <CardTitle>{item.title}</CardTitle>
                    </CardHeader>
                    <CardMeta>
                      {item.sendDate && (
                        <>
                          <div>Next date: {item.sendDate}</div>
                          {item.sendTime && <div>Time: {item.sendTime}</div>}
                        </>
                      )}
                      <div>Interval: {item.recurrence}</div>
                      <PlatformRow>
                        <PlatformText>Platforms:</PlatformText>
                        {(item.platforms || []).map((platform) => renderPlatformChip(platform, `card-${item.id}`))}
                      </PlatformRow>
                    </CardMeta>
                    <CardFooter>
                      <ViewButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingItem(item);
                        }}
                        title="View details"
                        aria-label="View item details"
                      >
                        👁
                      </ViewButton>

                      {sidebarTab === 'inMonth' && (
                        <DangerSquareButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromCalendar(item);
                          }}
                          title="Remove from calendar"
                          aria-label="Remove from calendar"
                        >
                          -
                        </DangerSquareButton>
                      )}

                      {sidebarTab === 'unused' && (
                        <DangerSquareButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCampaign(item);
                          }}
                          title="Delete campaign"
                          aria-label="Delete campaign"
                        >
                          🗑
                        </DangerSquareButton>
                      )}
                    </CardFooter>
                  </ContentCard>
                ))}
              </SidebarList>
            </Sidebar>
          </SidebarColumn>
        </Layout>
      </Container>

      {showModal && (
        <ModalBackdrop onClick={() => setShowModal(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <ModalTitle>{isEditMode ? 'Edit Content Schedule' : 'Create Content Schedule'}</ModalTitle>

            <FormGrid>
              <FormGroup>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Content name"
                />
              </FormGroup>

              {modalMode === 'calendar' && (
                <FormGroup>
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </FormGroup>
              )}

              {modalMode === 'calendar' && (
                <FormGroup>
                  <Label>Time of day</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </FormGroup>
              )}

              <FormGroup>
                <Label>Interval</Label>
                <Select
                  value={formData.interval}
                  onChange={e => setFormData({ ...formData, interval: e.target.value })}
                >
                  <option value="once">Once</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </FormGroup>

              {modalMode === 'calendar' && (
                <FormGroup>
                  <Label>End date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </FormGroup>
              )}

              <FormGroup>
                <Label>Platforms</Label>
                <CheckboxRow>
                  {platformOptions.map((platform) => (
                    <CheckboxLabel key={platform.value}>
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform.value)}
                        onChange={() => togglePlatform(platform.value)}
                      />
                      <PlatformOptionText>
                        {renderPlatformChip(platform.value, 'modal')}
                        <span>{platform.label}</span>
                      </PlatformOptionText>
                    </CheckboxLabel>
                  ))}
                </CheckboxRow>
              </FormGroup>

              <FormGroup>
                <Label>Cost</Label>
                <Input
                  type="number"
                  value={formData.cost}
                  onChange={e => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0"
                />
              </FormGroup>
            </FormGrid>

            <FormGroup style={{ marginTop: '1rem' }}>
              <Label>Color</Label>
              <ColorPicker>
                {colorOptions.map(color => (
                  <ColorOption
                    key={color}
                    color={color}
                    selected={formData.color === color}
                    onClick={() => setFormData({ ...formData, color })}
                    type="button"
                  />
                ))}
              </ColorPicker>
            </FormGroup>

            <ModalActions>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave}>{isEditMode ? 'Save' : 'Create'}</Button>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}

      {showTimeline && timelineDate && (
        <ModalBackdrop onClick={() => setShowTimeline(false)}>
          <TimelineModalCard onClick={(e) => e.stopPropagation()}>
            <TimelineHeader>
              <TimelineTitle>
                Timeline • {timelineDate.toLocaleDateString()}
              </TimelineTitle>
              <Button variant="secondary" onClick={() => setShowTimeline(false)}>Close</Button>
            </TimelineHeader>

            <TimelineBody>
              <TimelineGrid>
                {Array.from({ length: 24 }).map((_, h) => (
                  <HourRow key={h}>
                    <HourLabel>{formatHour(h)}</HourLabel>
                    <QuarterLine />
                  </HourRow>
                ))}

                {timelineEvents.map(item => {
                  const mins = getMinutes(item.sendTime);
                  return (
                    <TimelineEventCard
                      key={item.id}
                      color={item.color}
                      style={{ top: `${mins + 10}px` }}
                      onClick={() => setViewingItem(item)}
                    >
                      <TimelineEventTop>
                        <span>{(item.sendTime || '00:00')} • {item.title}</span>
                        <TimelinePlatformRow>
                          {(item.platforms || []).map((platform) => renderPlatformChip(platform, `timeline-${item.id}`))}
                        </TimelinePlatformRow>
                      </TimelineEventTop>
                    </TimelineEventCard>
                  );
                })}

                <TimelineEndLabel>{formatHour(0)}</TimelineEndLabel>
              </TimelineGrid>
            </TimelineBody>
          </TimelineModalCard>
        </ModalBackdrop>
      )}

      {detailItem && (
        <ModalBackdrop onClick={() => setDetailItem(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{detailItem.title}</ModalTitle>

            <DetailGrid>
              <DetailItem><strong>Date:</strong> {timelineDate ? timelineDate.toLocaleDateString() : (detailItem.sendDate || '-')}</DetailItem>
              <DetailItem><strong>Time:</strong> {detailItem.sendTime || '-'}</DetailItem>
              <DetailItem><strong>Interval:</strong> {detailItem.recurrence || '-'}</DetailItem>
              <DetailItem><strong>End date:</strong> {detailItem.endDate || '-'}</DetailItem>
              <DetailItem><strong>Platforms:</strong> {(detailItem.platforms || []).join(', ') || '-'}</DetailItem>
              <DetailItem><strong>Cost:</strong> {detailItem.cost ? `$${detailItem.cost}` : '-'}</DetailItem>
              <DetailItem>
                <strong>Color:</strong>
                <ColorSwatch color={detailItem.color} />
              </DetailItem>
            </DetailGrid>

            <ModalActions>
              <Button variant="secondary" onClick={() => setDetailItem(null)}>Close</Button>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}

      {viewingItem && (
        <ModalBackdrop onClick={() => setViewingItem(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto'}}>
            <ModalTitle>{viewingItem.title}</ModalTitle>

            <DetailGrid>
              {/* Campaign Data (if linked) */}
              {viewingItem._campaign && (
                <>
                  <DetailItem><strong>Campaign ID:</strong> {viewingItem._campaign.id}</DetailItem>
                  {viewingItem._campaign.status && <DetailItem><strong>Status:</strong> <span style={{textTransform: 'capitalize', color: viewingItem._campaign.status === 'active' ? '#00C896' : '#DAA520'}}>{viewingItem._campaign.status}</span></DetailItem>}
                  {viewingItem._campaign.version && <DetailItem><strong>Version:</strong> {viewingItem._campaign.version}</DetailItem>}
                  
                  <hr style={{gridColumn: '1 / -1', border: 'none', borderTop: '1px solid #e5e5e5', margin: '0.5rem 0'}} />
                  
                  {/* Affiliate Product */}
                  {viewingItem._campaign.affiliate_product && <DetailItem><strong>Affiliate Product</strong></DetailItem>}
                  {viewingItem._campaign.affiliate_product?.product_id && <DetailItem style={{paddingLeft: '1rem'}}><strong>Product ID:</strong> {viewingItem._campaign.affiliate_product.product_id}</DetailItem>}
                  {viewingItem._campaign.affiliate_product?.offer_name && <DetailItem style={{paddingLeft: '1rem'}}><strong>Offer:</strong> {viewingItem._campaign.affiliate_product.offer_name}</DetailItem>}
                  {viewingItem._campaign.affiliate_product?.vendor && <DetailItem style={{paddingLeft: '1rem'}}><strong>Vendor:</strong> {viewingItem._campaign.affiliate_product.vendor}</DetailItem>}
                  {viewingItem._campaign.affiliate_product?.hoplink && <DetailItem style={{paddingLeft: '1rem', wordBreak: 'break-all'}}><strong>Hoplink:</strong> {viewingItem._campaign.affiliate_product.hoplink}</DetailItem>}
                  
                  <hr style={{gridColumn: '1 / -1', border: 'none', borderTop: '1px solid #e5e5e5', margin: '0.5rem 0'}} />
                  
                  {/* Audience */}
                  {viewingItem._campaign.audience && Object.keys(viewingItem._campaign.audience).length > 0 && <DetailItem><strong>Audience</strong></DetailItem>}
                  {viewingItem._campaign.audience?.demographics && <DetailItem style={{paddingLeft: '1rem'}}><strong>Demographics:</strong> {JSON.stringify(viewingItem._campaign.audience.demographics)}</DetailItem>}
                  {viewingItem._campaign.audience?.interests && <DetailItem style={{paddingLeft: '1rem'}}><strong>Interests:</strong> {Array.isArray(viewingItem._campaign.audience.interests) ? viewingItem._campaign.audience.interests.join(', ') : viewingItem._campaign.audience.interests}</DetailItem>}
                  {viewingItem._campaign.audience?.behaviors && <DetailItem style={{paddingLeft: '1rem'}}><strong>Behaviors:</strong> {Array.isArray(viewingItem._campaign.audience.behaviors) ? viewingItem._campaign.audience.behaviors.join(', ') : viewingItem._campaign.audience.behaviors}</DetailItem>}
                  
                  {viewingItem._campaign.audience && Object.keys(viewingItem._campaign.audience).length > 0 && <hr style={{gridColumn: '1 / -1', border: 'none', borderTop: '1px solid #e5e5e5', margin: '0.5rem 0'}} />}
                  
                  
                  {/* Content Pieces */}
                  {viewingItem._campaign.content_pieces && viewingItem._campaign.content_pieces.length > 0 && <DetailItem><strong>Content Pieces ({viewingItem._campaign.content_pieces.length})</strong></DetailItem>}
                  {viewingItem._campaign.content_pieces && viewingItem._campaign.content_pieces.length > 0 && viewingItem._campaign.content_pieces.map((piece, idx) => (
                    <DetailItem key={idx} style={{paddingLeft: '1rem', fontSize: '0.9rem'}}>
                      <strong>Piece {idx + 1}:</strong><br />
                      {piece.copy?.caption && <div>Caption: {piece.copy.caption.substring(0, 80)}...</div>}
                      {piece.copy?.body && <div>Body: {piece.copy.body.substring(0, 80)}...</div>}
                      {piece.platform && <div>Platform: {piece.platform}</div>}
                    </DetailItem>
                  ))}
                  
                  {viewingItem._campaign.content_pieces && viewingItem._campaign.content_pieces.length > 0 && <hr style={{gridColumn: '1 / -1', border: 'none', borderTop: '1px solid #e5e5e5', margin: '0.5rem 0'}} />}
                  
                  {/* Tags */}
                  {viewingItem._campaign.tags && viewingItem._campaign.tags.length > 0 && <DetailItem><strong>Tags:</strong> {viewingItem._campaign.tags.join(', ')}</DetailItem>}
                  
                  {/* Notes */}
                  {viewingItem._campaign.notes && <DetailItem><strong>Notes:</strong> {viewingItem._campaign.notes}</DetailItem>}
                  
                  <hr style={{gridColumn: '1 / -1', border: 'none', borderTop: '1px solid #e5e5e5', margin: '0.5rem 0'}} />
                </>
              )}
              
              {/* Scheduler-specific data */}
              <DetailItem><strong>Scheduling</strong></DetailItem>
              {viewingItem.sendDate && <DetailItem style={{paddingLeft: '1rem'}}><strong>Start Date:</strong> {viewingItem.sendDate}</DetailItem>}
              {viewingItem.sendTime && <DetailItem style={{paddingLeft: '1rem'}}><strong>Send Time:</strong> {viewingItem.sendTime}</DetailItem>}
              {viewingItem.recurrence && <DetailItem style={{paddingLeft: '1rem'}}><strong>Recurrence:</strong> {viewingItem.recurrence}</DetailItem>}
              {viewingItem.endDate && <DetailItem style={{paddingLeft: '1rem'}}><strong>End Date:</strong> {viewingItem.endDate}</DetailItem>}
              
              <hr style={{gridColumn: '1 / -1', border: 'none', borderTop: '1px solid #e5e5e5', margin: '0.5rem 0'}} />
              
              <DetailItem><strong>Distribution</strong></DetailItem>
              <DetailItem style={{paddingLeft: '1rem'}}>
                <strong>Platforms:</strong>
                <PlatformRow>
                  {(viewingItem.platforms || []).length > 0 ? (
                    (viewingItem.platforms || []).map((platform) => renderPlatformChip(platform, `detail-${viewingItem.id}`))
                  ) : (
                    <span>-</span>
                  )}
                </PlatformRow>
              </DetailItem>
              {viewingItem.cost && <DetailItem style={{paddingLeft: '1rem'}}><strong>Budget:</strong> ${viewingItem.cost}</DetailItem>}
              
              <hr style={{gridColumn: '1 / -1', border: 'none', borderTop: '1px solid #e5e5e5', margin: '0.5rem 0'}} />
              
              <DetailItem style={{paddingLeft: '1rem'}}>
                <strong>Color:</strong>
                <ColorSwatch color={viewingItem.color} />
              </DetailItem>
              
              <hr style={{gridColumn: '1 / -1', border: 'none', borderTop: '1px solid #e5e5e5', margin: '0.5rem 0'}} />
              
              <DetailItem><strong>Created:</strong> {new Date(viewingItem._raw?.created_at || viewingItem.created_at || new Date()).toLocaleString()}</DetailItem>
              {viewingItem._raw?.updated_at && <DetailItem><strong>Updated:</strong> {new Date(viewingItem._raw.updated_at).toLocaleString()}</DetailItem>}
            </DetailGrid>

            <ModalActions>
              <Button variant="secondary" onClick={() => setViewingItem(null)}>Close</Button>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}
    </PageContainer>
  );
}