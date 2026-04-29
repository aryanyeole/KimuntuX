import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { getAccessToken } from '../services/authService';
import { crm as C } from '../styles/crmTheme';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.03); }
`;

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
  background: ${props => (props.$active ? C.accent : 'transparent')};
  color: ${props => (props.$active ? C.bg : C.text)};
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

const FieldShell = styled.div`
  cursor: text;
  display: block;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: ${C.border};
    border-style: dashed;
  }
`;

const HeadlineDisplay = styled.h4`
  margin: 0;
  color: ${C.text};
  font-size: 1.05rem;
  font-weight: 800;
`;

const HeadlineInput = styled.input`
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: ${C.text};
  font-size: 1.05rem;
  font-weight: 800;
  padding: 0;
  margin: 0;
  font-family: inherit;
`;

const BodyDisplay = styled.p`
  margin: 0.85rem 0 0 0;
  color: ${C.text};
  line-height: 1.5;
  white-space: pre-wrap;
`;

const BodyTextarea = styled.textarea`
  width: 100%;
  min-height: 96px;
  resize: vertical;
  border: none;
  outline: none;
  background: transparent;
  color: ${C.text};
  font-size: 1rem;
  line-height: 1.5;
  padding: 0;
  margin-top: 0.85rem;
  font-family: inherit;
`;

const CtaDisplay = styled.div`
  display: inline-flex;
  align-items: center;
  margin-top: 0.9rem;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  background: ${C.accent};
  color: ${C.bg};
`;

const CtaInput = styled.input`
  width: 100%;
  border: none;
  outline: none;
  background: ${C.accent};
  color: ${C.bg};
  border-radius: 10px;
  padding: 0.7rem 1rem;
  margin-top: 0.9rem;
  font-weight: 700;
  font-size: 1rem;
  font-family: inherit;
`;

const HashtagDisplay = styled.div`
  margin-top: 0.9rem;
  color: ${C.text};
  line-height: 1.5;
  font-size: 0.92rem;
  white-space: pre-wrap;
`;

const HashtagInput = styled.input`
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: ${C.text};
  font-size: 0.92rem;
  line-height: 1.5;
  padding: 0;
  margin-top: 0.9rem;
  font-family: inherit;
`;

const PromptDisplay = styled.div`
  margin-top: 0.25rem;
  color: ${C.text};
  line-height: 1.45;
  font-size: 0.92rem;
  white-space: pre-wrap;
`;

const PromptInput = styled.input`
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: ${C.text};
  font-size: 0.92rem;
  line-height: 1.45;
  padding: 0;
  margin-top: 0.25rem;
  font-family: inherit;
`;

const ImageSection = styled.div`
  margin-top: 1rem;
`;

const ImageStateBox = styled.div`
  border: 2px dashed ${C.border};
  border-radius: 8px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: ${C.card};
  padding: 16px;
  text-align: center;
`;

const ImageReadyFrame = styled.div`
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  background: ${C.surface};
  border: 1px solid ${C.border};
`;

const GeneratedImage = styled.img`
  display: block;
  width: 100%;
  object-fit: cover;
  max-height: 280px;
