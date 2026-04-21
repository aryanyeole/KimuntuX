import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import CampaignPlatformPreview from '../components/CampaignPlatformPreview';
import { createCampaignForScheduler } from '../services/contentSchedulerRepository';
import { generateCampaign } from '../services/campaignGeneratorService';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  padding: 120px 20px 2rem 20px;
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Title = styled.h1`
  margin: 0 0 1rem 0;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 420px) 1fr;
  gap: 1.2rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 12px;
  padding: 1rem;
  box-shadow:
    0 0 0 1px ${props => `${props.theme?.colors?.primary || '#00C896'}14`},
    0 0 18px ${props => `${props.theme?.colors?.primary || '#00C896'}1A`};
`;

const FieldLabel = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.55rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const PromptInput = styled.textarea`
  width: 100%;
  min-height: 130px;
  resize: vertical;
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  color: ${props => props.theme?.colors?.text || '#111111'};

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
`;

const TextInput = styled.input`
  width: 100%;
  height: 40px;
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  color: ${props => props.theme?.colors?.text || '#111111'};

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
`;

const NumberSelect = styled.select`
  width: 100%;
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  color: ${props => props.theme?.colors?.text || '#111111'};

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
`;

const ActionRow = styled.div`
  margin-top: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const TabRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
`;

const TabButton = styled.button`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  background: ${props => (props.active ? (props.theme?.colors?.primary || '#00C896') : 'transparent')};
  color: ${props => (props.active ? '#ffffff' : (props.theme?.colors?.text || '#111111'))};
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
`;

const PlatformGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
`;

const PlatformToggle = styled.button`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  background: ${props => (props.active ? (props.theme?.colors?.primary || '#00C896') : 'transparent')};
  color: ${props => (props.active ? '#ffffff' : (props.theme?.colors?.text || '#111111'))};
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
`;

const SectionDivider = styled.hr`
  border: none;
  border-top: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  margin: 0.85rem 0;
`;

const CollapsibleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 0.5rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const Button = styled.button`
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => {
    if (props.variant === 'secondary') return props.theme?.colors?.accent || '#DAA520';
    if (props.variant === 'ghost') return 'transparent';
    return props.theme?.colors?.primary || '#00C896';
  }};
  color: ${props => (props.variant === 'ghost' ? (props.theme?.colors?.text || '#111111') : '#ffffff')};
  border: ${props => (props.variant === 'ghost' ? `1px solid ${props.theme?.colors?.border || '#e5e5e5'}` : 'none')};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    opacity: 0.92;
  }
`;

const Viewport = styled(Panel)`
  min-height: 480px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const StatusText = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const Card = styled.div`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 12px;
  padding: 1rem;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
`;

const CardTitle = styled.h3`
  margin: 0 0 0.6rem 0;
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-bottom: 0.7rem;
`;

const MetaPill = styled.span`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const BodyText = styled.p`
  margin: 0;
  color: ${props => props.theme?.colors?.text || '#111111'};
  line-height: 1.5;
`;

const Notice = styled.div`
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  font-size: 0.9rem;
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const JsonArea = styled.textarea`
  width: 100%;
  min-height: 260px;
  resize: vertical;
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.88rem;
  font-family: 'Consolas', 'Courier New', monospace;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  color: ${props => props.theme?.colors?.text || '#111111'};

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#00C896'};
  }
`;

const JsonPreview = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 260px;
  overflow: auto;
  border-radius: 10px;
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  padding: 0.75rem;
  font-size: 0.82rem;
  font-family: 'Consolas', 'Courier New', monospace;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const List = styled.ul`
  margin: 0.45rem 0 0 1.1rem;
  padding: 0;
`;

