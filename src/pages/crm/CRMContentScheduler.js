import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { crm as C } from '../../styles/crmTheme';
import {
  deleteCampaignRecord,
  listContentForScheduler,
  mapSchedulerCardToCampaignPayload,
  updateCampaignRecord,
} from '../../services/contentSchedulerRepository';

const HOUR_SLOT_HEIGHT = 58;
const TIMELINE_HEADER_HEIGHT = 78;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RECURRENCE_OPTIONS = ['once', 'weekly', 'biweekly', 'monthly'];

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(18px); }
  to { opacity: 1; transform: translateX(0); }
`;

function startOfWeekMonday(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const mondayOffset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - mondayOffset);
  return copy;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isSameDay(left, right) {
  return left && right && left.toDateString() === right.toDateString();
}

function isWithinWeek(date, weekStart) {
  if (!date) return false;
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

function toDateValue(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function parseCampaignDateTime(item) {
  if (!item?.sendDate) return null;
  const timeValue = item.sendTime || '09:00';
  const iso = `${item.sendDate}T${timeValue}:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(dateValue) {
  if (!dateValue) return '—';
  const date = fromDateValue(dateValue);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDisplayTime(timeValue) {
  if (!timeValue) return '—';
  const [rawHour, rawMinute] = timeValue.split(':').map(Number);
  const hour = Number.isFinite(rawHour) ? rawHour : 0;
  const minute = Number.isFinite(rawMinute) ? rawMinute : 0;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function formatClockLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatHeaderDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatCardTime(item) {
  return item?.sendTime ? formatDisplayTime(item.sendTime) : '—';
}

function getOccurrenceDatesForWeek(item, weekStart) {
  const publishAt = parseCampaignDateTime(item);
  if (!publishAt) return [];

  const recurrence = item?.recurrence || 'once';
  const originalDay = new Date(publishAt);
  originalDay.setHours(0, 0, 0, 0);
  const occurrences = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addDays(weekStart, offset);
    candidate.setHours(0, 0, 0, 0);

    if (candidate < originalDay) continue;

    const diffDays = Math.floor((candidate.getTime() - originalDay.getTime()) / 86400000);

    if (recurrence === 'once' && isSameDay(candidate, originalDay)) {
      occurrences.push(candidate);
      continue;
    }

    if (recurrence === 'weekly' && diffDays % 7 === 0 && candidate.getDay() === originalDay.getDay()) {
      occurrences.push(candidate);
      continue;
    }

    if (recurrence === 'biweekly' && diffDays % 14 === 0 && candidate.getDay() === originalDay.getDay()) {
      occurrences.push(candidate);
      continue;
    }

    if (recurrence === 'monthly' && candidate.getDate() === originalDay.getDate()) {
      occurrences.push(candidate);
    }
  }

  return occurrences;
}

function buildScheduledDraft(item) {
  return {
    publishDate: item?.sendDate || '',
    publishTime: item?.sendTime || '09:00',
    recurrence: item?.recurrence || 'once',
    endDate: item?.endDate || '',
  };
}

function getCampaignOfferName(item) {
  return item?._campaign?.affiliate_product?.offer_name || '—';
}

function getCampaignPlatforms(item) {
  return Array.isArray(item?._campaign?.platforms) ? item._campaign.platforms : (Array.isArray(item?.platforms) ? item.platforms : []);
}

function getCampaignTags(item) {
  const rawTags = item?._campaign?.tags;
  return Array.isArray(rawTags) ? rawTags.filter(Boolean) : [];
}

function getCampaignNotes(item) {
  return item?._campaign?.notes || '';
}

function getCampaignColor(item) {
  return item?.color || item?._campaign?.theme_color || C.accent;
}

function buildSlotsForWeek(weekStart) {
  return DAYS.map((dayLabel, index) => {
    const date = addDays(weekStart, index);
    return {
      dayLabel,
      date,
      key: toDateValue(date),
    };
  });
}

function getCampaignDateTimeKey(item) {
  const dateTime = parseCampaignDateTime(item);
  if (!dateTime) return null;
  return `${toDateValue(dateTime)}-${dateTime.getHours()}`;
}

function getWeekDateByKey(weekStart, dateKey) {
  const target = fromDateValue(dateKey);
  if (target) return target;
  return weekStart;
}

const Page = styled.div`
  min-height: 100vh;
  padding: 20px;
  color: ${C.text};
  background:
    radial-gradient(circle at top left, rgba(0, 200, 150, 0.12), transparent 34%),
    radial-gradient(circle at top right, rgba(139, 92, 246, 0.08), transparent 26%),
    ${C.bg};
  animation: ${fadeIn} 0.22s ease;
`;

const PageInner = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

const TitleBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const MonthYearDisplay = styled.div`
  flex: 1;
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${C.text};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-left: auto;
  flex-shrink: 0;
`;

const BaseButton = styled.button`
  border: 1px solid ${C.borderLight};
  background: ${C.card};
  color: ${C.text};
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, opacity 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${C.accent};
    background: ${C.surfaceAlt};
  }
`;

const TodayButton = styled(BaseButton)`
  background: ${C.accent};
  color: ${C.bg};
  border-color: ${C.accent};

  &:hover {
    background: ${C.accentHover};
    border-color: ${C.accentHover};
    color: ${C.bg};
  }
`;

const DateJumpButton = styled(BaseButton)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const DateJumpWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const DatePopover = styled.div`
  position: fixed;
  top: ${props => `${props.$top || 0}px`};
  left: ${props => `${props.$left || 0}px`};
  z-index: 30;
  min-width: 220px;
  border: 1px solid ${C.border};
  border-radius: 12px;
  background: ${C.card};
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.28);
  padding: 10px;
`;

const DatePopoverInput = styled.input`
  width: 100%;
  border: 1px solid ${C.borderLight};
  background: ${C.surface};
  color: ${C.text};
  border-radius: 10px;
  padding: 9px 10px;
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: ${C.accent};
  }
`;

const NavButton = styled(BaseButton)`
  width: 42px;
  height: 42px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) ${props => (props.$hasPanel ? 'minmax(0, 380px)' : '0px')};
  gap: ${props => (props.$hasPanel ? '16px' : '0')};
  align-items: start;
  width: 100%;
`;

const TimelineShell = styled.section`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const TimelineCard = styled.div`
  border: 1px solid ${C.border};
  border-radius: 18px;
  background: ${C.card};
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
  overflow: hidden;
`;

const TimelineScroll = styled.div`
  max-height: 74vh;
  overflow: auto;
  position: relative;
  scrollbar-color: ${C.borderLight} ${C.surface};
`;

const TimelineGrid = styled.div`
  display: grid;
  grid-template-columns: 74px repeat(7, minmax(0, 1fr));
  min-width: 1000px;
`;

const TimelineCorner = styled.div`
  position: sticky;
  top: 0;
  z-index: 4;
  background: ${C.surface};
  border-bottom: 1px solid ${C.border};
  min-height: ${TIMELINE_HEADER_HEIGHT}px;
`;

const DayHeader = styled.button`
  position: sticky;
  top: 0;
  z-index: 4;
  background: ${props => (props.$today ? C.accentBg : C.surface)};
  border: none;
  border-bottom: 1px solid ${C.border};
  border-left: 1px solid ${C.border};
  min-height: ${TIMELINE_HEADER_HEIGHT}px;
  padding: 12px 10px;
  text-align: left;
  color: ${C.text};
  cursor: pointer;
  transition: background 0.16s ease, box-shadow 0.16s ease;

  &:hover {
    background: ${C.surfaceAlt};
  }

  ${({ $selected }) => $selected && `box-shadow: inset 0 -2px 0 ${C.accent};`}
`;

const DayHeaderLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${C.muted};
  margin-bottom: 4px;
`;

const DayHeaderDate = styled.div`
  font-size: 15px;
  font-weight: 800;
`;

const HourLabel = styled.div`
  position: sticky;
  left: 0;
  z-index: 3;
  background: ${C.surface};
  border-right: 1px solid ${C.border};
  border-bottom: 1px solid ${C.border};
  min-height: ${HOUR_SLOT_HEIGHT}px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 8px 10px 0 0;
  font-size: 12px;
  color: ${C.muted};
  font-variant-numeric: tabular-nums;
`;

const HourCell = styled.div`
  border-left: 1px solid ${C.border};
  border-bottom: 1px solid ${C.border};
  min-height: ${HOUR_SLOT_HEIGHT}px;
  padding: 6px;
  background: ${props => {
    if (props.$today) return C.accentBg;
    if (props.$dropTarget) return 'rgba(0, 200, 150, 0.14)';
    return C.card;
  }};
  transition: background 0.14s ease, box-shadow 0.14s ease;

  &:hover {
    background: ${props => (props.$today ? 'rgba(0, 200, 150, 0.13)' : C.surfaceAlt)};
  }
`;

const HourCellInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: ${HOUR_SLOT_HEIGHT - 12}px;
`;

const TimelineEventCard = styled.button`
  width: 100%;
  min-height: 34px;
  border: 1px solid ${C.borderLight};
  border-left: 4px solid ${props => props.$color || C.accent};
  background: ${C.surfaceAlt};
  color: ${C.text};
  border-radius: 10px;
  padding: 7px 9px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${C.accent};
    background: ${C.cardHover};
  }