`;

const ImageActions = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const GhostActionButton = styled.button`
  flex: 1;
  background: none;
  border: 1px solid ${C.border};
  color: ${C.muted};
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 11px;
  cursor: pointer;
  font-weight: 600;

  &:hover:not(:disabled) {
    border-color: ${C.accent};
    color: ${C.text};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const PrimaryActionButton = styled.button`
  background: ${C.accent};
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const UploadButton = styled(PrimaryActionButton)`
  background: none;
  border: 1px solid ${C.border};
  color: ${C.muted};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const LoadingFrame = styled(ImageStateBox)`
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${C.border};
  border-top-color: ${C.accent};
  animation: ${spin} 0.85s linear infinite;
`;

const StatusText = styled.div`
  font-size: 12px;
  color: ${C.muted};
`;

const ErrorText = styled.div`
  margin-top: 0.5rem;
  font-size: 12px;
  color: #d9534f;
`;

const ComplianceLine = styled.div`
  margin-top: 0.85rem;
  font-size: 0.82rem;
  color: ${C.muted};
`;

const SaveButton = styled.button`
  background: ${C.accent};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: 12px;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const SavedText = styled.div`
  margin-top: 8px;
  font-size: 12px;
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

function arrayToString(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function splitCommaSeparated(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function ImagePlaceholderIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.75A1.75 1.75 0 0 1 5.75 4h12.5A1.75 1.75 0 0 1 20 5.75v12.5A1.75 1.75 0 0 1 18.25 20H5.75A1.75 1.75 0 0 1 4 18.25V5.75Z"
        stroke={C.muted}
        strokeWidth="1.5"
      />
      <path
        d="m7 15 2.8-2.8a1 1 0 0 1 1.41 0L14 14.99l1.3-1.3a1 1 0 0 1 1.41 0L19 16"
        stroke={C.muted}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 10.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
        fill={C.muted}
      />
    </svg>
  );
}

export default function CampaignPlatformPreview({
  contentPieces = [],
  selections = {},
  onSelectionsChange,
  onDirtyChange,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [localSelections, setLocalSelections] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [draftValue, setDraftValue] = useState('');
  const [generatedImages, setGeneratedImages] = useState({});
  const [imageStatuses, setImageStatuses] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [saveConfirmationVisible, setSaveConfirmationVisible] = useState(false);
  const saveConfirmationRef = useRef(null);
  const uploadInputRef = useRef(null);

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

    setLocalSelections((prev) => {
      if (prev[activePlatformKey]) {
        return prev;
      }

      return {
        ...prev,
        [activePlatformKey]: { ...DEFAULT_PLATFORM_SELECTIONS },
      };
    });
    setEditingField(null);
    setDraftValue('');
    setSaveConfirmationVisible(false);
    if (typeof onDirtyChange === 'function') {
      onDirtyChange(false);
    }
  }, [activePlatformKey]);

  useEffect(() => () => {
    if (saveConfirmationRef.current) {
      clearTimeout(saveConfirmationRef.current);
    }
  }, []);

  const activeSelections = resolveSelectionsForPlatform(localSelections, activePlatformKey);
  const platformEdits = editedValues?.[activePlatformKey] || {};

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

  const currentVariantValues = {
    headline: selectedHeadline,
    body: selectedBody,
    cta: selectedCta,
    hashtags: arrayToString(selectedHashtags),
    imagePrompt: selectedImagePrompt,
  };

  const currentImageUrl = generatedImages[activePlatformKey] ?? null;
  const currentImageStatus = imageStatuses[activePlatformKey] || (currentImageUrl ? 'ready' : 'idle');
  const currentImageError = imageErrors[activePlatformKey] || '';
  const hasCurrentEdits = Boolean(platformEdits && Object.keys(platformEdits).length);

  const variantTotals = {
    headline: Math.max(1, headlines.length),
    body: Math.max(1, bodies.length),
    cta: Math.max(1, ctaOptions.length),
    hashtags: Math.max(1, hashtagSets.length),
    imagePrompt: Math.max(1, imagePrompts.length),
  };

  const getCommittedEditedValues = () => {
    if (!editingField || !activePlatformKey) {
      return editedValues;
    }

    return {
      ...editedValues,
      [activePlatformKey]: {
        ...(editedValues[activePlatformKey] || {}),
        [editingField]: draftValue,
      },
    };
  };

  const emitSelections = (
    variantValues,
    nextEditedValues = editedValues,
    imageUrl = currentImageUrl,
    platformKey = activePlatformKey,
  ) => {
    if (typeof onSelectionsChange !== 'function' || !platformKey) {
      return;
    }

    const platformSelection = nextEditedValues?.[platformKey] || {};
    const merged = {
      [platformKey]: {
        headline: platformSelection.headline ?? variantValues.headline,
        body: platformSelection.body ?? variantValues.body,
        cta: platformSelection.cta ?? variantValues.cta,
        hashtags: platformSelection.hashtags
          ? splitCommaSeparated(platformSelection.hashtags)
          : (Array.isArray(variantValues.hashtags) ? variantValues.hashtags : splitCommaSeparated(variantValues.hashtags)),
        imagePrompt: platformSelection.imagePrompt ?? variantValues.imagePrompt,
        imageUrl: imageUrl ?? null,
      },
    };

    onSelectionsChange(merged);
  };

  const buildVariantValuesForSelection = (indices) => ({
    headline: headlines[indices.headline] ?? headlines[0] ?? 'Campaign headline',
    body: bodies[indices.body] ?? bodies[0] ?? 'No preview text available.',
    cta: ctaOptions[indices.cta] ?? ctaOptions[0] ?? 'Learn More',
    hashtags: arrayToString(hashtagSets[indices.hashtags] ?? hashtagSets[0] ?? []),
    imagePrompt: imagePrompts[indices.imagePrompt] ?? imagePrompts[0] ?? 'No image prompt provided',
  });

  const startEditingField = (fieldKey) => {
    setEditingField(fieldKey);
    setDraftValue(currentVariantValues[fieldKey] ?? '');
    setSaveConfirmationVisible(false);
    if (typeof onDirtyChange === 'function') {
      onDirtyChange(true);
    }
  };

  const commitActiveField = () => {
    if (!editingField || !activePlatformKey) {
      return editedValues;
    }

    const nextPlatformEdits = {
      ...(editedValues[activePlatformKey] || {}),
      [editingField]: draftValue,
    };

    const nextEditedValues = {
      ...editedValues,
      [activePlatformKey]: nextPlatformEdits,
    };

    setEditedValues(nextEditedValues);
    setEditingField(null);
    setDraftValue('');

    return nextEditedValues;
  };

  const handleFieldBlur = () => {
    commitActiveField();
  };

  const handleEditKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.currentTarget.blur();
      return;
    }

    if (event.key === 'Enter' && event.currentTarget.tagName !== 'TEXTAREA') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const handleSelectionChange = (elementKey, direction) => {
    const total = variantTotals[elementKey] || 1;
    const currentPlatformSelections = resolveSelectionsForPlatform(localSelections, activePlatformKey);
    const nextIndex = clampVariantIndex(currentPlatformSelections[elementKey] + direction, total - 1);

    if (currentPlatformSelections[elementKey] === nextIndex) {
      return;
    }

    const nextPlatformSelections = {
      ...currentPlatformSelections,
      [elementKey]: nextIndex,
    };

    const nextLocalSelections = {
      ...localSelections,
      [activePlatformKey]: nextPlatformSelections,
    };

    const nextEditedValues = { ...editedValues };
    if (nextEditedValues[activePlatformKey]) {
      const nextPlatformEdits = { ...nextEditedValues[activePlatformKey] };
      delete nextPlatformEdits[elementKey];
      if (Object.keys(nextPlatformEdits).length > 0) {
        nextEditedValues[activePlatformKey] = nextPlatformEdits;
      } else {
        delete nextEditedValues[activePlatformKey];
      }
    }

    const nextVariantValues = buildVariantValuesForSelection(nextPlatformSelections);

    setLocalSelections(nextLocalSelections);
    setEditedValues(nextEditedValues);
    if (editingField === elementKey) {
      setEditingField(null);
      setDraftValue('');
    }

    if (typeof onDirtyChange === 'function') {
      onDirtyChange(true);
    }

    emitSelections(nextVariantValues, nextEditedValues, currentImageUrl);
  };

  const renderInlineSelector = (elementKey, total) => {
    const currentIndex = activeSelections[elementKey];
    const totalVariants = Math.max(1, total || 1);

    return (
      <InlineVariantSelector>
        <VariantNavButton
          type="button"
          disabled={currentIndex === 0}
          onClick={() => handleSelectionChange(elementKey, -1)}
          aria-label={`Previous ${elementKey} variant`}
        >
          {'‹'}
        </VariantNavButton>
        <InlineVariantLabel>{currentIndex + 1}/{totalVariants}</InlineVariantLabel>
        <VariantNavButton
          type="button"
          disabled={currentIndex >= totalVariants - 1}
          onClick={() => handleSelectionChange(elementKey, 1)}
          aria-label={`Next ${elementKey} variant`}
        >
          {'›'}
        </VariantNavButton>
      </InlineVariantSelector>
    );
  };

  const renderEditableField = ({ fieldKey, display, displayNode, inputType = 'input', multiline = false }) => {
    const isEditing = editingField === fieldKey;
    const value = isEditing ? draftValue : display;

    if (isEditing) {
      if (multiline) {
        return (
          <BodyTextarea
            autoFocus
            value={value}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={handleFieldBlur}
            onKeyDown={handleEditKeyDown}
          />
        );
      }

      if (inputType === 'cta') {
        return (
          <CtaInput
            autoFocus
            value={value}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={handleFieldBlur}
            onKeyDown={handleEditKeyDown}
          />
        );
      }

      if (inputType === 'prompt') {
        return (
          <PromptInput
            autoFocus
            value={value}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={handleFieldBlur}
            onKeyDown={handleEditKeyDown}
          />
        );
      }

      if (inputType === 'hashtags') {
        return (
          <HashtagInput
            autoFocus
            value={value}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={handleFieldBlur}
            onKeyDown={handleEditKeyDown}
          />
        );
      }

      return (
        <HeadlineInput
          autoFocus
          value={value}
          onChange={(event) => setDraftValue(event.target.value)}
          onBlur={handleFieldBlur}
          onKeyDown={handleEditKeyDown}
        />
      );
    }

    return (
      <FieldShell onClick={() => startEditingField(fieldKey)} role="button" tabIndex={0}>
        {displayNode}
      </FieldShell>
    );
  };

  const handleSaveChanges = () => {
    const nextEditedValues = commitActiveField();
    emitSelections(currentVariantValues, nextEditedValues, currentImageUrl);
    setSaveConfirmationVisible(true);
    if (typeof onDirtyChange === 'function') {
      onDirtyChange(false);
    }

    if (saveConfirmationRef.current) {
      clearTimeout(saveConfirmationRef.current);
    }

    saveConfirmationRef.current = setTimeout(() => {
      setSaveConfirmationVisible(false);
    }, 2000);
  };

  const updateImageState = (nextStatus, errorMessage = '', platformKey = activePlatformKey) => {
    setImageStatuses((prev) => ({
      ...prev,
      [platformKey]: nextStatus,
    }));

    setImageErrors((prev) => ({
      ...prev,
      [platformKey]: errorMessage,
    }));
  };

  const fetchGeneratedImage = async (prompt, platform) => {
    const token = getAccessToken();

    if (!token) {
      throw new Error('Your session has expired. Please log in again.');
    }

    const response = await fetch(`${API_BASE_URL}/campaigns/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt, platform }),
    });

    const text = await response.text();
    let payload = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { detail: text };
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const detail = payload?.detail;
      if (typeof detail === 'string' && detail.trim()) {
        throw new Error(detail);
      }

      throw new Error('Image generation failed.');
    }

    return payload?.image_url || '';
  };

  const handleGenerateImage = async () => {
    const platformKey = activePlatformKey;
    const committedEdits = getCommittedEditedValues();
    const variantValues = { ...currentVariantValues };
    const prompt = committedEdits?.[platformKey]?.imagePrompt || currentVariantValues.imagePrompt || selectedImagePrompt || '';
    updateImageState('generating', '', platformKey);

    try {
      const imageUrl = await fetchGeneratedImage(prompt, platformKey);
      setGeneratedImages((prev) => ({
        ...prev,
        [platformKey]: imageUrl,
      }));
      updateImageState('ready', '', platformKey);
      emitSelections(variantValues, committedEdits, imageUrl, platformKey);
      if (typeof onDirtyChange === 'function') {
        onDirtyChange(true);
      }
    } catch (error) {
      const message = error?.message || 'Unable to generate image.';
      setGeneratedImages((prev) => {
        const nextImages = { ...prev };
        delete nextImages[platformKey];
        return nextImages;
      });
      updateImageState('idle', message, platformKey);
      if (typeof onDirtyChange === 'function') {
        onDirtyChange(true);
      }
      window.setTimeout(() => {
        setImageErrors((prev) => ({
          ...prev,
          [platformKey]: '',
        }));
      }, 2200);
    }
  };

  const handleUploadButtonClick = () => {
    if (uploadInputRef.current) {
      uploadInputRef.current.click();
    }
  };

  const handleUploadImage = (event) => {
    const platformKey = activePlatformKey;
    const committedEdits = getCommittedEditedValues();
    const variantValues = { ...currentVariantValues };
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!imageUrl) {
        return;
      }

      setGeneratedImages((prev) => ({
        ...prev,
        [platformKey]: imageUrl,
      }));
      updateImageState('ready', '', platformKey);
      emitSelections(variantValues, committedEdits, imageUrl, platformKey);
      if (typeof onDirtyChange === 'function') {
        onDirtyChange(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    const platformKey = activePlatformKey;
    const committedEdits = getCommittedEditedValues();
    const variantValues = { ...currentVariantValues };
    setGeneratedImages((prev) => {
      const nextImages = { ...prev };
      delete nextImages[platformKey];
      return nextImages;
    });
    updateImageState('idle', '', platformKey);
    emitSelections(variantValues, committedEdits, null, platformKey);
    if (typeof onDirtyChange === 'function') {
      onDirtyChange(true);
    }
  };

  const renderImageSection = () => {
    if (currentImageStatus === 'generating') {
      return (
        <LoadingFrame>
          <Spinner />
          <StatusText>Generating image...</StatusText>
        </LoadingFrame>
      );
    }

    if (currentImageStatus === 'ready' && currentImageUrl) {
      return (
        <div>
          <ImageReadyFrame>
            <GeneratedImage src={currentImageUrl} alt={`${activePlatformKey} creative`} />
          </ImageReadyFrame>
          <ImageActions style={{ marginTop: '8px' }}>
            <GhostActionButton type="button" disabled>
              Regenerate - Coming Soon
            </GhostActionButton>
            <GhostActionButton type="button" onClick={handleRemoveImage}>Remove</GhostActionButton>
          </ImageActions>
        </div>
      );
    }

    return (
      <ImageStateBox>
        <ImagePlaceholderIcon />
        <StatusText>No image yet</StatusText>
        <ButtonRow>
          <PrimaryActionButton type="button" disabled>
            Generate Image - Coming Soon
          </PrimaryActionButton>
          <UploadButton type="button" onClick={handleUploadButtonClick}>Upload Image</UploadButton>
        </ButtonRow>
      </ImageStateBox>
    );
  };

  if (!normalizedPieces.length || !activePiece) {
    return null;
  }

  const displayHeadline = editingField === 'headline' ? draftValue : (platformEdits.headline ?? currentVariantValues.headline);
  const displayBody = editingField === 'body' ? draftValue : (platformEdits.body ?? currentVariantValues.body);
  const displayCta = editingField === 'cta' ? draftValue : (platformEdits.cta ?? currentVariantValues.cta);
  const displayHashtags = editingField === 'hashtags' ? draftValue : (platformEdits.hashtags ?? currentVariantValues.hashtags);
  const displayImagePrompt = editingField === 'imagePrompt' ? draftValue : (platformEdits.imagePrompt ?? currentVariantValues.imagePrompt);

  return (
    <PreviewShell>
      <TabRow>
        {normalizedPieces.map((piece, index) => (
          <TabButton
            key={piece.piece_id || piece.id || `${piece.platform}-${index}`}
            type="button"
            $active={index === activeIndex}
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
          {renderEditableField({
            fieldKey: 'headline',
            display: displayHeadline,
            displayNode: <HeadlineDisplay>{displayHeadline || 'Campaign headline'}</HeadlineDisplay>,
          })}
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>Body</ElementLabel>
            {renderInlineSelector('body', variantTotals.body)}
          </ElementHeader>
          {renderEditableField({
            fieldKey: 'body',
            display: displayBody,
            displayNode: <BodyDisplay>{displayBody || 'No preview text available.'}</BodyDisplay>,
            multiline: true,
          })}
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>CTA</ElementLabel>
            {renderInlineSelector('cta', variantTotals.cta)}
          </ElementHeader>
          {renderEditableField({
            fieldKey: 'cta',
            display: displayCta,
            displayNode: <CtaDisplay>{displayCta || 'Learn More'}</CtaDisplay>,
            inputType: 'cta',
          })}
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>Hashtags</ElementLabel>
            {renderInlineSelector('hashtags', variantTotals.hashtags)}
          </ElementHeader>
          {renderEditableField({
            fieldKey: 'hashtags',
            display: displayHashtags,
            displayNode: <HashtagDisplay>{displayHashtags || '#campaign'}</HashtagDisplay>,
            inputType: 'hashtags',
          })}
        </ElementBlock>

        <ElementBlock>
          <ElementHeader>
            <ElementLabel>Image Prompt</ElementLabel>
            {renderInlineSelector('imagePrompt', variantTotals.imagePrompt)}
          </ElementHeader>
          {renderEditableField({
            fieldKey: 'imagePrompt',
            display: displayImagePrompt,
            displayNode: <PromptDisplay>{displayImagePrompt || 'No image prompt provided'}</PromptDisplay>,
            inputType: 'prompt',
          })}

          <ImageSection>
            {renderImageSection()}
            {currentImageError ? <ErrorText>{currentImageError}</ErrorText> : null}
          </ImageSection>
        </ElementBlock>

        <ComplianceLine>
          {(activePiece.compliance?.disclosures || []).join(' • ') || 'No disclosures provided'}
        </ComplianceLine>

        <SaveButton type="button" onClick={handleSaveChanges} disabled={!hasCurrentEdits}>Save Changes</SaveButton>
        {saveConfirmationVisible ? <SavedText>Changes saved</SavedText> : null}

        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleUploadImage}
        />
      </PreviewCard>
    </PreviewShell>
  );
}