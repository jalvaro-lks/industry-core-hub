/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 *
 * Copyright (c) 2026 LKS Next
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import React, { useCallback, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, InputAdornment, InputBase, Tooltip, Typography } from '@mui/material';
import { Apps, Clear, Close, DragIndicator, Lock, Mouse, OpenWith, Search, TouchApp } from '@mui/icons-material';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslatedKits } from '@/hooks/useTranslatedKits';
import { useFeatures } from '@/contexts/FeatureContext';
import { useTranslation } from 'react-i18next';
import { kitThemes } from '@/theme/colors';
import { KitFeatureItem } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const GUIDE_KIT_ORDER = [
  'industry-core',
  'business-partner',
  'eco-pass',
  'pcf',
  'traceability',
];

const KIT_COLOR_MAP: Record<string, string> = {
  'industry-core': kitThemes.industryCore.gradientStart,
  'business-partner': kitThemes.businessPartner.gradientStart,
  'eco-pass': kitThemes.ecoPass.gradientStart,
  'pcf': kitThemes.pcf.gradientStart,
  'data-governance': kitThemes.dataGovernance.gradientStart,
  'data-chain': kitThemes.dataChain.gradientStart,
  'dcm': kitThemes.dcm.gradientStart,
  'traceability': kitThemes.traceability.gradientStart,
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AllFeaturesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FlatFeature extends KitFeatureItem {
  kitId: string;
  kitColor: string;
  kitColorRgb: string;
  isComingSoon: boolean;
  connectLeft: boolean;
  connectRight: boolean;
}

// ─── Static KIT guide item ────────────────────────────────────────────────────

interface KitGuideItemProps {
  kitId: string;
  kitName: string;
  kitColor: string;
  isComingSoon: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const KitGuideItem: React.FC<KitGuideItemProps> = ({
  kitName,
  kitColor,
  isComingSoon,
  isHighlighted,
  isSelected,
  onClick,
}) => (
  <Box
    className={[
      'afp-kit-guide-item',
      isComingSoon ? 'coming-soon' : '',
      isHighlighted ? 'highlighted' : '',
      isSelected ? 'selected' : '',
    ]
      .filter(Boolean)
      .join(' ')}
    onClick={onClick}
  >
    <Box className="afp-kit-dot" sx={{ background: kitColor }} />
    <Typography className="afp-kit-guide-name">{kitName}</Typography>
  </Box>
);

// ─── Sortable feature card ────────────────────────────────────────────────────

interface FeatureCardProps {
  feature: FlatFeature;
  isEnabled: boolean;
  isHighlighted: boolean;
  onNavigate: () => void;
  onRightClick: (e: React.MouseEvent) => void;
  onDisabledClick?: (e: React.MouseEvent) => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  isEnabled,
  isHighlighted,
  onNavigate,
  onRightClick,
  onDisabledClick,
}) => {
  // Coming-soon features are not draggable; everything else (enabled or disabled) is
  const canDrag = !feature.isComingSoon;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: feature.id,
    disabled: !canDrag,
  });

  const borderRadius =
    feature.connectLeft && feature.connectRight
      ? '4px'
      : feature.connectLeft
      ? '4px 10px 10px 4px'
      : feature.connectRight
      ? '10px 4px 4px 10px'
      : '10px';

  const cardStyle: React.CSSProperties = {
    ['--kit-color-rgb' as string]: feature.kitColorRgb,
    background: `rgba(${feature.kitColorRgb}, 0.22)`,
    border: `1px solid rgba(${feature.kitColorRgb}, 0.35)`,
    borderRadius,
    marginRight: feature.connectRight ? '2px' : '8px',
    marginBottom: '8px',
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : undefined,
  };

  const classes = [
    'afp-card',
    isEnabled ? 'enabled' : 'disabled-feature',
    feature.isComingSoon ? 'coming-soon' : '',
    feature.default ? 'is-default' : '',
    isHighlighted ? 'highlighted' : '',
    canDrag ? 'draggable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (e: React.MouseEvent) => {
    if (feature.isComingSoon) return;
    if (!isEnabled) {
      onDisabledClick?.(e);
      return;
    }
    onNavigate();
  };

  const card = (
    <Box
      ref={setNodeRef}
      className={classes}
      style={cardStyle}
      onClick={e => handleClick(e as React.MouseEvent)}
      onContextMenu={onRightClick}
      {...attributes}
    >
      {feature.isComingSoon && (
        <Box className="afp-card-lock">
          <Lock sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)' }} />
        </Box>
      )}

      {/* Centered drag handle — visible on hover, only draggable cards */}
      {canDrag && (
        <Box
          className="afp-card-drag-handle"
          {...listeners}
        >
          <DragIndicator sx={{ fontSize: '1rem' }} />
        </Box>
      )}

      <Box className="afp-card-icon">
        {feature.icon
          ? React.cloneElement(
              feature.icon as React.ReactElement<{ style?: React.CSSProperties }>,
              { style: { width: '1.5rem', height: '1.5rem' } }
            )
          : null}
      </Box>
      <Typography className="afp-card-name">{feature.name}</Typography>
    </Box>
  );

  if (feature.isComingSoon) {
    return (
      <Tooltip title={feature.name} placement="top" arrow>
        {card}
      </Tooltip>
    );
  }

  return card;
};