`;

const TimelineEventName = styled.div`
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TimelineEventTime = styled.div`
  font-size: 10px;
  color: ${C.muted};
  font-variant-numeric: tabular-nums;
`;

const TimelineFootnote = styled.div`
  font-size: 12px;
  color: ${C.muted};
`;

const LibrarySection = styled.section`
  border: 1px solid ${C.border};
  border-radius: 18px;
  background: ${C.card};
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 48vh;
  min-height: 320px;
  overflow: hidden;
`;

const LibraryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
`;

const TabRow = styled.div`
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  background: ${C.surface};
  border: 1px solid ${C.border};
`;

const TabButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 9px 14px;
  background: ${props => (props.$active ? C.accent : 'transparent')};
  color: ${props => (props.$active ? C.bg : C.muted)};
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;

  &:hover {
    color: ${props => (props.$active ? C.bg : C.text)};
  }
`;

const LibraryBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
`;

const LibraryEmpty = styled.div`
  grid-column: 1 / -1;
  border: 1px dashed ${C.borderLight};
  border-radius: 14px;
  padding: 24px;
  color: ${C.muted};
  text-align: center;
  background: ${C.surface};
`;

const CampaignCard = styled.div`
  border: 1px solid ${props => (props.$selected ? C.accent : C.border)};
  border-left: 4px solid ${props => props.$color || C.accent};
  border-radius: 16px;
  background: ${props => (props.$selected ? C.surfaceAlt : C.surface)};
  padding: 14px;
  cursor: ${props => (props.$draggable ? 'grab' : 'pointer')};
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    background: ${C.surfaceAlt};
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
  }
