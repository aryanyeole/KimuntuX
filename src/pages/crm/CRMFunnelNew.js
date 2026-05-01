import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { createFunnel, generateFunnel } from '../../hooks/useFunnels';
import { formatApiError } from '../../utils/apiError';
import { crm as C } from '../../styles/crmTheme';

// ── Animations ────────────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}`;

// ── Layout ────────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 20px;
  max-width: 700px;
  margin: 0 auto;
  animation: ${fadeIn} .2s ease;
`;

const BackRow = styled.div`margin-bottom: 20px;`;
const BackBtn = styled.button`
  background: none;
  border: none;
  color: ${C.muted};
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { color: ${C.text}; }
`;

// ── Progress indicator ────────────────────────────────────────────────────────

const ProgressWrap = styled.div`margin-bottom: 32px;`;
const StepRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
`;
const StepNode = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
`;
const StepCircle = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: ${({ $done, $active }) =>
    $done ? C.accent : $active ? C.accent : C.surface};
  color: ${({ $done, $active }) =>
    $done || $active ? '#fff' : C.muted};
  border: 2px solid ${({ $done, $active }) =>
    $done || $active ? C.accent : C.border};
  transition: background .2s, border-color .2s;
`;
const StepLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${({ $active }) => $active ? C.text : C.muted};
  white-space: nowrap;
  text-align: center;
`;
const StepLine = styled.div`
  flex: 1;
  height: 2px;
  background: ${({ $done }) => $done ? C.accent : C.border};
  margin-bottom: 20px;
  transition: background .2s;
`;

const STEP_NAMES = ['Brand Basics', 'Business', 'Hero & CTA', 'Layout', 'Contact', 'Visual'];

// ── Shared form elements ──────────────────────────────────────────────────────

const StepCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 20px;
`;
const StepTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: ${C.text};
  margin: 0 0 4px 0;
`;
const StepSubtitle = styled.p`
  font-size: 13px;
  color: ${C.muted};
  margin: 0 0 24px 0;
`;

const Field = styled.div`display: flex; flex-direction: column; gap: 5px; margin-bottom: 18px;`;
const Label = styled.label`font-size: 12px; font-weight: 600; color: ${C.muted};`;
const Required = styled.span`color: ${C.danger}; margin-left: 2px;`;
const FieldInput = styled.input`
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid ${({ $err }) => $err ? C.danger : C.border};
  background: ${C.surface};
  color: ${C.text};
  font-size: 13px;
  outline: none;
  font-family: inherit;
  &:focus { border-color: ${C.accent}; }
  &::placeholder { color: ${C.muted}; }
  &:disabled { opacity: .45; cursor: not-allowed; }
`;
const FieldTextarea = styled.textarea`
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid ${({ $err }) => $err ? C.danger : C.border};
  background: ${C.surface};
  color: ${C.text};
  font-size: 13px;
  outline: none;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
  &:focus { border-color: ${C.accent}; }
  &::placeholder { color: ${C.muted}; }
`;
const FieldError = styled.div`font-size: 11px; color: ${C.danger};`;
const CharCount = styled.div`font-size: 11px; color: ${C.muted}; text-align: right;`;

// Radio buttons
const RadioGroup = styled.div`display: flex; flex-wrap: wrap; gap: 8px;`;
const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => $active ? C.accent : C.border};
  background: ${({ $active }) => $active ? C.accent + '18' : C.surface};
  color: ${({ $active }) => $active ? C.text : C.muted};
  cursor: pointer;
  font-size: 13px;
  transition: border-color .15s, background .15s;
  &:hover { border-color: ${C.accent}; color: ${C.text}; }
  input { display: none; }
`;

// ── Toggle switch ─────────────────────────────────────────────────────────────

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${C.border};
  &:last-child { border-bottom: none; }
