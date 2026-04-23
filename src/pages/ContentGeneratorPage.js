import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import CampaignPlatformPreview from '../components/CampaignPlatformPreview';
import { createCampaignForScheduler } from '../services/contentSchedulerRepository';
import { generateCampaign } from '../services/campaignGeneratorService';
import { crm as C } from '../styles/crmTheme';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.55; }
  50% { transform: scale(1.25); opacity: 1; }
`;

const Page = styled.div`
  min-height: 100vh;
  background: ${C.bg};
  color: ${C.text};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${fadeIn} 0.18s ease;
  font-family: ${C.fontFamily};
`;

const StickyActionsBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${C.surface};
  border-bottom: 1px solid ${C.border};
`;

const StickyStatus = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: ${C.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StickyButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
`;

const HeaderButton = styled.button`
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
  border: ${props => (props.$ghost ? `1px solid ${C.accent}` : 'none')};
  background: ${props => (props.$ghost ? 'transparent' : C.accent)};
  color: ${props => (props.$ghost ? C.accent : '#ffffff')};

  &:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const Shell = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(340px, 38%) minmax(0, 62%);
  overflow: hidden;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPanel = styled.aside`
  min-height: 0;
  overflow-y: auto;
  padding: 20px 16px;
  background: ${C.surface};
  border-right: 1px solid ${C.border};

  @media (max-width: 1080px) {
    border-right: none;
    border-bottom: 1px solid ${C.border};
  }
`;

const RightPanel = styled.section`
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: ${C.bg};
  overflow: hidden;
`;

const PanelSection = styled.section`
  padding: 18px 0;
  border-top: 1px solid ${C.border};

  &:first-child {
    border-top: none;
    padding-top: 0;
  }
`;

const SectionLabel = styled.div`
  margin-bottom: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${C.muted};
`;

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${C.text};
`;

const baseInputStyles = `
  width: 100%;
  border: 1px solid ${C.border};
  border-radius: 8px;
  background: ${C.card};
  color: ${C.text};
  font-size: 13px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: ${C.accent};
  }
`;

const TextInput = styled.input`
  ${baseInputStyles}
  height: 40px;
  padding: 0 12px;
`;

const SelectInput = styled.select`
  ${baseInputStyles}
  height: 40px;
  padding: 0 12px;
`;

const PromptInput = styled.textarea`
  ${baseInputStyles}
  min-height: 110px;
  resize: vertical;
  padding: 10px 12px;
  line-height: 1.5;
`;

const ToggleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

const ToggleChip = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid ${props => (props.$active ? C.accent : C.border)};
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  background: ${props => (props.$active ? `${C.accent}22` : C.card)};
  color: ${props => (props.$active ? C.accent : C.muted)};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${C.accent};
    color: ${C.text};
  }
`;

const ChipIcon = styled.span`
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: currentColor;

  svg {
    width: 16px;
    height: 16px;
    display: block;
  }
`;

const CollapsibleHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${C.text};
`;

const CollapsibleTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
`;

const SmallMuted = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${C.muted};
`;

const Chevron = styled.span`
  color: ${C.muted};
  font-size: 11px;
  line-height: 1;
`;

const InlineTagBox = styled.div`
  min-height: 40px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 8px;
`;

const TagPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid ${C.accent}44;
  background: ${C.accent}22;
  color: ${C.accent};
  font-size: 11px;
`;

const TagRemove = styled.button`
  border: none;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  line-height: 1;
`;

const TagInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  color: ${C.text};
  font-size: 12px;
  min-width: 120px;
  flex: 1;
`;

const SectionGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const RightBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 20px;
`;

const EmptyState = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  color: ${C.muted};
  padding: 40px 20px;
`;

const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  color: ${C.borderLight};

  svg {
    width: 56px;
    height: 56px;
    display: block;
  }
`;

const EmptySub = styled.div`
  font-size: 12px;
  color: ${C.borderLight};
`;

const ActionDock = styled.div`
  flex-shrink: 0;
  background: ${C.surface};
  border-top: 1px solid ${C.border};
`;

const RawDrawer = styled.div`
  overflow: hidden;
  max-height: ${props => (props.$open ? '300px' : '0px')};
  transition: max-height 0.22s ease;
  border-bottom: ${props => (props.$open ? `1px solid ${C.border}` : 'none')};
  background: ${C.surface};
`;