`;

const CampaignCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const CampaignCardTitle = styled.div`
  font-size: 14px;
  font-weight: 800;
  line-height: 1.25;
  margin-right: 8px;
`;

const CampaignCardMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: ${C.muted};
`;

const CampaignCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${props => (props.$status === 'Scheduled' ? C.bg : C.text)};
  background: ${props => (props.$status === 'Scheduled' ? C.success : C.borderLight)};
`;

const SmallAction = styled.button`
  border: 1px solid ${props => (props.$danger ? C.danger : C.borderLight)};
  background: transparent;
  color: ${props => (props.$danger ? C.danger : C.text)};
  border-radius: 10px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    background: ${props => (props.$danger ? C.dangerBg : C.surfaceAlt)};
    border-color: ${props => (props.$danger ? C.danger : C.accent)};
  }
`;

const PanelShell = styled.aside`
  position: sticky;
  top: 20px;
  height: calc(100vh - 40px);
  border: 1px solid ${C.border};
  border-radius: 18px;
  background: ${C.card};
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
  overflow: hidden;
  animation: ${slideIn} 0.22s ease;
`;

const PanelInner = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 0;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid ${C.borderLight};
  background: ${C.surface};
  color: ${C.text};
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const PanelBody = styled.div`
  padding: 16px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
`;

const ImagePlaceholder = styled.div`
  min-height: 170px;
  border-radius: 16px;
  border: 1px dashed ${C.borderLight};
  background: ${C.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.muted};
  font-size: 13px;
  font-weight: 700;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${C.muted};
`;

const FieldValue = styled.div`
  font-size: 13px;
  color: ${C.text};
  line-height: 1.5;
  word-break: break-word;
`;

const InlineInput = styled.input`
  width: 100%;
  border: 1px solid ${C.borderLight};
  background: ${C.surface};
  color: ${C.text};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: ${C.accent};
  }
`;

const InlineSelect = styled.select`
  width: 100%;
  border: 1px solid ${C.borderLight};
  background: ${C.surface};
  color: ${C.text};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: ${C.accent};
  }
`;

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: ${C.surface};
  border: 1px solid ${C.borderLight};
  color: ${C.text};
  font-size: 11px;
  font-weight: 700;
`;

const PanelActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid ${C.border};
  padding: 16px;
`;

const PrimaryAction = styled.button`
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  background: ${props => (props.$danger ? 'transparent' : C.accent)};
  color: ${props => (props.$danger ? C.danger : C.bg)};
  border: ${props => (props.$danger ? `1px solid ${C.danger}` : 'none')};
  transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    background: ${props => (props.$danger ? C.dangerBg : C.accentHover)};
    border-color: ${props => (props.$danger ? C.danger : C.accentHover)};
  }
`;

const SecondaryAction = styled.button`
  border: 1px solid ${C.borderLight};
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
  color: ${C.text};
  transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    background: ${C.surfaceAlt};
    border-color: ${C.accent};
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.68);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalCard = styled.div`
  width: min(520px, 100%);
  border: 1px solid ${C.border};
  border-radius: 18px;
  background: ${C.card};
  box-shadow: 0 26px 60px rgba(0, 0, 0, 0.36);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 800;
`;