`;
const ToggleLabel = styled.span`font-size: 13px; color: ${C.text};`;
const ToggleTrack = styled.button`
  width: 40px;
  height: 22px;
  border-radius: 999px;
  border: none;
  background: ${({ $on }) => $on ? C.accent : C.border};
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background .2s;
`;
const ToggleThumb = styled.div`
  position: absolute;
  top: 3px;
  left: ${({ $on }) => $on ? '21px' : '3px'};
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: left .2s;
`;

function Toggle({ value, onChange }) {
  return (
    <ToggleTrack $on={value} onClick={() => onChange(!value)} type="button">
      <ToggleThumb $on={value} />
    </ToggleTrack>
  );
}

// ── Selectable cards (layout style, color theme, font style) ──────────────────

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
`;
const SelectCard = styled.button`
  padding: 14px 10px;
  border-radius: 8px;
  border: 2px solid ${({ $active }) => $active ? C.accent : C.border};
  background: ${({ $active }) => $active ? C.accent + '18' : C.surface};
  color: ${({ $active }) => $active ? C.text : C.muted};
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  transition: border-color .15s, background .15s;
  &:hover { border-color: ${C.accent}; color: ${C.text}; }
`;
const CardSwatch = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  margin: 0 auto 8px;
  border: 2px solid ${C.border};
`;

// ── Chip input (key services) ─────────────────────────────────────────────────

const ChipWrap = styled.div``;
const ChipInput = styled.input`
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid ${({ $err }) => $err ? C.danger : C.border};
  background: ${C.surface};
  color: ${C.text};
  font-size: 13px;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  &:focus { border-color: ${C.accent}; }
  &::placeholder { color: ${C.muted}; }
`;
const ChipHint = styled.div`font-size: 11px; color: ${C.muted}; margin-top: 4px;`;
const ChipList = styled.div`display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;`;
const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${C.accent + '22'};
  border: 1px solid ${C.accent + '55'};
  color: ${C.text};
  font-size: 12px;
  font-weight: 600;
`;
const ChipX = styled.button`
  background: none;
  border: none;
  color: ${C.muted};
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  &:hover { color: ${C.danger}; }
`;

function ServiceChipInput({ value = [], onChange, error }) {
  const [inputVal, setInputVal] = useState('');

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputVal.trim();
      if (trimmed && value.length < 10 && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
        setInputVal('');
      }
    }
  }

  function remove(idx) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <ChipWrap>
      <ChipInput
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a service and press Enter…"
        $err={error}
      />
      <ChipHint>Press Enter to add · max 10 · {value.length}/10</ChipHint>
      {value.length > 0 && (
        <ChipList>
          {value.map((s, i) => (
            <Chip key={i}>
              {s}
              <ChipX type="button" onClick={() => remove(i)}>×</ChipX>
            </Chip>
          ))}
        </ChipList>
      )}
    </ChipWrap>
  );
}

// ── Bottom nav ────────────────────────────────────────────────────────────────

const NavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const PrevBtn = styled.button`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.text};
  font-size: 13px;
  padding: 10px 20px;
  cursor: pointer;
  &:hover { border-color: ${C.accent}; }
  &:disabled { opacity: .35; cursor: not-allowed; }
`;
const NextBtn = styled.button`
  background: ${C.accent};
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 24px;
  cursor: pointer;
  &:hover { background: ${C.accentHover}; }
  &:disabled { opacity: .35; cursor: not-allowed; }
`;
const GenerateBtn = styled.button`
  background: linear-gradient(135deg, ${C.accent}, ${C.accentDark});
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 12px 32px;
  cursor: pointer;
  &:hover { opacity: .9; }
  &:disabled { opacity: .35; cursor: not-allowed; }
`;

const SubmitError = styled.div`
  font-size: 12px;
  color: ${C.danger};
  text-align: right;
  margin-bottom: 8px;
  white-space: pre-line;
`;

// ── Review block (step 6) ─────────────────────────────────────────────────────

const ReviewCard = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 10px;
  padding: 16px;
  margin-top: 20px;
`;
const ReviewTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: ${C.muted};
  margin-bottom: 12px;
`;
const ReviewRow = styled.div`
  display: flex;
  padding: 7px 0;
  border-bottom: 1px solid ${C.border};
  &:last-child { border-bottom: none; }
`;
const ReviewLabel = styled.div`font-size: 12px; color: ${C.muted}; width: 120px; flex-shrink: 0;`;
const ReviewValue = styled.div`font-size: 13px; color: ${C.text}; flex: 1;`;

