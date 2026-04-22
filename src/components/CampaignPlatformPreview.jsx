import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { crm as C } from '../styles/crmTheme';

const PreviewShell = styled.div`
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 1rem;
  background: ${C.surface};
`;

const TabRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
`;

const VariantNavButton = styled.button`
  border: 1px solid ${C.border};
  background: transparent;
  color: ${C.text};
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
  color: ${C.muted};
`;

const InlineVariantSelector = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const InlineVariantLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${C.muted};
`;

const TabButton = styled.button`
  border: 1px solid ${C.border};
  background: ${props => (props.active ? C.accent : 'transparent')};
  color: ${props => (props.active ? C.bg : C.text)};
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
`;

const PreviewCard = styled.div`
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 1rem;
  background: ${C.card};
`;

const PlatformLabel = styled.div`
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${C.muted};
  margin-bottom: 0.55rem;
`;

const Headline = styled.h4`
  margin: 0;
  color: ${C.text};
  font-size: 1.05rem;
  font-weight: 800;
`;

const Body = styled.p`
  margin: 0.85rem 0 0 0;
  color: ${C.text};
  line-height: 1.5;
`;

const CtaButton = styled.button`
  margin-top: 0.9rem;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  cursor: default;
  background: ${C.accent};
  color: ${C.bg};
`;

const HashtagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.9rem;
`;

const MetaPill = styled.span`
  border: 1px solid ${C.border};
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;
  background: ${C.surface};
  color: ${C.text};
`;

const MediaPlaceholder = styled.div`
  margin-top: 1rem;
  min-height: 120px;
  border-radius: 10px;
  border: 1px dashed ${C.borderLight};
  background: ${C.surfaceAlt};
  color: ${C.text};
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
  color: ${C.muted};
`;

const DEFAULT_PLATFORM_SELECTIONS = {
  headline: 0,
  body: 0,
  cta: 0,
  hashtags: 0,
  imagePrompt: 0,
};

function clampVariantIndex(index, maxIndex = 0) {
  const safeIndex = Number.isInteger(index) ? index : 0;
  return Math.max(0, Math.min(maxIndex, safeIndex));
}

function getPlatformKey(piece, index) {
  return piece?.platform || `Platform ${index + 1}`;
}

function resolveSelectionsForPlatform(selections, platformKey) {
  const platformSelections = selections?.[platformKey] || {};
  return {
    headline: clampVariantIndex(platformSelections.headline, 2),
    body: clampVariantIndex(platformSelections.body, 2),
    cta: clampVariantIndex(platformSelections.cta, 2),
    hashtags: clampVariantIndex(platformSelections.hashtags, 2),
    imagePrompt: clampVariantIndex(platformSelections.imagePrompt, 2),
  };
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
    if (!activePlatformKey) {
      return;
    }
    setLocalSelections((prev) => ({
      ...prev,
      [activePlatformKey]: { ...DEFAULT_PLATFORM_SELECTIONS },
    }));
  }, [activePlatformKey]);

  const activeSelections = resolveSelectionsForPlatform(localSelections, activePlatformKey);

  const headlines = useMemo(
    () => (Array.isArray(activePiece?.copy?.headline) ? activePiece.copy.headline : [activePiece?.copy?.headline]),
    [activePiece],
  );
  const bodies = useMemo(() => {
    const bodySource = activePiece?.copy?.body;
    const captionSource = activePiece?.copy?.caption;
    if (Array.isArray(bodySource)) {
      return bodySource;
    }
    if (Array.isArray(captionSource)) {
      return captionSource;
    }
    return [bodySource || captionSource || 'No preview text available.'];
  }, [activePiece]);
  const ctaOptions = useMemo(
    () => (Array.isArray(activePiece?.cta_text) ? activePiece.cta_text : [activePiece?.cta_text]),
    [activePiece],
  );
  const hashtagSets = useMemo(() => {
    if (Array.isArray(activePiece?.hashtags?.[0])) {
      return activePiece.hashtags;
    }
    return [Array.isArray(activePiece?.hashtags) ? activePiece.hashtags : []];
  }, [activePiece]);
  const imagePrompts = useMemo(
    () => (Array.isArray(activePiece?.media?.image_prompt) ? activePiece.media.image_prompt : [activePiece?.media?.image_prompt]),
    [activePiece],
  );

  const selectedHeadline = headlines[activeSelections.headline] ?? headlines[0] ?? 'Campaign headline';
  const selectedBody = bodies[activeSelections.body] ?? bodies[0] ?? 'No preview text available.';
  const selectedCta = ctaOptions[activeSelections.cta] ?? ctaOptions[0] ?? 'Learn More';
  const selectedHashtags = hashtagSets[activeSelections.hashtags] ?? hashtagSets[0] ?? [];
  const selectedImagePrompt = imagePrompts[activeSelections.imagePrompt] ?? imagePrompts[0] ?? 'No image prompt provided';

  const variantTotals = {
    headline: Math.max(1, headlines.length),
    body: Math.max(1, bodies.length),
    cta: Math.max(1, ctaOptions.length),
    hashtags: Math.max(1, hashtagSets.length),
    imagePrompt: Math.max(1, imagePrompts.length),
  };

  const buildSelections = (indices) => ({
    [activePlatformKey]: {
      headline: headlines[indices.headline] ?? headlines[0],
      body: bodies[indices.body] ?? bodies[0],
      cta: ctaOptions[indices.cta] ?? ctaOptions[0],
      hashtags: hashtagSets[indices.hashtags] ?? hashtagSets[0],
      imagePrompt: imagePrompts[indices.imagePrompt] ?? imagePrompts[0],
    },
  });

  const updateSelection = (elementKey, direction) => {
    const total = variantTotals[elementKey] || 1;
    setLocalSelections((prev) => {
      const currentPlatformSelections = resolveSelectionsForPlatform(prev, activePlatformKey);
      const nextIndex = clampVariantIndex(currentPlatformSelections[elementKey] + direction, total - 1);

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
        onSelectionsChange(buildSelections(nextSelections[activePlatformKey]));
      }

      return nextSelections;
    });
  };

  const renderInlineSelector = (elementKey, total) => {
    const currentIndex = activeSelections[elementKey];
    const totalVariants = Math.max(1, total || 1);

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
        <InlineVariantLabel>{currentIndex + 1}/{totalVariants}</InlineVariantLabel>
        <VariantNavButton
          type="button"
          disabled={currentIndex >= totalVariants - 1}
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
            {renderInlineSelector('headline', variantTotals.headline)}
          </ElementHeader>
          <Headline>{selectedHeadline}</Headline>
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>Body</ElementLabel>
            {renderInlineSelector('body', variantTotals.body)}
          </ElementHeader>
          <Body>{selectedBody}</Body>
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>CTA</ElementLabel>
            {renderInlineSelector('cta', variantTotals.cta)}
          </ElementHeader>
          <CtaButton type="button">{selectedCta}</CtaButton>
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>Hashtags</ElementLabel>
            {renderInlineSelector('hashtags', variantTotals.hashtags)}
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
            {renderInlineSelector('imagePrompt', variantTotals.imagePrompt)}
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
