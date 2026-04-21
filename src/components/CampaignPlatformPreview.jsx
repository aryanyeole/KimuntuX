import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

const PreviewShell = styled.div`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 12px;
  padding: 1rem;
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
`;

const TabRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
`;

const VariantNavButton = styled.button`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  background: transparent;
  color: ${props => props.theme?.colors?.text || '#111111'};
  border-radius: 10px;
  padding: 0.2rem 0.5rem;
  min-width: 28px;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    opacity: 0.92;
  }
`;

const ElementBlock = styled.div`
  margin-top: 0.9rem;
`;

const ElementHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const ElementLabel = styled.span`
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.7;
`;

const InlineVariantSelector = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const InlineVariantLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.75;
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

const PreviewCard = styled.div`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 12px;
  padding: 1rem;
  background: ${props => props.theme?.colors?.background || '#f8f9fa'};
`;

const PlatformLabel = styled.div`
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.7;
  margin-bottom: 0.55rem;
`;

const Headline = styled.h4`
  margin: 0;
  color: ${props => props.theme?.colors?.text || '#111111'};
  font-size: 1.05rem;
  font-weight: 800;
`;

const Body = styled.p`
  margin: 0.85rem 0 0 0;
  color: ${props => props.theme?.colors?.text || '#111111'};
  line-height: 1.5;
`;

const CtaButton = styled.button`
  margin-top: 0.9rem;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  cursor: default;
  background: ${props => props.theme?.colors?.primary || '#00C896'};
  color: #ffffff;
`;

const HashtagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.9rem;
`;

const MetaPill = styled.span`
  border: 1px solid ${props => props.theme?.colors?.border || '#e5e5e5'};
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;
  background: ${props => props.theme?.colors?.cardBackground || '#ffffff'};
  color: ${props => props.theme?.colors?.text || '#111111'};
`;

const MediaPlaceholder = styled.div`
  margin-top: 1rem;
  min-height: 120px;
  border-radius: 10px;
  border: 1px dashed ${props => props.theme?.colors?.border || '#d1d5db'};
  background: ${props => props.theme?.colors?.background || '#f3f4f6'};
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  font-size: 0.9rem;
`;

const ComplianceLine = styled.div`
  margin-top: 0.85rem;
  font-size: 0.82rem;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.7;
`;

const DEFAULT_PLATFORM_SELECTIONS = {
  headline: 0,
  body: 0,
  cta: 0,
  hashtags: 0,
  imagePrompt: 0,
};

function clampVariantIndex(index) {
  const safeIndex = Number.isInteger(index) ? index : 0;
  return Math.max(0, Math.min(2, safeIndex));
}

function getPlatformKey(piece, index) {
  return piece?.platform || `Platform ${index + 1}`;
}

function getDefaultSelections(pieces) {
  return pieces.reduce((acc, piece, index) => {
    acc[getPlatformKey(piece, index)] = { ...DEFAULT_PLATFORM_SELECTIONS };
    return acc;
  }, {});
}

function buildVariants(value) {
  return [value, value, value];
}

function resolveSelectionsForPlatform(selections, platformKey) {
  const platformSelections = selections?.[platformKey] || {};
  return {
    headline: clampVariantIndex(platformSelections.headline),
    body: clampVariantIndex(platformSelections.body),
    cta: clampVariantIndex(platformSelections.cta),
    hashtags: clampVariantIndex(platformSelections.hashtags),
    imagePrompt: clampVariantIndex(platformSelections.imagePrompt),
  };
}

function mergeSelectionsIntoDefaults(defaultSelections, providedSelections) {
  return Object.keys(defaultSelections).reduce((acc, platformKey) => {
    acc[platformKey] = resolveSelectionsForPlatform(providedSelections, platformKey);
    return acc;
  }, {});
}