// ── Color and font options ────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Blue',        swatch: '#3b82f6' },
  { value: '#00C896', label: 'Green',       swatch: '#00C896' },
  { value: '#8b5cf6', label: 'Purple',      swatch: '#8b5cf6' },
  { value: '#f97316', label: 'Orange',      swatch: '#f97316' },
  { value: '#6b7280', label: 'Monochrome',  swatch: '#6b7280' },
  { value: 'auto',    label: 'Auto',        swatch: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' },
];

const FONT_OPTIONS = ['Sans', 'Serif', 'Display', 'Auto'];
const LAYOUT_OPTIONS = ['minimal', 'modern', 'bold', 'playful'];
const BRAND_VOICES  = ['professional', 'casual', 'luxury', 'playful', 'friendly'];
const MAIN_GOALS = [
  { value: 'consult',    label: 'Consult' },
  { value: 'buy',        label: 'Buy' },
  { value: 'signup',     label: 'Sign Up' },
  { value: 'contact',    label: 'Contact' },
  { value: 'learn_more', label: 'Learn More' },
];

const SECTION_TOGGLES = [
  { key: 'include_features',     label: 'Features' },
  { key: 'include_services',     label: 'Services' },
  { key: 'include_about',        label: 'About' },
  { key: 'include_testimonials', label: 'Testimonials' },
  { key: 'include_pricing',      label: 'Pricing' },
  { key: 'include_faq',          label: 'FAQ' },
  { key: 'include_contact',      label: 'Contact' },
];

// ── Initial wizard state ──────────────────────────────────────────────────────

const INITIAL_DATA = {
  company_name: '',
  tagline: '',
  brand_voice: 'professional',
  logo_url: null,
  short_description: '',
  about_us: '',
  industry: '',
  key_services: [],
  hero_headline: '',
  hero_subheadline: '',
  primary_cta_text: '',
  main_goal: 'signup',
  include_features: true,
  include_services: true,
  include_about: true,
  include_testimonials: false,
  include_pricing: false,
  include_faq: false,
  include_contact: true,
  layout_style: 'modern',
  contact_email: '',
  contact_phone: '',
  contact_location: '',
  instagram_url: '',
  linkedin_url: '',
  twitter_url: '',
  facebook_url: '',
  color_theme: 'auto',
  font_style: 'auto',
};

// ── Validation ────────────────────────────────────────────────────────────────

function canProceed(step, funnelTitle, data) {
  switch (step) {
    case 1: return funnelTitle.trim() !== '' && data.company_name.trim() !== '';
    case 2: return data.short_description.trim() !== '' && data.industry.trim() !== '' && data.key_services.length >= 1;
    case 3: return data.hero_headline.trim() !== '' && data.primary_cta_text.trim() !== '';
    default: return true;
  }
}

// ── Step components ───────────────────────────────────────────────────────────

function Step1({ funnelTitle, setFunnelTitle, data, update, showErrors }) {
  return (
    <StepCard>
      <StepTitle>Brand Basics</StepTitle>
      <StepSubtitle>Name your funnel and tell us about your brand identity.</StepSubtitle>

      <Field>
        <Label>Funnel title <Required>*</Required></Label>
        <FieldInput
          value={funnelTitle}
          onChange={e => setFunnelTitle(e.target.value)}
          placeholder="e.g. Summer Promo Landing Page"
          $err={showErrors && !funnelTitle.trim()}
        />
        {showErrors && !funnelTitle.trim() && <FieldError>Title is required</FieldError>}
      </Field>

      <Field>
        <Label>Company name <Required>*</Required></Label>
        <FieldInput
          value={data.company_name}
          onChange={e => update({ company_name: e.target.value })}
          placeholder="e.g. Acme Corp"
          $err={showErrors && !data.company_name.trim()}
        />
        {showErrors && !data.company_name.trim() && <FieldError>Company name is required</FieldError>}
      </Field>

      <Field>
        <Label>Tagline <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span></Label>
        <FieldInput
          value={data.tagline}
          onChange={e => update({ tagline: e.target.value })}
          placeholder="e.g. Building the future, together"
        />
      </Field>

      <Field>
        <Label>Brand voice</Label>
        <RadioGroup>
          {BRAND_VOICES.map(v => (
            <RadioOption key={v} $active={data.brand_voice === v}>
              <input type="radio" checked={data.brand_voice === v} onChange={() => update({ brand_voice: v })} />
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </RadioOption>
          ))}
        </RadioGroup>
      </Field>

      <Field>
        <Label>Logo</Label>
        <FieldInput
          disabled
          value=""
          placeholder="Coming soon — logo upload returns in Phase 5"
        />
      </Field>
    </StepCard>
  );
}