const RawDrawerInner = styled.pre`
  margin: 0;
  padding: 16px 20px;
  background: ${C.card};
  border-radius: 8px;
  font-size: 11px;
  font-family: Consolas, 'Courier New', monospace;
  color: ${C.text};
  overflow: auto;
  max-height: 300px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ActionBar = styled.div`
  min-height: 52px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const GhostToggle = styled.button`
  border: 1px solid ${props => (props.$active ? C.accent : C.border)};
  background: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
  color: ${props => (props.$active ? C.accent : C.muted)};
  cursor: pointer;
`;

const SaveFeedback = styled.div`
  font-size: 11px;
  color: ${props => (props.$danger ? C.danger : C.muted)};
  text-align: right;
  line-height: 1.4;
`;

const SaveErrors = styled.ul`
  margin: 6px 0 0 14px;
  padding: 0;
  font-size: 10px;
  color: ${C.danger};
`;

const PlatformPreviews = styled.div`
  min-height: 0;
`;

const NumberSelect = styled(SelectInput)`
  appearance: auto;
`;

const platformOptions = [
  { value: 'Email', label: 'Email' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'X', label: 'X' },
  { value: 'YouTube', label: 'YouTube' },
];

const commissionOptions = [10, 20, 25, 30, 40, 50, 60, 75];
const ageRangeOptions = ['Any', '18-24', '25-34', '35-44', '45-54', '55+'];
const genderOptions = ['All', 'Male', 'Female', 'Non-binary'];
const incomeOptions = ['Any', 'Low', 'Mid', 'High'];
const languageOptions = [
  { value: 'en', label: 'English (en)' },
  { value: 'fr', label: 'French (fr)' },
  { value: 'es', label: 'Spanish (es)' },
  { value: 'pt', label: 'Portuguese (pt)' },
  { value: 'ar', label: 'Arabic (ar)' },
  { value: 'zh', label: 'Chinese (zh)' },
];

function platformIcon(platform) {
  switch (platform) {
    case 'Email':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
    case 'Instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'LinkedIn':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 10v7" />
          <path d="M7 7h.01" />
          <path d="M11 17v-4a2 2 0 1 1 4 0v4" />
        </svg>
      );
    case 'Facebook':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v9h4v-9h3l1-4h-4V6a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case 'X':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4l16 16" />
          <path d="M20 4L4 20" />
        </svg>
      );
    case 'YouTube':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="12" rx="4" />
          <path d="M11 9l5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

function isCommaOrEnter(event) {
  return event.key === 'Enter' || event.key === ',';
}