// ─── Drag overlay ghost card ──────────────────────────────────────────────────

const GhostCard: React.FC<{ feature: FlatFeature }> = ({ feature }) => (
  <Box
    className="afp-card enabled draggable drag-ghost"
    style={{
      ['--kit-color-rgb' as string]: feature.kitColorRgb,
      width: '90px',
      padding: '10px 6px 9px',
      background: `rgba(${feature.kitColorRgb}, 0.35)`,
      border: `1px solid rgba(${feature.kitColorRgb}, 0.7)`,
      borderRadius: '10px',
      marginRight: '8px',
      marginBottom: '8px',
      transform: 'scale(1.06) rotate(1.5deg)',
      boxShadow: `0 10px 28px rgba(0,0,0,0.45)`,
      cursor: 'grabbing',
    }}
  >
    <Box className="afp-card-icon">
      {feature.icon
        ? React.cloneElement(
            feature.icon as React.ReactElement<{ style?: React.CSSProperties }>,
            { style: { width: '1.5rem', height: '1.5rem' } }
          )
        : null}
    </Box>
    <Typography className="afp-card-name">{feature.name}</Typography>
  </Box>
);

// ─── Locked tooltip ───────────────────────────────────────────────────────────

interface LockedTooltipState {
  x: number;
  y: number;
  message: string;
}

// ─── Main panel ──────────────────────────────────────────────────────────────

