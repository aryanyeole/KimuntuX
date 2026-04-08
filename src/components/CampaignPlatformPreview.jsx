import React, { useMemo, useState } from 'react';
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

const Hook = styled.p`
  margin: 0.35rem 0 0 0;
  color: ${props => props.theme?.colors?.text || '#111111'};
  opacity: 0.72;
  font-size: 0.92rem;
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

export default function CampaignPlatformPreview({ contentPieces = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const normalizedPieces = useMemo(
    () => (Array.isArray(contentPieces) ? contentPieces.filter(Boolean) : []),
    [contentPieces],
  );

  const activePiece = normalizedPieces[activeIndex] || normalizedPieces[0] || null;

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
        <Headline>{activePiece.copy?.headline || 'Campaign headline'}</Headline>
        {activePiece.copy?.hook && <Hook>{activePiece.copy.hook}</Hook>}
        <Body>{activePiece.copy?.body || activePiece.copy?.caption || 'No preview text available.'}</Body>
        <CtaButton type="button">{activePiece.cta_text || 'Learn More'}</CtaButton>

        <HashtagRow>
          {Array.isArray(activePiece.hashtags) && activePiece.hashtags.length > 0 ? (
            activePiece.hashtags.map((hashtag) => (
              <MetaPill key={hashtag}>{hashtag}</MetaPill>
            ))
          ) : (
            <MetaPill>#campaign</MetaPill>
          )}
        </HashtagRow>

        <MediaPlaceholder>
          <em>Image: {activePiece.media?.image_prompt || 'No image prompt provided'}</em>
        </MediaPlaceholder>

        <ComplianceLine>
          {(activePiece.compliance?.disclosures || []).join(' • ') || 'No disclosures provided'}
        </ComplianceLine>
      </PreviewCard>
    </PreviewShell>
  );
}