function Step2({ data, update, showErrors }) {
  return (
    <StepCard>
      <StepTitle>Business Overview</StepTitle>
      <StepSubtitle>Describe what your business does and who it serves.</StepSubtitle>

      <Field>
        <Label>Short description <Required>*</Required></Label>
        <FieldTextarea
          value={data.short_description}
          onChange={e => update({ short_description: e.target.value.slice(0, 280) })}
          placeholder="A one-paragraph summary of what you do…"
          rows={3}
          $err={showErrors && !data.short_description.trim()}
        />
        <CharCount>{data.short_description.length}/280</CharCount>
        {showErrors && !data.short_description.trim() && <FieldError>Description is required</FieldError>}
      </Field>

      <Field>
        <Label>About us <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span></Label>
        <FieldTextarea
          value={data.about_us}
          onChange={e => update({ about_us: e.target.value.slice(0, 1000) })}
          placeholder="Your company story, founding year, mission…"
          rows={3}
        />
        <CharCount>{(data.about_us || '').length}/1000</CharCount>
      </Field>

      <Field>
        <Label>Industry <Required>*</Required></Label>
        <FieldInput
          value={data.industry}
          onChange={e => update({ industry: e.target.value })}
          placeholder="e.g. Health & Wellness, SaaS, E-commerce"
          $err={showErrors && !data.industry.trim()}
        />
        {showErrors && !data.industry.trim() && <FieldError>Industry is required</FieldError>}
      </Field>

      <Field>
        <Label>Key services <Required>*</Required></Label>
        <ServiceChipInput
          value={data.key_services}
          onChange={v => update({ key_services: v })}
          error={showErrors && data.key_services.length === 0}
        />
        {showErrors && data.key_services.length === 0 && <FieldError>Add at least one service</FieldError>}
      </Field>
    </StepCard>
  );
}

function Step3({ data, update, showErrors }) {
  return (
    <StepCard>
      <StepTitle>Hero & CTA</StepTitle>
      <StepSubtitle>Define the first thing visitors see and the action you want them to take.</StepSubtitle>

      <Field>
        <Label>Hero headline <Required>*</Required></Label>
        <FieldInput
          value={data.hero_headline}
          onChange={e => update({ hero_headline: e.target.value.slice(0, 100) })}
          placeholder="e.g. Transform Your Business Today"
          $err={showErrors && !data.hero_headline.trim()}
        />
        <CharCount>{data.hero_headline.length}/100</CharCount>
        {showErrors && !data.hero_headline.trim() && <FieldError>Headline is required</FieldError>}
      </Field>

      <Field>
        <Label>Hero subheadline <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span></Label>
        <FieldInput
          value={data.hero_subheadline}
          onChange={e => update({ hero_subheadline: e.target.value.slice(0, 200) })}
          placeholder="e.g. Join 10,000+ companies already growing with us"
        />
        <CharCount>{(data.hero_subheadline || '').length}/200</CharCount>
      </Field>

      <Field>
        <Label>Primary CTA button text <Required>*</Required></Label>
        <FieldInput
          value={data.primary_cta_text}
          onChange={e => update({ primary_cta_text: e.target.value.slice(0, 30) })}
          placeholder="e.g. Get Started"
          $err={showErrors && !data.primary_cta_text.trim()}
        />
        <CharCount>{data.primary_cta_text.length}/30</CharCount>
        {showErrors && !data.primary_cta_text.trim() && <FieldError>CTA text is required</FieldError>}
      </Field>

      <Field>
        <Label>Main goal</Label>
        <RadioGroup>
          {MAIN_GOALS.map(({ value, label }) => (
            <RadioOption key={value} $active={data.main_goal === value}>
              <input type="radio" checked={data.main_goal === value} onChange={() => update({ main_goal: value })} />
              {label}
            </RadioOption>
          ))}
        </RadioGroup>
      </Field>
    </StepCard>
  );
}