const AllFeaturesPanel: React.FC<AllFeaturesPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { featureStates, featureOrder, reorderFeatures, toggleFeature } = useFeatures();
  const allKits = useTranslatedKits();

  const [activeFeatId, setActiveFeatId] = useState<string | null>(null);
  const [highlightedKits, setHighlightedKits] = useState<Set<string>>(new Set());
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lockedTooltip, setLockedTooltip] = useState<LockedTooltipState | null>(null);
  const lockedTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [disabledTooltip, setDisabledTooltip] = useState<LockedTooltipState | null>(null);
  const disabledTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Guide — fixed informational order
  const guideKits = useMemo(() => {
    const main = GUIDE_KIT_ORDER
      .map(id => allKits.find(k => k.id === id))
      .filter((k): k is (typeof allKits)[number] => k != null);
    const others = allKits.filter(k => !GUIDE_KIT_ORDER.includes(k.id));
    return [...main, ...others];
  }, [allKits]);

  // Build a lookup: featureId → { feature, kit }
  const featureLookup = useMemo(() => {
    const map = new Map<string, { feature: KitFeatureItem; kitId: string; isComingSoon: boolean }>();
    allKits.forEach(kit => {
      kit.features.forEach(f => {
        map.set(f.id, { feature: f, kitId: kit.id, isComingSoon: kit.status === 'coming-soon' });
      });
    });
    return map;
  }, [allKits]);

  // Flat feature list following featureOrder, with adjacency info
  const flatFeatures = useMemo((): FlatFeature[] => {
    const raw = featureOrder
      .map(id => featureLookup.get(id))
      .filter((entry): entry is NonNullable<typeof entry> => entry != null)
      .map(({ feature, kitId, isComingSoon }) => ({
        ...feature,
        kitId,
        kitColor: KIT_COLOR_MAP[kitId] ?? '#576A8F',
        kitColorRgb: hexToRgb(KIT_COLOR_MAP[kitId] ?? '#576A8F'),
        isComingSoon,
        connectLeft: false,
        connectRight: false,
      }));

    return raw.map((feat, i) => ({
      ...feat,
      connectLeft: i > 0 && raw[i - 1].kitId === feat.kitId,
      connectRight: i < raw.length - 1 && raw[i + 1].kitId === feat.kitId,
    }));
  }, [featureOrder, featureLookup]);

  // Filtered features for display — recomputes connectLeft/connectRight for the subset
  const displayedFeatures = useMemo((): FlatFeature[] => {
    let raw = flatFeatures;
    if (selectedKitId) {
      raw = raw.filter(f => f.kitId === selectedKitId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      raw = raw.filter(f => f.name.toLowerCase().includes(q));
    }
    return raw.map((feat, i) => ({
      ...feat,
      connectLeft: i > 0 && raw[i - 1].kitId === feat.kitId,
      connectRight: i < raw.length - 1 && raw[i + 1].kitId === feat.kitId,
    }));
  }, [flatFeatures, selectedKitId, searchQuery]);

  // Feature drag — operates on the full featureOrder even when display is filtered
  const handleFeatDragStart = useCallback((e: DragStartEvent) => {
    setActiveFeatId(e.active.id as string);
  }, []);

  const handleFeatDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveFeatId(null);
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const oldIdx = featureOrder.indexOf(active.id as string);
      const newIdx = featureOrder.indexOf(over.id as string);
      if (oldIdx !== -1 && newIdx !== -1) {
        reorderFeatures(arrayMove([...featureOrder], oldIdx, newIdx));
      }
    },
    [featureOrder, reorderFeatures]
  );

  // Click → navigate
  const handleFeatureNavigate = useCallback(
    (feature: FlatFeature) => {
      const navPath = feature.module?.navigationPath;
      if (!navPath) return;
      onClose();
      navigate(navPath);
    },
    [navigate, onClose]
  );

  // Right-click → toggle or show locked tooltip
  const handleFeatureRightClick = useCallback(
    (e: React.MouseEvent, feature: FlatFeature) => {
      e.preventDefault();
      e.stopPropagation();

      if (feature.isComingSoon || feature.default) {
        if (lockedTooltipTimerRef.current) clearTimeout(lockedTooltipTimerRef.current);
        setLockedTooltip({
          x: e.clientX,
          y: e.clientY,
          message: t('tooltips.cannotToggle'),
        });
        lockedTooltipTimerRef.current = setTimeout(() => setLockedTooltip(null), 2000);
        return;
      }

      const currentState = featureStates[feature.id] ?? false;
      toggleFeature(feature.kitId, feature.id, !currentState);
    },
    [featureStates, toggleFeature, t]
  );

  // Disabled feature click — show tooltip
  const handleDisabledFeatureClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabledTooltipTimerRef.current) clearTimeout(disabledTooltipTimerRef.current);
    setDisabledTooltip({
      x: e.clientX,
      y: e.clientY,
      message: t('tooltips.featureDisabled'),
    });
    disabledTooltipTimerRef.current = setTimeout(() => setDisabledTooltip(null), 2000);
  }, [t]);

  // KIT guide click — toggle KIT filter; secondary pulse highlight still fires
  const handleKitGuideClick = useCallback((kitId: string) => {
    setSelectedKitId(prev => (prev === kitId ? null : kitId));
    setSearchQuery('');
    setHighlightedKits(prev => new Set([...prev, kitId]));
    setTimeout(() => {
      setHighlightedKits(prev => {
        const next = new Set(prev);
        next.delete(kitId);
        return next;
      });
    }, 1100);
  }, []);

  const activeFeat = activeFeatId ? flatFeatures.find(f => f.id === activeFeatId) ?? null : null;

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    // DndContext wraps the entire portal so DragOverlay renders as a sibling of
    // .afp-panel in the DOM — not inside it. This prevents backdrop-filter and
    // any future transforms on the panel from breaking position:fixed in the
    // PositionedOverlay that dnd-kit renders for the drag ghost.
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleFeatDragStart}
      onDragEnd={handleFeatDragEnd}
    >
      {/* Backdrop */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000000,
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <Box className="afp-panel">
        {/* Header */}
        <Box className="afp-header">
          <Typography className="afp-title">{t('features.allFeatures')}</Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Hint bar */}
        <Box className="afp-hint-bar">
          <Box className="afp-hint-item">
            <OpenWith sx={{ fontSize: '0.85rem' }} />
            <span>{t('hints.dragFeatures')}</span>
          </Box>
          <Box className="afp-hint-separator">·</Box>
          <Box className="afp-hint-item">
            <Mouse sx={{ fontSize: '0.85rem' }} />
            <span>{t('hints.rightClickToggle')}</span>
          </Box>
          <Box className="afp-hint-separator">·</Box>
          <Box className="afp-hint-item">
            <TouchApp sx={{ fontSize: '0.85rem' }} />
            <span>{t('hints.clickKitHighlight')}</span>
          </Box>
        </Box>

        {/* Body */}
        <Box className="afp-body">
          {/* Left: KIT filter guide */}
          <Box className="afp-kit-guide">
            {/* All KITs entry */}
            <Box
              className={['afp-kit-guide-item', 'afp-kit-guide-all', selectedKitId === null ? 'selected' : ''].filter(Boolean).join(' ')}
              onClick={() => { setSelectedKitId(null); setSearchQuery(''); }}
            >
              <Apps sx={{ fontSize: '0.85rem', opacity: 0.7, flexShrink: 0 }} />
              <Typography className="afp-kit-guide-name">{t('features.allKits')}</Typography>
            </Box>

            <Box className="afp-kit-guide-divider" />

            {guideKits.map(kit => (
              <KitGuideItem
                key={kit.id}
                kitId={kit.id}
                kitName={kit.name}
                kitColor={KIT_COLOR_MAP[kit.id] ?? '#576A8F'}
                isComingSoon={kit.status === 'coming-soon'}
                isHighlighted={highlightedKits.has(kit.id)}
                isSelected={selectedKitId === kit.id}
                onClick={() => handleKitGuideClick(kit.id)}
              />
            ))}
          </Box>

          {/* Right: search + sortable feature cards */}
          <Box className="afp-features-column">
            {/* Search bar */}
            <Box className="afp-search-bar">
              <InputBase
                inputRef={searchInputRef}
                className="afp-search-input"
                placeholder={t('features.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.35)' }} />
                  </InputAdornment>
                }
                endAdornment={
                  searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch} sx={{ color: 'rgba(255,255,255,0.4)', padding: '2px' }}>
                        <Clear sx={{ fontSize: '0.85rem' }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              />
            </Box>

            {/* Feature grid */}
            <SortableContext
              items={displayedFeatures.map(f => f.id)}
              strategy={rectSortingStrategy}
            >
              <Box className="afp-features-area">
                {displayedFeatures.length > 0 ? (
                  displayedFeatures.map(feature => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      isEnabled={!!featureStates[feature.id]}
                      isHighlighted={highlightedKits.has(feature.kitId)}
                      onNavigate={() => handleFeatureNavigate(feature)}
                      onRightClick={e => handleFeatureRightClick(e, feature)}
                      onDisabledClick={handleDisabledFeatureClick}
                    />
                  ))
                ) : (
                  <Box className="afp-no-results">
                    <Search sx={{ fontSize: '2rem', opacity: 0.25, marginBottom: '8px' }} />
                    <Typography className="afp-no-results-text">
                      {t('features.noResults')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </SortableContext>
          </Box>
        </Box>
      </Box>

      {/* DragOverlay outside .afp-panel: its PositionedOverlay (position:fixed) is
          now a sibling of .afp-panel in the DOM, so backdrop-filter on .afp-panel
          cannot affect its viewport-relative positioning. */}
      <DragOverlay>
        {activeFeat && <GhostCard feature={activeFeat} />}
      </DragOverlay>

      {/* Locked feature right-click tooltip */}
      {lockedTooltip && (
        <Box
          className="afp-locked-tooltip"
          style={{ left: lockedTooltip.x + 12, top: lockedTooltip.y - 8 }}
          onClick={() => setLockedTooltip(null)}
        >
          <Lock sx={{ fontSize: '0.75rem' }} />
          <span>{lockedTooltip.message}</span>
        </Box>
      )}

      {/* Disabled feature click tooltip */}
      {disabledTooltip && (
        <Box
          className="afp-disabled-tooltip"
          style={{ left: disabledTooltip.x + 12, top: disabledTooltip.y - 8 }}
          onClick={() => setDisabledTooltip(null)}
        >
          <Lock sx={{ fontSize: '0.75rem' }} />
          <span>{disabledTooltip.message}</span>
        </Box>
      )}
    </DndContext>,
    document.body
  );
};

export default AllFeaturesPanel;