const PLATFORM_OPTIONS = ['Email', 'YouTube', 'LinkedIn', 'X', 'Facebook', 'Instagram'];
const COLOR_OPTIONS = ['#00C896', '#DAA520', '#60A5FA', '#F97316', '#A78BFA', '#10B981'];
const THEMES = ['Spring Boost', 'Flash Sale', 'Weekly Deal', 'Product Reveal', 'Referral Push'];
const PLATFORM_SELECTOR_OPTIONS = ['Email', 'Instagram', 'LinkedIn', 'Facebook', 'X', 'YouTube'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function toTimeString(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function makeIsoDateTime(dateString, timeString) {
  if (!dateString || !timeString) return null;
  return `${dateString}T${timeString}:00`;
}

function generateMockCampaignContract(promptText, seq) {
  const basePrompt = promptText?.trim() || 'no text entered!';
  const theme = pickRandom(THEMES);
  const name = `${theme} #${seq} - ${basePrompt.slice(0, 28)}`;
  const body = `Campaign ${seq}: ${basePrompt}.`;
  const sendTime = toTimeString(randomInt(8 * 60, 20 * 60));
  const platformCount = randomInt(1, 3);
  const platforms = [...PLATFORM_OPTIONS].sort(() => 0.5 - Math.random()).slice(0, platformCount);
  const cost = randomInt(120, 1600);
  const color = pickRandom(COLOR_OPTIONS);
  const today = new Date();
  const inTwoDays = new Date(today);
  inTwoDays.setDate(today.getDate() + 2);
  const scheduledDate = `${inTwoDays.getFullYear()}-${String(inTwoDays.getMonth() + 1).padStart(2, '0')}-${String(inTwoDays.getDate()).padStart(2, '0')}`;

  const pieceId = `piece_${Date.now()}_${seq}`;
  const primaryPlatform = platforms[0] || 'Email';
  const isScheduled = randomInt(0, 1) === 1;
  const publishAt = isScheduled ? makeIsoDateTime(scheduledDate, sendTime) : null;

  return {
    name,
    status: 'draft',
    version: 1,
    previous_version_id: null,
    platforms,
    theme_color: color,
    tags: ['mock', 'pre-llm'],
    affiliate_product: {
      product_id: `cb-${10000 + seq}`,
      vendor: 'ClickBank Vendor',
      offer_name: `${theme} Offer`,
      hoplink: `https://example.com/hop/cb-${10000 + seq}`,
      commission: {
        model: 'percentage',
        value: 0.5,
        currency: 'USD',
        payout_frequency: 'weekly',
      },
      niche: 'business',
      source_network: 'clickbank',
    },
    audience: {
      personas: ['new affiliate marketers'],
      demographics: {
        age_range: '25-44',
        gender_focus: 'all',
        income_band: 'mid',
        interests: ['online business', 'growth marketing'],
      },
      region: {
        countries: ['US'],
        languages: ['en'],
        timezone: 'UTC',
      },
    },
    tracking: {
      base_hoplink: `https://example.com/hop/cb-${10000 + seq}`,
      tracking_template: '{base}?tid={subid}',
      tracking_links: [
        {
          platform: primaryPlatform,
          content_piece_id: pieceId,
          final_url: `https://example.com/hop/cb-${10000 + seq}?utm_source=${primaryPlatform.toLowerCase()}`,
          subid_map: {
            campaign: `mock-${seq}`,
          },
          utm: {
            source: primaryPlatform.toLowerCase(),
            medium: 'affiliate',
            campaign: `mock_${seq}`,
          },
        },
      ],
      attribution_model: 'last_click',
    },
    scheduling: {
      timezone: 'UTC',
      campaign_window: {
        start_at: null,
        end_at: null,
        cadence_default: 'once',
      },
    },
    metrics: {
      intent: {
        primary_goal: 'clicks',
        budget: {
          amount: cost,
          currency: 'USD',
          cap_type: 'lifetime',
        },
        target_clicks: 100,
      },
      actuals: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        spend: 0,
      },
    },
    content_pieces: [
      {
        piece_id: pieceId,
        platform: primaryPlatform,
        format: primaryPlatform === 'Email' ? 'email' : 'post',
        status: isScheduled ? 'scheduled' : 'draft',
        sequence_index: 0,
        objective: 'Drive qualified clicks',
        cta_text: 'Learn More',
        cta_link: `https://example.com/hop/cb-${10000 + seq}`,
        hashtags: ['#affiliate', '#marketing', '#growth'],
        copy: {
          hook: `Try this ${theme.toLowerCase()} angle`,
          headline: `${theme} for your next promo`,
          body,
          caption: body,
          subject_line: `${theme} for your audience`,
          script: `${body} CTA: Learn More.`,
        },
        media: {
          image_prompt: `Modern social visual for ${theme}`,
          image_url: null,
          video_prompt: `15 second short promoting ${theme}`,
          thumbnail_prompt: `${theme} thumbnail with bold text`,
        },
        compliance: {
          disclosures: ['Affiliate links may generate commissions'],
          restricted_terms: [],
        },
        schedule: {
          publish_at: publishAt,
          timezone: isScheduled ? 'UTC' : null,
          recurrence: 'once',
          end_at: null,
        },
        publish_result: null,
      },
    ],
    notes: body,
    archive_reason: null,
    deleted_at: null,
  };
}

function getPrimaryPiece(campaign) {
  if (!campaign || !Array.isArray(campaign.content_pieces)) {
    return null;
  }
  return campaign.content_pieces[0] || null;
}

export default function ContentGeneratorPage() {
  const [mode, setMode] = useState('auto');
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

  const canRegenerate = useMemo(() => !!campaign && !isGenerating, [campaign, isGenerating]);

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) => (
      prev.includes(platform)
        ? prev.filter((item) => item !== platform)
        : [...prev, platform]
    ));
  };

  const runGeneration = async (isRegeneration = false) => {
    if (!prompt.trim()) {
      setStatusMessage('Please enter a prompt.');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setStatusMessage('Please select at least one platform.');
      return;
    }

    if (isGenerating) return;

    const nextCount = generationCount + 1;
    setGenerationCount(nextCount);
    setIsGenerating(true);
    setSaveMessage('');
    setSaveErrors([]);
    setStatusMessage(isRegeneration ? 'Regenerating campaign...' : 'Generating campaign...');

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
            age_range: '25-44',
            gender_focus: 'all',
            income_band: 'mid',
            interests: ['online business', 'growth marketing'],
          },
          region: {
            countries: ['US'],
            languages: ['en'],
            timezone: 'UTC',
          },
        },
        num_variants: numVariants,
        language: 'en',
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

  const activateManual = () => {
    setMode('manual');
    if (!manualJson) {
      const starter = generateMockCampaignContract(prompt, generationCount || 1);
      setCampaign(starter);
      setManualJson(JSON.stringify(starter, null, 2));
    }
    setSaveMessage('');
    setSaveErrors([]);
  };

  const sendToScheduler = async () => {
    if (!campaign || isGenerating) return;

    try {
      const sourcePayload = mode === 'manual' ? JSON.parse(manualJson || '{}') : campaign;

      const payload = !sourcePayload || !Array.isArray(sourcePayload.content_pieces) || !Object.keys(previewSelections).length
        ? sourcePayload
        : {
          ...sourcePayload,
          content_pieces: sourcePayload.content_pieces.map((piece, index) => {
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
        if (mode === 'manual') {
          setManualJson(JSON.stringify(result.campaign, null, 2));
        }
      }
      if (result.errors.length) {
        setSaveMessage(`Campaign saved and scheduled with validation errors: ${result.errors.join('; ')}`);
        setSaveErrors([]);
      } else if (result.warnings.length) {
        setSaveMessage(`Campaign saved and scheduled with warnings: ${result.warnings.join('; ')}`);
        setSaveErrors([]);
      } else {
        setSaveMessage('Campaign saved to the database and added to the scheduler.');
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
        setSaveErrors(parsedErrors);
      } else {
        setSaveMessage(rawMessage);
        setSaveErrors([]);
      }
    }
  };

  const primaryPiece = getPrimaryPiece(campaign);
  const previewText = primaryPiece?.copy?.body || primaryPiece?.copy?.caption || campaign?.notes || '';
  const previewCost = campaign?.metrics?.intent?.budget?.amount;
  const previewRecurrence = primaryPiece?.schedule?.recurrence || campaign?.scheduling?.campaign_window?.cadence_default || 'once';
  const previewTime = primaryPiece?.schedule?.publish_at
    ? new Date(primaryPiece.schedule.publish_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '-';

  return (
    <PageContainer>
      <Container>
        <Title>Campaign Generator</Title>

        <Layout>
          <Panel>
            <TabRow>
              <TabButton active={mode === 'auto'} onClick={() => setMode('auto')}>Auto Mock</TabButton>
              <TabButton active={mode === 'manual'} onClick={activateManual}>Manual</TabButton>
            </TabRow>

            <FieldLabel htmlFor="prompt-input">Prompt</FieldLabel>
            <PromptInput
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate"
            />

            {mode === 'auto' && (
              <>
                <FieldLabel>Platforms</FieldLabel>
                <PlatformGrid>
                  {PLATFORM_SELECTOR_OPTIONS.map((platform) => (
                    <PlatformToggle
                      key={platform}
                      type="button"
                      active={selectedPlatforms.includes(platform)}
                      onClick={() => togglePlatform(platform)}
                    >
                      {platform}
                    </PlatformToggle>
                  ))}
                </PlatformGrid>
                {selectedPlatforms.length === 0 && (
                  <div style={{ color: '#DC2626', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    Select at least one platform
                  </div>
                )}

                <SectionDivider />

                <CollapsibleHeader onClick={() => setShowProductForm((prev) => !prev)}>
                  <FieldLabel style={{ marginBottom: 0, cursor: 'pointer' }}>Affiliate Product</FieldLabel>
                  <span>{showProductForm ? '▼' : '▶'}</span>
                </CollapsibleHeader>

                {showProductForm && (
                  <>
                    <FieldLabel>Offer Name</FieldLabel>
                    <TextInput
                      value={offerName}
                      onChange={(e) => setOfferName(e.target.value)}
                      placeholder="Offer name"
                    />

                    <FieldLabel style={{ marginTop: '0.7rem' }}>Vendor</FieldLabel>
                    <TextInput
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="Vendor"
                    />

                    <FieldLabel style={{ marginTop: '0.7rem' }}>Affiliate Link</FieldLabel>
                    <TextInput
                      value={hoplink}
                      onChange={(e) => setHoplink(e.target.value)}
                      placeholder="https://"
                    />

                    <FieldLabel style={{ marginTop: '0.7rem' }}>Commission %</FieldLabel>
                    <NumberSelect
                      value={commission}
                      onChange={(e) => setCommission(Number(e.target.value))}
                    >
                      {[10, 20, 25, 30, 40, 50, 60, 75].map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </NumberSelect>
                  </>
                )}

                <SectionDivider />

                <FieldLabel>Content Variants per Platform</FieldLabel>
                <NumberSelect
                  value={numVariants}
                  onChange={(e) => setNumVariants(Number(e.target.value))}
                >
                  {[1, 3, 5].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </NumberSelect>

                <ActionRow>
                  <Button onClick={() => runGeneration(false)} disabled={isGenerating}>Create</Button>
                  <Button variant="secondary" onClick={() => runGeneration(true)} disabled={!canRegenerate}>Regenerate</Button>
                  <Button variant="ghost" onClick={sendToScheduler} disabled={!campaign || isGenerating}>Send To Scheduler</Button>
                </ActionRow>
              </>
            )}

            {mode === 'manual' && (
              <>
                <FieldLabel htmlFor="manual-json" style={{ marginTop: '0.9rem' }}>Campaign JSON</FieldLabel>
                <JsonArea
                  id="manual-json"
                  value={manualJson}
                  onChange={(e) => setManualJson(e.target.value)}
                  spellCheck={false}
                />

                <ActionRow>
                  <Button variant="ghost" onClick={sendToScheduler} disabled={!manualJson.trim()}>Send To Scheduler</Button>
                </ActionRow>
              </>
            )}

            {saveMessage && (
              <Notice>
                <strong>{saveMessage}</strong>
                {!!saveErrors.length && (
                  <List>
                    {saveErrors.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </List>
                )}
              </Notice>
            )}
          </Panel>

          <Viewport>
            <StatusText>{statusMessage}</StatusText>

            {!campaign && !isGenerating && (
              <Notice>
                Output viewport: generated campaign details will appear here after you click Create.
              </Notice>
            )}

            {campaign && (
              <>
                <Card>
                  <CardTitle>{campaign.name}</CardTitle>
                  <MetaRow>
                    <MetaPill>Time: {previewTime}</MetaPill>
                    <MetaPill>Cost: ${previewCost}</MetaPill>
                    <MetaPill>Interval: {previewRecurrence}</MetaPill>
                    <MetaPill>Platforms: {campaign.platforms.join(', ')}</MetaPill>
                    <MetaPill>Status: {campaign.status}</MetaPill>
                    <MetaPill>Version: {campaign.version}</MetaPill>
                  </MetaRow>
                  <BodyText>{previewText}</BodyText>
                </Card>

                <CampaignPlatformPreview
                  contentPieces={campaign.content_pieces}
                  selections={previewSelections}
                  onSelectionsChange={setPreviewSelections}
                />

                <Button
                  variant="ghost"
                  onClick={() => setShowRawJson((prev) => !prev)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {showRawJson ? 'Hide Raw JSON' : 'View Raw JSON'}
                </Button>

                {showRawJson && (
                  <Card>
                    <CardTitle>Campaign Contract JSON</CardTitle>
                    <JsonPreview>{JSON.stringify(campaign, null, 2)}</JsonPreview>
                  </Card>
                )}
              </>
            )}
          </Viewport>
        </Layout>
      </Container>
    </PageContainer>
  );
}