function Step4({ data, update }) {
  return (
    <StepCard>
      <StepTitle>Sections &amp; Layout</StepTitle>
      <StepSubtitle>Choose which sections to include and the overall visual layout.</StepSubtitle>

      <Label style={{ display: 'block', marginBottom: 10 }}>Include sections</Label>
      <div style={{ marginBottom: 24 }}>
        {SECTION_TOGGLES.map(({ key, label }) => (
          <ToggleRow key={key}>
            <ToggleLabel>{label}</ToggleLabel>
            <Toggle value={data[key]} onChange={v => update({ [key]: v })} />
          </ToggleRow>
        ))}
      </div>

      <Field>
        <Label>Layout style</Label>
        <CardGrid>
          {LAYOUT_OPTIONS.map(opt => (
            <SelectCard
              key={opt}
              type="button"
              $active={data.layout_style === opt}
              onClick={() => update({ layout_style: opt })}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </SelectCard>
          ))}
        </CardGrid>
      </Field>
    </StepCard>
  );
}

function Step5({ data, update }) {
  return (
    <StepCard>
      <StepTitle>Contact &amp; Social</StepTitle>
      <StepSubtitle>Add contact details and social links to appear on the page. All optional.</StepSubtitle>

      <Field>
        <Label>Contact email</Label>
        <FieldInput type="email" value={data.contact_email || ''} onChange={e => update({ contact_email: e.target.value || null })} placeholder="hello@company.com" />
      </Field>
      <Field>
        <Label>Phone</Label>
        <FieldInput value={data.contact_phone || ''} onChange={e => update({ contact_phone: e.target.value || null })} placeholder="+1 555 000 0000" />
      </Field>
      <Field>
        <Label>Location</Label>
        <FieldInput value={data.contact_location || ''} onChange={e => update({ contact_location: e.target.value || null })} placeholder="San Francisco, CA" />
      </Field>
      <Field>
        <Label>Instagram URL</Label>
        <FieldInput type="url" value={data.instagram_url || ''} onChange={e => update({ instagram_url: e.target.value || null })} placeholder="https://instagram.com/yourhandle" />
      </Field>
      <Field>
        <Label>LinkedIn URL</Label>
        <FieldInput type="url" value={data.linkedin_url || ''} onChange={e => update({ linkedin_url: e.target.value || null })} placeholder="https://linkedin.com/company/yourcompany" />
      </Field>
      <Field>
        <Label>Twitter URL</Label>
        <FieldInput type="url" value={data.twitter_url || ''} onChange={e => update({ twitter_url: e.target.value || null })} placeholder="https://twitter.com/yourhandle" />
      </Field>
      <Field>
        <Label>Facebook URL</Label>
        <FieldInput type="url" value={data.facebook_url || ''} onChange={e => update({ facebook_url: e.target.value || null })} placeholder="https://facebook.com/yourpage" />
      </Field>
    </StepCard>
  );
}

function Step6({ funnelTitle, data, update }) {
  const includedSections = SECTION_TOGGLES
    .filter(({ key }) => data[key])
    .map(({ label }) => label)
    .join(', ');

  const goalLabel = MAIN_GOALS.find(g => g.value === data.main_goal)?.label || data.main_goal;

  return (
    <StepCard>
      <StepTitle>Visual Style</StepTitle>
      <StepSubtitle>Set the color theme and typography, then review your funnel before generating.</StepSubtitle>

      <Field>
        <Label>Color theme</Label>
        <CardGrid style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))' }}>
          {COLOR_OPTIONS.map(({ value, label, swatch }) => (
            <SelectCard
              key={value}
              type="button"
              $active={data.color_theme === value}
              onClick={() => update({ color_theme: value })}
            >
              <CardSwatch $color={swatch} />
              {label}
            </SelectCard>
          ))}
        </CardGrid>
      </Field>

      <Field>
        <Label>Font style</Label>
        <CardGrid>
          {FONT_OPTIONS.map(opt => (
            <SelectCard
              key={opt}
              type="button"
              $active={data.font_style === opt.toLowerCase()}
              onClick={() => update({ font_style: opt.toLowerCase() })}
            >
              {opt}
            </SelectCard>
          ))}
        </CardGrid>
      </Field>

      <ReviewCard>
        <ReviewTitle>Review</ReviewTitle>
        <ReviewRow><ReviewLabel>Title</ReviewLabel><ReviewValue>{funnelTitle || <span style={{ color: C.muted }}>—</span>}</ReviewValue></ReviewRow>
        <ReviewRow><ReviewLabel>Company</ReviewLabel><ReviewValue>{data.company_name || <span style={{ color: C.muted }}>—</span>}</ReviewValue></ReviewRow>
        <ReviewRow><ReviewLabel>Goal</ReviewLabel><ReviewValue>{goalLabel}</ReviewValue></ReviewRow>
        <ReviewRow><ReviewLabel>Layout</ReviewLabel><ReviewValue style={{ textTransform: 'capitalize' }}>{data.layout_style}</ReviewValue></ReviewRow>
        <ReviewRow><ReviewLabel>Sections</ReviewLabel><ReviewValue>{includedSections || <span style={{ color: C.muted }}>None selected</span>}</ReviewValue></ReviewRow>
        <ReviewRow><ReviewLabel>Colors</ReviewLabel><ReviewValue>{data.color_theme}</ReviewValue></ReviewRow>
        <ReviewRow><ReviewLabel>Font</ReviewLabel><ReviewValue style={{ textTransform: 'capitalize' }}>{data.font_style}</ReviewValue></ReviewRow>
      </ReviewCard>
    </StepCard>
  );
}