export default function CampaignPlatformPreview({ contentPieces = [], selections = {}, onSelectionsChange }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [localSelections, setLocalSelections] = useState({});

  const normalizedPieces = useMemo(
    () => (Array.isArray(contentPieces) ? contentPieces.filter(Boolean) : []),
    [contentPieces],
  );

  const activePiece = normalizedPieces[activeIndex] || normalizedPieces[0] || null;
  const activePlatformKey = activePiece ? getPlatformKey(activePiece, activeIndex) : '';

  useEffect(() => {
    if (!normalizedPieces.length) {
      setLocalSelections({});
      return;
    }

    const defaults = getDefaultSelections(normalizedPieces);
    setLocalSelections(mergeSelectionsIntoDefaults(defaults, selections));
  }, [normalizedPieces, selections]);

  const activeSelections = resolveSelectionsForPlatform(localSelections, activePlatformKey);

  const headlineVariants = useMemo(
    () => buildVariants(activePiece?.copy?.headline || 'Campaign headline'),
    [activePiece],
  );
  const bodyVariants = useMemo(
    () => buildVariants(activePiece?.copy?.body || activePiece?.copy?.caption || 'No preview text available.'),
    [activePiece],
  );
  const ctaVariants = useMemo(
    () => buildVariants(activePiece?.copy?.cta_text || activePiece?.cta_text || 'Learn More'),
    [activePiece],
  );
  const hashtagsVariants = useMemo(
    () => buildVariants(Array.isArray(activePiece?.hashtags) ? activePiece.hashtags : []),
    [activePiece],
  );
  const imagePromptVariants = useMemo(
    () => buildVariants(activePiece?.media?.image_prompt || 'No image prompt provided'),
    [activePiece],
  );

  const selectedHeadline = headlineVariants[activeSelections.headline] || headlineVariants[0];
  const selectedBody = bodyVariants[activeSelections.body] || bodyVariants[0];
  const selectedCta = ctaVariants[activeSelections.cta] || ctaVariants[0];
  const selectedHashtags = hashtagsVariants[activeSelections.hashtags] || hashtagsVariants[0];
  const selectedImagePrompt = imagePromptVariants[activeSelections.imagePrompt] || imagePromptVariants[0];

  const updateSelection = (elementKey, direction) => {
    setLocalSelections((prev) => {
      const currentPlatformSelections = resolveSelectionsForPlatform(prev, activePlatformKey);
      const nextIndex = clampVariantIndex(currentPlatformSelections[elementKey] + direction);

      if (currentPlatformSelections[elementKey] === nextIndex) {
        return prev;
      }

      const nextSelections = {
        ...prev,
        [activePlatformKey]: {
          ...currentPlatformSelections,
          [elementKey]: nextIndex,
        },
      };

      if (typeof onSelectionsChange === 'function') {
        onSelectionsChange(nextSelections);
      }

      return nextSelections;
    });
  };

  const renderInlineSelector = (elementKey) => {
    const currentIndex = activeSelections[elementKey];

    return (
      <InlineVariantSelector>
        <VariantNavButton
          type="button"
          disabled={currentIndex === 0}
          onClick={() => updateSelection(elementKey, -1)}
          aria-label={`Previous ${elementKey} variant`}
        >
          {'‹'}
        </VariantNavButton>
        <InlineVariantLabel>{currentIndex + 1}/3</InlineVariantLabel>
        <VariantNavButton
          type="button"
          disabled={currentIndex === 2}
          onClick={() => updateSelection(elementKey, 1)}
          aria-label={`Next ${elementKey} variant`}
        >
          {'›'}
        </VariantNavButton>
      </InlineVariantSelector>
    );
  };

  if (!normalizedPieces.length || !activePiece) {
    return null;
  }

  return (
    <PreviewShell>
      <TabRow>
        {normalizedPieces.map((piece, index) => (
          <TabButton
            key={piece.piece_id || piece.id || `${piece.platform}-${index}`}
            type="button"
            active={index === activeIndex}
            onClick={() => setActiveIndex(index)}
          >
            {piece.platform || `Platform ${index + 1}`}
          </TabButton>
        ))}
      </TabRow>

      <PreviewCard>
        <PlatformLabel>{activePiece.platform || 'Platform'}</PlatformLabel>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>Headline</ElementLabel>
            {renderInlineSelector('headline')}
          </ElementHeader>
          <Headline>{selectedHeadline}</Headline>
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>Body</ElementLabel>
            {renderInlineSelector('body')}
          </ElementHeader>
          <Body>{selectedBody}</Body>
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>CTA</ElementLabel>
            {renderInlineSelector('cta')}
          </ElementHeader>
          <CtaButton type="button">{selectedCta}</CtaButton>
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>Hashtags</ElementLabel>
            {renderInlineSelector('hashtags')}
          </ElementHeader>
          <HashtagRow>
            {Array.isArray(selectedHashtags) && selectedHashtags.length > 0 ? (
              selectedHashtags.map((hashtag) => (
                <MetaPill key={hashtag}>{hashtag}</MetaPill>
              ))
            ) : (
              <MetaPill>#campaign</MetaPill>
            )}
          </HashtagRow>
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>Image Prompt</ElementLabel>
            {renderInlineSelector('imagePrompt')}
          </ElementHeader>
          <MediaPlaceholder>
            <em>Image: {selectedImagePrompt}</em>
          </MediaPlaceholder>
        </ElementBlock>

        <ComplianceLine>
          {(activePiece.compliance?.disclosures || []).join(' • ') || 'No disclosures provided'}
        </ComplianceLine>
      </PreviewCard>
    </PreviewShell>
  );
}
