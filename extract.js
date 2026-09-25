const fs = require('fs');
const file = 'src/components/Modal/UnderwritingModal/UnderwritingModal.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const assetStart = 1122 - 1;
const assetEnd = 1601 - 1;
const legalStart = 1602 - 1;
const legalEnd = 1705 - 1;

const assetCode = lines.slice(assetStart, assetEnd + 1).join('\n');
const legalCode = lines.slice(legalStart, legalEnd + 1).join('\n');

const assetImports = \import React from 'react';
import { Box, Group, Text, SimpleGrid, Paper, TextInput, NumberInput, Select, Checkbox, Textarea, Badge, Stack, Button, Divider, ActionIcon } from '@mantine/core';
import { IconCar, IconInfoCircle, IconAlertTriangle, IconCalendarEvent, IconUserCheck, IconFileText, IconShieldCheck, IconCircleCheck, IconCircleX, IconArrowRight, IconGavel, IconX } from '@tabler/icons-react';
import type { DummyAssetBase } from '../../PreScreeningModal/Dummyloanapplicationdata';
import { DUMMY_ASSET_TYPES } from '../../PreScreeningModal/Dummyloanapplicationdata';
import { 
  Asset, PanelId, Decision, Condition, AssetDoc, CHECK_STATUSES, DECISION_LABEL, REJECT_REASONS,
  zmw, requiredDocsVerified, missingRequiredDocs, SectionLabel, ReadRow, MiniStat, ValidityNote,
  DocumentsTable, DecisionButton
} from './UnderwritingModal';\n\n\;

const legalImports = \import React from 'react';
import { Box, Group, Text, SimpleGrid, TextInput, Textarea, Divider } from '@mantine/core';
import { IconScale, IconFileText } from '@tabler/icons-react';
import { 
  Asset, PanelId, TitleChecklistItem, LegalCheck, missingRequiredDocs, requiredDocsVerified,
  SectionLabel, CompactCheckRow, DocumentsTable
} from './UnderwritingModal';\n\n\;

fs.writeFileSync('src/components/Modal/UnderwritingModal/AssetDetailView.tsx', assetImports + assetCode.replace(/^function AssetDetailView/, 'export function AssetDetailView'));
fs.writeFileSync('src/components/Modal/UnderwritingModal/LegalDetailView.tsx', legalImports + legalCode.replace(/^function LegalDetailView/, 'export function LegalDetailView'));

const newLines = [...lines.slice(0, assetStart)];
newLines.unshift('import { AssetDetailView } from \"./AssetDetailView\";');
newLines.unshift('import { LegalDetailView } from \"./LegalDetailView\";');
newLines.push(...lines.slice(legalEnd + 1));

fs.writeFileSync(file, newLines.join('\n'));