const ModalHint = styled.div`
  font-size: 13px;
  color: ${C.muted};
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const ModalButton = styled.button`
  border: 1px solid ${props => (props.$secondary ? C.borderLight : C.accent)};
  background: ${props => (props.$secondary ? 'transparent' : C.accent)};
  color: ${props => (props.$secondary ? C.text : C.bg)};
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
`;

export default function CRMContentScheduler() {
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [selectedHeaderDate, setSelectedHeaderDate] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [scheduledContent, setScheduledContent] = useState([]);
  const [unusedContent, setUnusedContent] = useState([]);
  const [libraryTab, setLibraryTab] = useState('unscheduled');
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [dropPayload, setDropPayload] = useState(null);
  const [scheduleDraft, setScheduleDraft] = useState(null);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [datePopoverPos, setDatePopoverPos] = useState({ top: 0, left: 0 });
  const [draggingCampaignId, setDraggingCampaignId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const timelineScrollRef = useRef(null);
  const dateInputRef = useRef(null);
  const dateJumpWrapRef = useRef(null);

  const positionDatePopover = () => {
    const wrapEl = dateJumpWrapRef.current;
    if (!wrapEl) return;

    const rect = wrapEl.getBoundingClientRect();
    const popoverWidth = 220;
    const margin = 8;
    const nextTop = Math.round(rect.bottom + margin);
    const rightAlignedLeft = Math.round(rect.right - popoverWidth);
    const maxLeft = Math.max(margin, window.innerWidth - popoverWidth - margin);
    const nextLeft = Math.min(Math.max(margin, rightAlignedLeft), maxLeft);

    setDatePopoverPos({ top: nextTop, left: nextLeft });
  };

  const weekSlots = useMemo(() => buildSlotsForWeek(selectedWeekStart), [selectedWeekStart]);

  const monthYearLabel = useMemo(
    () => selectedWeekStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [selectedWeekStart],
  );

  const scheduledContentInSelectedWeek = useMemo(
    () => scheduledContent.filter((item) => getOccurrenceDatesForWeek(item, selectedWeekStart).length > 0),
    [scheduledContent, selectedWeekStart],
  );

  const scheduledLibraryContent = useMemo(() => {
    if (!selectedHeaderDate) {
      return scheduledContent;
    }

    const selectedWeek = startOfWeekMonday(selectedHeaderDate);
    return scheduledContent.filter((item) => getOccurrenceDatesForWeek(item, selectedWeek).length > 0);
  }, [scheduledContent, selectedHeaderDate]);

  const displayedLibraryContent = libraryTab === 'scheduled' ? scheduledLibraryContent : unusedContent;
  const panelVisible = Boolean(selectedCampaign);
  const selectedWeekText = selectedHeaderDate ? `Focused week: ${startOfWeekMonday(selectedHeaderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Showing all scheduled campaigns';

  async function refreshContent({ retainSelectedId = null } = {}) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const items = await listContentForScheduler();
      const rows = Array.isArray(items) ? items : Array.isArray(items?.items) ? items.items : [];
      const normalizedRows = rows.map((item) => ({
        ...item,
        color: item?.color || item?._campaign?.theme_color || C.accent,
      }));

      setScheduledContent(normalizedRows.filter((item) => item.isUsed));
      setUnusedContent(normalizedRows.filter((item) => !item.isUsed));

      if (retainSelectedId) {
        const refreshed = normalizedRows.find((item) => String(item.id) === String(retainSelectedId)) || null;
        setSelectedCampaign(refreshed);
        setIsEditing(false);
        setEditDraft(refreshed ? buildScheduledDraft(refreshed) : null);
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to load scheduled campaigns');
      setScheduledContent([]);
      setUnusedContent([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshContent();
  }, []);

  useEffect(() => {
    if (!panelVisible) {
      setIsEditing(false);
      setEditDraft(null);
      return;
    }

    setIsEditing(false);
    setEditDraft(buildScheduledDraft(selectedCampaign));
  }, [selectedCampaign?.id, panelVisible]);

  useEffect(() => {
    if (!timelineScrollRef.current) return;

    const currentWeek = startOfWeekMonday(new Date());
    if (currentWeek.toDateString() !== selectedWeekStart.toDateString()) {
      return;
    }

    const targetHour = new Date().getHours();
    const top = Math.max((targetHour * HOUR_SLOT_HEIGHT) - 120, 0);

    const handle = window.requestAnimationFrame(() => {
      timelineScrollRef.current?.scrollTo({ top, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(handle);
  }, [selectedWeekStart, scheduledContentInSelectedWeek.length]);

  useEffect(() => {
    if (!isDatePopoverOpen) return;

    const handleOutsideMouseDown = (event) => {
      if (!dateJumpWrapRef.current) return;
      if (!dateJumpWrapRef.current.contains(event.target)) {
        setIsDatePopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, [isDatePopoverOpen]);

  useEffect(() => {
    if (!isDatePopoverOpen) return;

    const reposition = () => positionDatePopover();
    positionDatePopover();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [isDatePopoverOpen]);

  useEffect(() => {
    if (!isDatePopoverOpen) return;

    const input = dateInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        input.focus();
      }
      return;
    }

    input.focus();
  }, [isDatePopoverOpen]);

  const navigateWeek = (delta) => {
    setSelectedWeekStart((current) => addDays(current, delta * 7));
    setSelectedHeaderDate(null);
  };

  const jumpToToday = () => {
    setSelectedWeekStart(startOfWeekMonday(new Date()));
    setSelectedHeaderDate(null);
  };

  const openDatePicker = () => {
    positionDatePopover();
    setIsDatePopoverOpen((current) => !current);
  };

  const handleDatePickerChange = (event) => {
    const selected = fromDateValue(event.target.value);
    if (!selected) return;
    setSelectedWeekStart(startOfWeekMonday(selected));
    setSelectedHeaderDate(selected);
    setIsDatePopoverOpen(false);
  };

  const openCampaignPanel = (item) => {
    setSelectedCampaign(item);
    setIsEditing(false);
  };

  const handleLibraryDragStart = (event, item) => {
    setDraggingCampaignId(item.id);
    try {
      event.dataTransfer.setData('application/json', JSON.stringify({ campaignId: item.id }));
      event.dataTransfer.effectAllowed = 'move';
    } catch {
      // no-op: dataTransfer is available in the drop handler in all supported browsers
    }
  };

  const handleLibraryDragEnd = () => {
    setDraggingCampaignId(null);
  };

  const handleCellDragOver = (event, date, hour) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget({ dateKey: toDateValue(date), hour });
  };

  const handleCellDragEnter = (date, hour) => {
    setDropTarget({ dateKey: toDateValue(date), hour });
  };

  const handleCellDragLeave = (event, date, hour) => {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
      return;
    }

    setDropTarget((current) => {
      if (!current) return null;
      return current.dateKey === toDateValue(date) && current.hour === hour ? null : current;
    });
  };

  const handleTimelineDrop = (event, date, hour) => {
    event.preventDefault();

    let draggedCampaign = null;

    try {
      const raw = event.dataTransfer.getData('application/json');
      const parsed = raw ? JSON.parse(raw) : null;
      const campaignId = parsed?.campaignId || draggingCampaignId;
      draggedCampaign = unusedContent.find((item) => String(item.id) === String(campaignId)) || null;
    } catch {
      draggedCampaign = unusedContent.find((item) => String(item.id) === String(draggingCampaignId)) || null;
    }

    setDropTarget(null);
    setDraggingCampaignId(null);

    if (!draggedCampaign) {
      return;
    }

    setDropPayload({
      campaign: draggedCampaign,
      dateKey: toDateValue(date),
      hour,
    });
    setScheduleDraft({
      publishDate: toDateValue(date),
      publishTime: `${String(hour).padStart(2, '0')}:00`,
      recurrence: draggedCampaign.recurrence || 'once',
      endDate: draggedCampaign.endDate || '',
    });
    setShowScheduleModal(true);
  };

  const handleScheduleConfirm = async () => {
    if (!dropPayload?.campaign) return;

    const nextDraft = scheduleDraft || {
      publishDate: dropPayload.dateKey,
      publishTime: `${String(dropPayload.hour).padStart(2, '0')}:00`,
      recurrence: dropPayload.campaign.recurrence || 'once',
      endDate: dropPayload.campaign.endDate || '',
    };

    setErrorMessage('');

    try {
      const payload = mapSchedulerCardToCampaignPayload(
        {
          ...dropPayload.campaign,
          sendDate: nextDraft.publishDate,
          sendTime: nextDraft.publishTime,
          recurrence: nextDraft.recurrence,
          endDate: nextDraft.endDate,
          color: dropPayload.campaign.color || C.accent,
        },
        {
          campaignId: dropPayload.campaign.id,
          used: true,
          startDate: nextDraft.publishDate,
          endDate: nextDraft.endDate || '',
        },
      );

      await updateCampaignRecord(dropPayload.campaign.id, payload);
      await refreshContent({ retainSelectedId: dropPayload.campaign.id });
      setSelectedHeaderDate(fromDateValue(nextDraft.publishDate));
      setShowScheduleModal(false);
      setDropPayload(null);
      setScheduleDraft(null);
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to schedule campaign');
    }
  };

  const handleRemoveFromSchedule = async () => {
    if (!selectedCampaign) return;

    setErrorMessage('');

    try {
      const payload = mapSchedulerCardToCampaignPayload(selectedCampaign, {
        campaignId: selectedCampaign.id,
        used: false,
        startDate: '',
        endDate: '',
      });

      await updateCampaignRecord(selectedCampaign.id, payload);
      await refreshContent({ retainSelectedId: selectedCampaign.id });
      setSelectedCampaign((current) => current ? { ...current, isUsed: false, sendDate: '', sendTime: '', recurrence: current.recurrence || 'once', endDate: '' } : current);
      setIsEditing(false);
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to remove campaign from schedule');
    }
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;

    const confirmed = window.confirm(`Delete "${selectedCampaign.title}" permanently? This cannot be undone.`);
    if (!confirmed) return;

    setErrorMessage('');

    try {
      await deleteCampaignRecord(selectedCampaign.id);
      await refreshContent();
      setSelectedCampaign(null);
      setIsEditing(false);
      setEditDraft(null);
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to delete campaign');
    }
  };

  const beginEdit = () => {
    if (!selectedCampaign) return;
    setEditDraft(buildScheduledDraft(selectedCampaign));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditDraft(buildScheduledDraft(selectedCampaign));
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!selectedCampaign) return;

    const draft = editDraft || buildScheduledDraft(selectedCampaign);
    const nextCampaign = {
      ...selectedCampaign,
      sendDate: draft.publishDate,
      sendTime: draft.publishTime,
      recurrence: draft.recurrence,
      endDate: draft.endDate,
    };

    setErrorMessage('');

    try {
      const payload = mapSchedulerCardToCampaignPayload(nextCampaign, {
        campaignId: selectedCampaign.id,
        used: Boolean(nextCampaign.sendDate),
        startDate: nextCampaign.sendDate || '',
        endDate: nextCampaign.endDate || '',
      });

      await updateCampaignRecord(selectedCampaign.id, payload);
      await refreshContent({ retainSelectedId: selectedCampaign.id });
      setIsEditing(false);
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to save campaign schedule');
    }
  };

  const timelineGroups = useMemo(() => {
    const groups = new Map();

    scheduledContentInSelectedWeek.forEach((item) => {
      const publishAt = parseCampaignDateTime(item);
      if (!publishAt) return;

      const occurrences = getOccurrenceDatesForWeek(item, selectedWeekStart);
      occurrences.forEach((occurrenceDate) => {
        const key = `${toDateValue(occurrenceDate)}-${publishAt.getHours()}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push({
          ...item,
          _occurrenceDate: occurrenceDate,
        });
      });
    });

    return groups;
  }, [scheduledContentInSelectedWeek, selectedWeekStart]);

  return (
    <Page>
      <PageInner>
        <MainGrid $hasPanel={panelVisible}>
          <TimelineShell>
            <TopBar>
              <TitleBlock>
                <PageTitle>Content Scheduler</PageTitle>
              </TitleBlock>

              <MonthYearDisplay>{monthYearLabel}</MonthYearDisplay>

              <Controls>
                <TodayButton type="button" onClick={jumpToToday}>Today</TodayButton>
                <NavButton type="button" onClick={() => navigateWeek(-1)} aria-label="Previous week">‹</NavButton>
                <NavButton type="button" onClick={() => navigateWeek(1)} aria-label="Next week">›</NavButton>
                <DateJumpWrap ref={dateJumpWrapRef}>
                  <DateJumpButton type="button" onClick={openDatePicker} aria-label="Jump to date">
                    <span aria-hidden="true">📅</span>
                    Jump to Date
                  </DateJumpButton>
                  {isDatePopoverOpen ? (
                    <DatePopover $top={datePopoverPos.top} $left={datePopoverPos.left}>
                      <DatePopoverInput
                        ref={dateInputRef}
                        type="date"
                        value={toDateValue(selectedHeaderDate || selectedWeekStart)}
                        onChange={handleDatePickerChange}
                      />
                    </DatePopover>
                  ) : null}
                </DateJumpWrap>
              </Controls>
            </TopBar>

            {errorMessage ? <TimelineFootnote>{errorMessage}</TimelineFootnote> : null}

            <TimelineCard>
              <TimelineScroll ref={timelineScrollRef}>
                <TimelineGrid>
                  <TimelineCorner />
                  {weekSlots.map((slot) => {
                    const today = isSameDay(slot.date, new Date());
                    const selected = selectedHeaderDate ? isSameDay(slot.date, selectedHeaderDate) : false;

                    return (
                      <DayHeader
                        key={slot.key}
                        type="button"
                        $today={today}
                        $selected={selected}
                        onClick={() => setSelectedHeaderDate(selected ? null : slot.date)}
                      >
                        <DayHeaderLabel>{slot.dayLabel}</DayHeaderLabel>
                        <DayHeaderDate>{formatHeaderDate(slot.date)}</DayHeaderDate>
                      </DayHeader>
                    );
                  })}

                  {Array.from({ length: 24 }, (_, hour) => {
                    const rowKey = `row-${hour}`;

                    return (
                      <Fragment key={rowKey}>
                        <HourLabel key={`${rowKey}-label`}>{formatClockLabel(hour)}</HourLabel>
                        {weekSlots.map((slot) => {
                          const today = isSameDay(slot.date, new Date());
                          const cellKey = `${slot.key}-${hour}`;
                          const dropActive = dropTarget?.dateKey === slot.key && dropTarget?.hour === hour;
                          const events = timelineGroups.get(cellKey) || [];

                          return (
                            <HourCell
                              key={cellKey}
                              $today={today}
                              $dropTarget={dropActive}
                              onDragOver={(event) => handleCellDragOver(event, slot.date, hour)}
                              onDragEnter={() => handleCellDragEnter(slot.date, hour)}
                              onDragLeave={(event) => handleCellDragLeave(event, slot.date, hour)}
                              onDrop={(event) => handleTimelineDrop(event, slot.date, hour)}
                            >
                              <HourCellInner>
                                {events.map((item) => (
                                  <TimelineEventCard
                                    key={item.id}
                                    type="button"
                                    $color={getCampaignColor(item)}
                                    onClick={() => openCampaignPanel(item)}
                                  >
                                    <TimelineEventName>{item.title}</TimelineEventName>
                                    <TimelineEventTime>{formatCardTime(item)}</TimelineEventTime>
                                  </TimelineEventCard>
                                ))}
                              </HourCellInner>
                            </HourCell>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </TimelineGrid>
              </TimelineScroll>
            </TimelineCard>

            <TimelineFootnote>
              Drag unused campaigns from the library onto any hour cell to schedule them. Click a day header to focus the scheduled library on that week.
            </TimelineFootnote>

            <LibrarySection>
              <LibraryHeader>
                <SectionTitle>Campaign Library</SectionTitle>
                <TabRow>
                  <TabButton type="button" $active={libraryTab === 'scheduled'} onClick={() => setLibraryTab('scheduled')}>
                    Scheduled
                  </TabButton>
                  <TabButton type="button" $active={libraryTab === 'unscheduled'} onClick={() => setLibraryTab('unscheduled')}>
                    Unscheduled
                  </TabButton>
                </TabRow>
              </LibraryHeader>

              <TimelineFootnote>{selectedWeekText}</TimelineFootnote>

              {isLoading ? (
                <LibraryEmpty>Loading campaigns…</LibraryEmpty>
              ) : (
                <LibraryBody>
                  {displayedLibraryContent.length ? displayedLibraryContent.map((item) => {
                    const scheduledAt = parseCampaignDateTime(item);
                    const isScheduled = Boolean(item.isUsed);

                    return (
                      <CampaignCard
                        key={item.id}
                        $selected={selectedCampaign?.id === item.id}
                        $color={getCampaignColor(item)}
                        $draggable={!isScheduled}
                        draggable={!isScheduled}
                        onClick={() => openCampaignPanel(item)}
                        onDragStart={isScheduled ? undefined : (event) => handleLibraryDragStart(event, item)}
                        onDragEnd={isScheduled ? undefined : handleLibraryDragEnd}
                      >
                        <CampaignCardHeader>
                          <div>
                            <CampaignCardTitle>{item.title}</CampaignCardTitle>
                            <CampaignCardMeta>
                              <span>{isScheduled ? (scheduledAt ? formatDisplayDate(item.sendDate) : 'Scheduled') : 'Unscheduled'}</span>
                              <span>{isScheduled ? formatCardTime(item) : 'Drag to timeline to schedule'}</span>
                            </CampaignCardMeta>
                          </div>
                          <StatusBadge $status={isScheduled ? 'Scheduled' : 'Draft'}>
                            {isScheduled ? 'Scheduled' : 'Draft'}
                          </StatusBadge>
                        </CampaignCardHeader>

                        <CampaignCardMeta>
                          <span>Recurrence: {item.recurrence || 'once'}</span>
                          <span>Platforms: {getCampaignPlatforms(item).join(', ') || '—'}</span>
                        </CampaignCardMeta>

                        <CampaignCardFooter>
                          <TimelineFootnote>{isScheduled ? 'Click for details' : 'Drop on a time slot'}</TimelineFootnote>
                          {!isScheduled ? <SmallAction type="button">Drag</SmallAction> : null}
                        </CampaignCardFooter>
                      </CampaignCard>
                    );
                  }) : (
                    <LibraryEmpty>
                      {libraryTab === 'scheduled'
                        ? 'No scheduled campaigns found for this view.'
                        : 'No unscheduled campaigns available.'}
                    </LibraryEmpty>
                  )}
                </LibraryBody>
              )}
            </LibrarySection>
          </TimelineShell>

          {panelVisible ? (
            <PanelShell>
              <PanelInner>
                <PanelHeader>
                  <div>
                    <PanelTitle>{selectedCampaign.title}</PanelTitle>
                    <TimelineFootnote>{selectedCampaign.isUsed ? 'Scheduled campaign' : 'Draft campaign'}</TimelineFootnote>
                  </div>
                  <CloseButton type="button" onClick={() => setSelectedCampaign(null)} aria-label="Close campaign panel">
                    ✕
                  </CloseButton>
                </PanelHeader>

                <PanelBody>
                  <ImagePlaceholder>
                    {/* Real campaign image generation would render here once the asset pipeline is available. */}
                    No image yet
                  </ImagePlaceholder>

                  <FieldGrid>
                    <Field>
                      <FieldLabel>Date</FieldLabel>
                      {isEditing ? (
                        <InlineInput
                          type="date"
                          value={editDraft?.publishDate || ''}
                          onChange={(event) => setEditDraft((current) => ({ ...current, publishDate: event.target.value }))}
                        />
                      ) : (
                        <FieldValue>{formatDisplayDate(selectedCampaign.sendDate)}</FieldValue>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel>Time</FieldLabel>
                      {isEditing ? (
                        <InlineInput
                          type="time"
                          value={editDraft?.publishTime || '09:00'}
                          onChange={(event) => setEditDraft((current) => ({ ...current, publishTime: event.target.value }))}
                        />
                      ) : (
                        <FieldValue>{formatDisplayTime(selectedCampaign.sendTime)}</FieldValue>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel>Recurrence</FieldLabel>
                      {isEditing ? (
                        <InlineSelect
                          value={editDraft?.recurrence || 'once'}
                          onChange={(event) => setEditDraft((current) => ({ ...current, recurrence: event.target.value }))}
                        >
                          {RECURRENCE_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </InlineSelect>
                      ) : (
                        <FieldValue>{selectedCampaign.recurrence || 'once'}</FieldValue>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel>End date</FieldLabel>
                      {isEditing ? (
                        <InlineInput
                          type="date"
                          value={editDraft?.endDate || ''}
                          onChange={(event) => setEditDraft((current) => ({ ...current, endDate: event.target.value }))}
                        />
                      ) : (
                        <FieldValue>{selectedCampaign.endDate ? formatDisplayDate(selectedCampaign.endDate) : '—'}</FieldValue>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel>Platforms</FieldLabel>
                      <FieldValue>{getCampaignPlatforms(selectedCampaign).join(', ') || '—'}</FieldValue>
                    </Field>

                    <Field>
                      <FieldLabel>Offer</FieldLabel>
                      <FieldValue>{getCampaignOfferName(selectedCampaign)}</FieldValue>
                    </Field>
                  </FieldGrid>

                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <FieldValue>
                      <StatusBadge $status={selectedCampaign.isUsed ? 'Scheduled' : 'Draft'}>
                        {selectedCampaign.isUsed ? 'Scheduled' : 'Draft'}
                      </StatusBadge>
                    </FieldValue>
                  </Field>

                  <Field>
                    <FieldLabel>Notes</FieldLabel>
                    <FieldValue>{getCampaignNotes(selectedCampaign) || '—'}</FieldValue>
                  </Field>

                  <Field>
                    <FieldLabel>Tags</FieldLabel>
                    <Pills>
                      {getCampaignTags(selectedCampaign).length
                        ? getCampaignTags(selectedCampaign).map((tag) => <Pill key={tag}>{tag}</Pill>)
                        : <FieldValue>—</FieldValue>}
                    </Pills>
                  </Field>
                </PanelBody>

                <PanelActions>
                  {isEditing ? (
                    <>
                      <ModalButton type="button" onClick={saveEdit}>Save</ModalButton>
                      <ModalButton type="button" $secondary onClick={cancelEdit}>Cancel</ModalButton>
                    </>
                  ) : (
                    <SecondaryAction type="button" onClick={beginEdit}>Edit</SecondaryAction>
                  )}

                  {selectedCampaign.isUsed ? (
                    <PrimaryAction type="button" $danger onClick={handleRemoveFromSchedule}>
                      Remove from Schedule
                    </PrimaryAction>
                  ) : (
                    <PrimaryAction type="button" $danger onClick={handleDeleteCampaign}>
                      Delete Campaign
                    </PrimaryAction>
                  )}
                </PanelActions>
              </PanelInner>
            </PanelShell>
          ) : null}
        </MainGrid>
      </PageInner>

      {showScheduleModal && dropPayload ? (
        <ModalBackdrop onClick={() => { setShowScheduleModal(false); setDropPayload(null); setScheduleDraft(null); }}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalTitle>Schedule Campaign</ModalTitle>
            <ModalHint>
              {dropPayload.campaign.title} will be scheduled for {formatDisplayDate(dropPayload.dateKey)}.
            </ModalHint>

            <ModalGrid>
              <Field>
                <FieldLabel>Time</FieldLabel>
                <InlineInput
                  type="time"
                  value={scheduleDraft?.publishTime || `${String(dropPayload.hour).padStart(2, '0')}:00`}
                  onChange={(event) => setScheduleDraft((current) => ({
                    ...(current || {
                      publishDate: dropPayload.dateKey,
                      publishTime: `${String(dropPayload.hour).padStart(2, '0')}:00`,
                      recurrence: dropPayload.campaign.recurrence || 'once',
                      endDate: dropPayload.campaign.endDate || '',
                    }),
                    publishTime: event.target.value,
                  }))}
                />
              </Field>

              <Field>
                <FieldLabel>Recurrence</FieldLabel>
                <InlineSelect
                  value={scheduleDraft?.recurrence || 'once'}
                  onChange={(event) => setScheduleDraft((current) => ({
                    ...(current || {
                      publishDate: dropPayload.dateKey,
                      publishTime: `${String(dropPayload.hour).padStart(2, '0')}:00`,
                      recurrence: dropPayload.campaign.recurrence || 'once',
                      endDate: dropPayload.campaign.endDate || '',
                    }),
                    recurrence: event.target.value,
                  }))}
                >
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </InlineSelect>
              </Field>

              <Field>
                <FieldLabel>End date</FieldLabel>
                <InlineInput
                  type="date"
                  value={scheduleDraft?.endDate || ''}
                  onChange={(event) => setScheduleDraft((current) => ({
                    ...(current || {
                      publishDate: dropPayload.dateKey,
                      publishTime: `${String(dropPayload.hour).padStart(2, '0')}:00`,
                      recurrence: dropPayload.campaign.recurrence || 'once',
                      endDate: dropPayload.campaign.endDate || '',
                    }),
                    endDate: event.target.value,
                  }))}
                />
              </Field>

              <Field>
                <FieldLabel>Day</FieldLabel>
                <InlineInput type="text" value={formatDisplayDate(dropPayload.dateKey)} readOnly />
              </Field>
            </ModalGrid>

            <ModalActions>
              <ModalButton type="button" $secondary onClick={() => { setShowScheduleModal(false); setDropPayload(null); setScheduleDraft(null); }}>
                Cancel
              </ModalButton>
              <ModalButton type="button" onClick={handleScheduleConfirm}>Confirm</ModalButton>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      ) : null}

    </Page>
  );
}