// ── Main wizard component ─────────────────────────────────────────────────────

export default function CRMFunnelNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [funnelTitle, setFunnelTitle] = useState('');
  const [data, setData] = useState({ ...INITIAL_DATA });
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function update(patch) {
    setData(prev => ({ ...prev, ...patch }));
  }

  function handleNext() {
    if (!canProceed(step, funnelTitle, data)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep(s => s + 1);
  }

  function handleBack() {
    setShowErrors(false);
    setStep(s => Math.max(1, s - 1));
  }

  async function handleGenerate() {
    if (!canProceed(step, funnelTitle, data)) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const created = await createFunnel({ title: funnelTitle, wizard_input: data });
      await generateFunnel(created.id);
      navigate(`/crm/funnels/${created.id}`);
    } catch (err) {
      setSubmitError(formatApiError(err));
      setSubmitting(false);
    }
  }

  const valid = canProceed(step, funnelTitle, data);

  return (
    <Page>
      <BackRow>
        <BackBtn onClick={() => navigate('/crm/funnels')}>
          ← Back to Funnels
        </BackBtn>
      </BackRow>

      {/* Progress indicator */}
      <ProgressWrap>
        <StepRow>
          {STEP_NAMES.map((name, idx) => {
            const num = idx + 1;
            const done = num < step;
            const active = num === step;
            return (
              <React.Fragment key={num}>
                <StepNode>
                  <StepCircle $done={done} $active={active}>
                    {done ? '✓' : num}
                  </StepCircle>
                  <StepLabel $active={active}>{name}</StepLabel>
                </StepNode>
                {idx < STEP_NAMES.length - 1 && <StepLine $done={done} />}
              </React.Fragment>
            );
          })}
        </StepRow>
      </ProgressWrap>

      {/* Step content */}
      {step === 1 && <Step1 funnelTitle={funnelTitle} setFunnelTitle={setFunnelTitle} data={data} update={update} showErrors={showErrors} />}
      {step === 2 && <Step2 data={data} update={update} showErrors={showErrors} />}
      {step === 3 && <Step3 data={data} update={update} showErrors={showErrors} />}
      {step === 4 && <Step4 data={data} update={update} />}
      {step === 5 && <Step5 data={data} update={update} />}
      {step === 6 && <Step6 funnelTitle={funnelTitle} data={data} update={update} />}

      {/* Navigation */}
      {submitError && <SubmitError>{submitError}</SubmitError>}
      <NavRow>
        <PrevBtn onClick={handleBack} disabled={step === 1}>← Back</PrevBtn>
        {step < 6 ? (
          <NextBtn onClick={handleNext} disabled={!valid && step <= 3}>
            Next →
          </NextBtn>
        ) : (
          <GenerateBtn onClick={handleGenerate} disabled={submitting}>
            {submitting ? 'Creating…' : 'Generate Funnel'}
          </GenerateBtn>
        )}
      </NavRow>
    </Page>
  );
}