function splitCommaList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ContentGeneratorPage() {
  const [mode] = useState('single');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  const [campaign, setCampaign] = useState(null);
  const [manualJson, setManualJson] = useState('');
  const [statusMessage, setStatusMessage] = useState('Ready to generate a campaign.');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveErrors, setSaveErrors] = useState([]);
  const [previewSelections, setPreviewSelections] = useState({});
  const [showRawJson, setShowRawJson] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [numVariants, setNumVariants] = useState(3);
  const [offerName, setOfferName] = useState('');
  const [vendor, setVendor] = useState('');
  const [hoplink, setHoplink] = useState('');
  const [commission, setCommission] = useState(50);
  const [showProductForm, setShowProductForm] = useState(true);
  const [showAudienceForm, setShowAudienceForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [audienceAgeRange, setAudienceAgeRange] = useState('Any');
  const [audienceGender, setAudienceGender] = useState('All');
  const [audienceInterests, setAudienceInterests] = useState(['online business', 'growth marketing']);
  const [interestDraft, setInterestDraft] = useState('');
  const [audienceIncomeLevel, setAudienceIncomeLevel] = useState('Any');
  const [audienceCountries, setAudienceCountries] = useState('US');
  const [audienceLanguage, setAudienceLanguage] = useState('en');

  const saveMessageIsDanger = useMemo(() => /error|missing/i.test(saveMessage), [saveMessage]);
  const primaryPiece = useMemo(() => {
    if (!campaign || !Array.isArray(campaign.content_pieces)) {
      return null;
    }
    return campaign.content_pieces[0] || null;
  }, [campaign]);

  useEffect(() => {
    setManualJson(campaign ? JSON.stringify(campaign, null, 2) : '');
  }, [campaign]);

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) => (
      prev.includes(platform)
        ? prev.filter((item) => item !== platform)
        : [...prev, platform]
    ));
  };

  const addInterest = (value) => {
    const cleaned = String(value || '').trim().replace(/,+$/, '');
    if (!cleaned) return;
    setAudienceInterests((prev) => (prev.includes(cleaned) ? prev : [...prev, cleaned]));
    setInterestDraft('');
  };

  const removeInterest = (value) => {
    setAudienceInterests((prev) => prev.filter((item) => item !== value));
  };

  const runGeneration = async () => {
    if (!prompt.trim()) {
      setStatusMessage('Please enter a prompt.');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setStatusMessage('Please select at least one platform.');
      return;
    }

    if (isGenerating) return;

    setGenerationCount((count) => count + 1);
    setIsGenerating(true);
    setSaveMessage('');
    setSaveErrors([]);
    setStatusMessage('Generating campaign...');

    try {
      const nextCampaign = await generateCampaign({
        prompt: prompt.trim(),
        platforms: selectedPlatforms,
        affiliate_product: {
          product_id: `manual-${Date.now()}`,
          vendor: vendor.trim() || 'Unknown Vendor',
          offer_name: offerName.trim() || 'Untitled Offer',
          hoplink: hoplink.trim() || 'https://example.com',
          commission: {
            model: 'percentage',
            value: commission / 100,
            currency: 'USD',
            payout_frequency: 'weekly',
          },
          niche: 'general',
          source_network: 'manual',
        },
        audience: {
          personas: ['new affiliate marketers'],
          demographics: {
            age_range: audienceAgeRange,
            gender_focus: audienceGender,
            income_band: audienceIncomeLevel,
            interests: audienceInterests,
          },
          region: {
            countries: splitCommaList(audienceCountries),
            languages: [audienceLanguage],
            timezone: 'UTC',
          },
        },
        num_variants: numVariants,
        language: audienceLanguage,
        mock_mode: null,
      });

      setCampaign(nextCampaign);
      setStatusMessage('Campaign generation complete. Review and send to scheduler.');
    } catch (error) {
      setStatusMessage(error?.message || 'Campaign generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendToScheduler = async () => {
    if (!campaign || isGenerating) return;

    try {
      const payload = !Object.keys(previewSelections).length
        ? campaign
        : {
          ...campaign,
          content_pieces: campaign.content_pieces.map((piece, index) => {
            const platformKey = piece?.platform || `Platform ${index + 1}`;
            const platformSelections = previewSelections?.[platformKey];

            if (!platformSelections) {
              return piece;
            }

            const clampIndex = (value) => {
              const safeValue = Number.isInteger(value) ? value : 0;
              return Math.max(0, Math.min(2, safeValue));
            };

            const pickVariant = (value, indexValue) => {
              const variants = [value, value, value];
              return variants[clampIndex(indexValue)];
            };

            const selectedHeadline = pickVariant(piece?.copy?.headline, platformSelections.headline);
            const selectedBody = pickVariant(piece?.copy?.body ?? piece?.copy?.caption, platformSelections.body);
            const selectedCta = pickVariant(piece?.copy?.cta_text ?? piece?.cta_text, platformSelections.cta);
            const selectedHashtags = pickVariant(
              Array.isArray(piece?.hashtags) ? piece.hashtags : undefined,
              platformSelections.hashtags,
            );
            const selectedImagePrompt = pickVariant(piece?.media?.image_prompt, platformSelections.imagePrompt);

            const nextCopy = {
              ...(piece?.copy || {}),
            };

            if (selectedHeadline !== undefined) {
              nextCopy.headline = selectedHeadline;
            }

            if (selectedBody !== undefined) {
              nextCopy.body = selectedBody;
              nextCopy.caption = selectedBody;
            }

            const nextPiece = {
              ...piece,
              copy: nextCopy,
            };

            if (selectedCta !== undefined) {
              nextPiece.cta_text = selectedCta;
            }

            if (selectedHashtags !== undefined) {
              nextPiece.hashtags = Array.isArray(selectedHashtags) ? [...selectedHashtags] : selectedHashtags;
            }

            if (selectedImagePrompt !== undefined) {
              nextPiece.media = {
                ...(piece?.media || {}),
                image_prompt: selectedImagePrompt,
              };
            }

            return nextPiece;
          }),
        };

      const result = await createCampaignForScheduler(payload, { strict: false });
      if (result.campaign) {
        setCampaign(result.campaign);
      }
      if (result.errors.length) {
        setSaveMessage(`Campaign saved and scheduled with validation errors: ${result.errors.join('; ')}`);
        setStatusMessage('Sent to scheduler with validation issues.');
        setSaveErrors([]);
      } else if (result.warnings.length) {
        setSaveMessage(`Campaign saved and scheduled with warnings: ${result.warnings.join('; ')}`);
        setStatusMessage('Sent to scheduler with warnings.');
        setSaveErrors([]);
      } else {
        setSaveMessage('Campaign saved to the database and added to the scheduler.');
        setStatusMessage('Sent to scheduler.');
        setSaveErrors([]);
      }
    } catch (err) {
      const rawMessage = err?.message || 'Unable to save campaign and send it to scheduler.';
      const detailSection = rawMessage.startsWith('Error missing information:')
        ? rawMessage.replace('Error missing information:', '').trim()
        : rawMessage;

      const parsedErrors = detailSection
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean);

      if (parsedErrors.length > 1) {
        setSaveMessage('Error missing information.');
        setStatusMessage('Unable to send to scheduler.');
        setSaveErrors(parsedErrors);
      } else {
        setSaveMessage(rawMessage);
        setStatusMessage(rawMessage);
        setSaveErrors([]);
      }
    }
  };

  const rawJson = manualJson || (campaign ? JSON.stringify(campaign, null, 2) : '');

  const handleSelectionsChange = useCallback((newSelections) => {
    setPreviewSelections((prev) => ({
      ...prev,
      ...newSelections,
    }));
  }, []);

  return (
    <Page data-mode={mode}>
      <StickyActionsBar>
        <StickyStatus>
          {isGenerating ? 'Generating campaign...' : statusMessage}
        </StickyStatus>
        <StickyButtonGroup>
        <HeaderButton type="button" onClick={runGeneration} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate'}
        </HeaderButton>
        <HeaderButton type="button" $ghost onClick={sendToScheduler} disabled={!campaign || isGenerating}>
          Send to Scheduler
        </HeaderButton>
        </StickyButtonGroup>
      </StickyActionsBar>

      <Shell>
        <LeftPanel>
          <PanelSection>
            <SectionLabel>Prompt</SectionLabel>
            <PromptInput
              id="prompt-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the product you want to promote and the angle you want to take. e.g. Promote a premium cotton minimalist t-shirt for streetwear fans aged 18-30..."
            />
          </PanelSection>

          <PanelSection>
            <SectionLabel>Platforms</SectionLabel>
            <ToggleGrid>
              {platformOptions.map((platform) => (
                <ToggleChip
                  key={platform.value}
                  type="button"
                  $active={selectedPlatforms.includes(platform.value)}
                  onClick={() => togglePlatform(platform.value)}
                >
                  <ChipIcon>{platformIcon(platform.value)}</ChipIcon>
                  {platform.label}
                </ToggleChip>
              ))}
            </ToggleGrid>
          </PanelSection>

          <PanelSection>
            <CollapsibleHeader type="button" onClick={() => setShowProductForm((prev) => !prev)}>
              <CollapsibleTitle>Affiliate Product</CollapsibleTitle>
              <Chevron>{showProductForm ? '▼' : '▶'}</Chevron>
            </CollapsibleHeader>

            {showProductForm ? (
              <SectionGrid style={{ marginTop: '12px' }}>
                <div>
                  <FieldLabel>Offer Name</FieldLabel>
                  <TextInput value={offerName} onChange={(event) => setOfferName(event.target.value)} placeholder="Offer name" />
                </div>

                <div>
                  <FieldLabel>Vendor</FieldLabel>
                  <TextInput value={vendor} onChange={(event) => setVendor(event.target.value)} placeholder="Vendor" />
                </div>

                <div>
                  <FieldLabel>Affiliate Link</FieldLabel>
                  <TextInput value={hoplink} onChange={(event) => setHoplink(event.target.value)} placeholder="https://" />
                </div>

                <div>
                  <FieldLabel>Commission %</FieldLabel>
                  <NumberSelect value={commission} onChange={(event) => setCommission(Number(event.target.value))}>
                    {commissionOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </NumberSelect>
                </div>
              </SectionGrid>
            ) : null}
          </PanelSection>

          <PanelSection>
            <CollapsibleHeader type="button" onClick={() => setShowAudienceForm((prev) => !prev)}>
              <CollapsibleTitle>
                Target Audience <SmallMuted>(Optional)</SmallMuted>
              </CollapsibleTitle>
              <Chevron>{showAudienceForm ? '▼' : '▶'}</Chevron>
            </CollapsibleHeader>

            {showAudienceForm ? (
              <SectionGrid style={{ marginTop: '12px' }}>
                <div>
                  <FieldLabel>Age Range</FieldLabel>
                  <SelectInput value={audienceAgeRange} onChange={(event) => setAudienceAgeRange(event.target.value)}>
                    {ageRangeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </SelectInput>
                </div>

                <div>
                  <FieldLabel>Gender</FieldLabel>
                  <SelectInput value={audienceGender} onChange={(event) => setAudienceGender(event.target.value)}>
                    {genderOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </SelectInput>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <FieldLabel>Interests</FieldLabel>
                  <InlineTagBox>
                    {audienceInterests.map((interest) => (
                      <TagPill key={interest}>
                        {interest}
                        <TagRemove type="button" onClick={() => removeInterest(interest)} aria-label={`Remove ${interest}`}>
                          ×
                        </TagRemove>
                      </TagPill>
                    ))}
                    <TagInput
                      value={interestDraft}
                      onChange={(event) => setInterestDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (!isCommaOrEnter(event)) return;
                        event.preventDefault();
                        addInterest(interestDraft);
                      }}
                      onBlur={() => addInterest(interestDraft)}
                      placeholder="Add interest and press Enter"
                    />
                  </InlineTagBox>
                </div>

                <div>
                  <FieldLabel>Income Level</FieldLabel>
                  <SelectInput value={audienceIncomeLevel} onChange={(event) => setAudienceIncomeLevel(event.target.value)}>
                    {incomeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </SelectInput>
                </div>

                <div>
                  <FieldLabel>Countries</FieldLabel>
                  <TextInput value={audienceCountries} onChange={(event) => setAudienceCountries(event.target.value)} placeholder="e.g. US, UK, Canada" />
                </div>

                <div>
                  <FieldLabel>Language</FieldLabel>
                  <SelectInput value={audienceLanguage} onChange={(event) => setAudienceLanguage(event.target.value)}>
                    {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectInput>
                </div>
              </SectionGrid>
            ) : null}
          </PanelSection>

          <PanelSection>
            <CollapsibleHeader type="button" onClick={() => setShowSettingsForm((prev) => !prev)}>
              <CollapsibleTitle>Settings</CollapsibleTitle>
              <Chevron>{showSettingsForm ? '▼' : '▶'}</Chevron>
            </CollapsibleHeader>

            {showSettingsForm ? (
              <SectionGrid style={{ marginTop: '12px' }}>
                <div>
                  <FieldLabel>Content Variants per Platform</FieldLabel>
                  <NumberSelect value={numVariants} onChange={(event) => setNumVariants(Number(event.target.value))}>
                    {[1, 3, 5].map((option) => <option key={option} value={option}>{option}</option>)}
                  </NumberSelect>
                </div>
              </SectionGrid>
            ) : null}
          </PanelSection>
        </LeftPanel>

        <RightPanel>
          <RightBody>
            {campaign ? (
              <PlatformPreviews>
                <CampaignPlatformPreview
                  contentPieces={campaign.content_pieces}
                  selections={previewSelections}
                  onSelectionsChange={handleSelectionsChange}
                />
              </PlatformPreviews>
            ) : isGenerating ? (
              <EmptyState>
                <EmptyIcon>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
                    <path d="M19 14l.9 2.7L23 18l-3.1 1.3L19 22l-.9-2.7L15 18l3.1-1.3L19 14z" />
                  </svg>
                </EmptyIcon>
                <div>Your generated campaign is being built</div>
                <EmptySub>Hang tight while the preview is prepared</EmptySub>
              </EmptyState>
            ) : (
              <EmptyState>
                <EmptyIcon>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
                    <path d="M19 14l.9 2.7L23 18l-3.1 1.3L19 22l-.9-2.7L15 18l3.1-1.3L19 14z" />
                  </svg>
                </EmptyIcon>
                <div>Your generated campaign will appear here</div>
                <EmptySub>Fill in the details on the left and click Generate</EmptySub>
              </EmptyState>
            )}
          </RightBody>

          <ActionDock>
            {showRawJson ? (
              <RawDrawer $open>
                <RawDrawerInner>{rawJson || '{ }'}</RawDrawerInner>
              </RawDrawer>
            ) : null}

            <ActionBar>
              <GhostToggle type="button" $active={showRawJson} onClick={() => setShowRawJson((prev) => !prev)}>
                {showRawJson ? 'Hide Raw JSON' : 'View Raw JSON'}
              </GhostToggle>

              {saveMessage ? (
                <SaveFeedback $danger={saveMessageIsDanger}>
                  <div>{saveMessage}</div>
                  {!!saveErrors.length && (
                    <SaveErrors>
                      {saveErrors.map((item) => <li key={item}>{item}</li>)}
                    </SaveErrors>
                  )}
                </SaveFeedback>
              ) : <span />}
            </ActionBar>
          </ActionDock>
        </RightPanel>
      </Shell>
    </Page>
  );
}
