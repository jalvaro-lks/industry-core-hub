/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 *
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

/**
 * TypeScript interfaces modelling the Catena-X PCF v9.0.0 nested JSON structure
 * as returned by the backend GET /provider/pcfs/{manufacturerPartId}.
 *
 * The hierarchy mirrors the actual sample data structure (verified against
 * ichub-backend/data/submodels/.../839f63bb-...json).
 */

// ---------------------------------------------------------------------------
// Leaf-level interfaces (most deeply nested)
// ---------------------------------------------------------------------------

export interface ScopeOfPcfFormEntity {
  specVersion: string;
  partialFullPcf: 'Cradle-to-gate' | 'Cradle-to-grave';
}

export interface CompanyInformationEntity {
  companyName: string;
  companyIds: string[];
}

export interface ProductInformationEntity {
  productNameCompany: string;
  productIds: string[];
  declaredUnitOfMeasurement:
    | 'liter'
    | 'kilogram'
    | 'cubic meter'
    | 'kilowatt hour'
    | 'megajoule'
    | 'ton kilometer'
    | 'square meter'
    | 'piece'
    | 'hour'
    | 'megabit'
    | 'second';
  declaredUnitAmount: number;
  productMassPerDeclaredUnit: number;
  productClassifications?: string[];
  productDescription?: string;
}

export interface CompanyAndProductInformationEntity {
  companyInformation: CompanyInformationEntity[];
  productInformation: ProductInformationEntity[];
}

export interface DataSourcesAndQualityEntity {
  primaryDataShare?: number;
  secondaryEmissionFactorSources?: string[];
  technologicalDQR?: number;
  temporalDQR?: number;
  geographicalDQR?: number;
}

export interface TechnologyEntity {
  ccsTechnologicalCO2CaptureIncluded: boolean;
  boundaryProcessesDescription?: string;
}

export interface IdAndVersionEntity {
  id: string;
  version: number;
  status: 'Active' | 'Deprecated';
  retroOrProspectivePcfType?: string;
  precedingPfIds?: object[];
}

export interface BoundarySpecificationsEntity {
  exemptedEmissionsPercent: number;
  exemptedEmissionsDescription?: string;
}

export interface GeographyEntity {
  geographyRegionOrSubregion: string;
  geographyCountrySubdivision?: string;
  geographyCountry?: string;
}

export interface TimeEntity {
  referencePeriodStart: string;
  referencePeriodEnd: string;
  created: string;
  validityPeriodEnd: string;
  validityPeriodStart?: string;
}

export interface PcfAssessmentInformationEntity {
  technology?: TechnologyEntity[];
  idAndVersion?: IdAndVersionEntity[];
  boundarySpecifications?: BoundarySpecificationsEntity[];
  geography?: GeographyEntity[];
  time?: TimeEntity[];
}

export interface VerificationEntity {
  programCertificationShare?: number;
  productVerificationShare3rdParty?: number;
  productVerificationShare2ndParty?: number;
  productVerificationShare1stParty?: number;
}

export interface MassBalancingInformationEntity {
  massBalancingUsed: boolean;
  freeAttributionInMassBalancing?: string;
  massBalancingCertificateScheme?: string;
}

export interface StandardsEntity {
  crossSectoralStandards?: string[];
  productOrSectorSpecificRules?: string[];
}

export interface GwpCharacterizationFactorDetailsEntity {
  ipccCharacterizationFactors?: 'AR4' | 'AR5' | 'AR6' | 'unspecified';
}

export interface AllocationInForegroundEntity {
  allocationWasteIncineration?: 'cut-off' | 'reverse cut-off' | 'system expansion' | 'polluter pays principle';
  allocationRulesDescription?: string;
  allocationRecycledCarbon?: string;
}

export interface PcfMethodologyEntity {
  massBalancingInformation?: MassBalancingInformationEntity[];
  standards?: StandardsEntity[];
  gwpCharacterizationFactorDetails?: GwpCharacterizationFactorDetailsEntity[];
  allocationInForeground?: AllocationInForegroundEntity[];
}

export interface PcfAssessmentAndMethodologyEntity {
  dataSourcesAndQuality?: DataSourcesAndQualityEntity[];
  pcfAssessmentInformation?: PcfAssessmentInformationEntity[];
  verificationAndCertificationShares?: VerificationEntity[];
  pcfMethodology?: PcfMethodologyEntity[];
}

export interface GeneralEntity {
  comment?: string;
  pcfLegalStatement?: string;
}

export interface CarbonContentEntity {
  carbonContentTotal?: number;
  fossilCarbonContent?: number;
  biogenicCarbonContent?: number;
  packagingBiogenicCarbonContent?: number;
  recycledCarbonContent?: number;
}

export interface ProductionStageEntity {
  pcfIncludingBiogenicUptake: number;
  pcfExcludingBiogenicUptake: number;
  fossilGhgEmissions?: number;
  biogenicNonCO2Emissions?: number;
  biogenicCO2Uptake?: number;
  landUseChangeGhgEmissions?: number;
  landManagementBiogenicCO2Emissions?: number;
  packagingLandManagementBiogenicCO2Emissions?: number;
  landManagementBiogenicCO2Removals?: number;
  aircraftGhgEmissions?: number;
}

export interface DistributionStageEntity {
  distributionStageIncluded: boolean;
  distributionStagePcfIncludingBiogenicUptake?: number;
  distributionStagePcfExcludingBiogenicUptake?: number;
  distributionStageFossilGhgEmissions?: number;
  distributionStageBiogenicNonCO2Emissions?: number;
  distributionStageBiogenicCO2Uptake?: number;
  distributionStageLandUseChangeGhgEmissions?: number;
  distributionStageLandManagementBiogenicCO2Emissions?: number;
  distributionStageLandManagementBiogenicCO2Removals?: number;
  distributionStageAircraftGhgEmissions?: number;
}

export interface PackagingStageEntity {
  packagingEmissionsIncluded: boolean;
  packagingPcfIncludingBiogenicUptake?: number | null;
  packagingPcfExcludingBiogenicUptake?: number | null;
  packagingFossilGhgEmissions?: number | null;
  packagingBiogenicNonCO2Emissions?: number | null;
  packagingBiogenicCO2Uptake?: number | null;
  packagingLandUseChangeGhgEmissions?: number | null;
  packagingLandManagementBiogenicCO2Emissions?: number | null;
  packagingLandManagementBiogenicCO2Removals?: number | null;
  packagingAircraftGhgEmissions?: number | null;
}

export interface ProductLifeCycleStagesAndEmissionsEntity {
  productionStage?: ProductionStageEntity[];
  distributionStage?: DistributionStageEntity[];
  packagingStage?: PackagingStageEntity[];
}

export interface AttestationOfConformanceEntity {
  attestationType: string;
  standardName: string;
  attestationStandard: string;
  attestationOfConformanceId: string;
  providerName: string;
  attestationOfConformanceLink?: string;
  providerId?: string;
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// Root interface
// ---------------------------------------------------------------------------

/**
 * Root structure of a PCF as returned by the backend.
 * All top-level properties are arrays (Catena-X aspect model convention).
 */
export interface PcfNestedData {
  scopeOfPcfForm: ScopeOfPcfFormEntity[];
  companyAndProductInformation: CompanyAndProductInformationEntity[];
  pcfAssessmentAndMethodology: PcfAssessmentAndMethodologyEntity[];
  general: GeneralEntity[];
  carbonContent: CarbonContentEntity[];
  productLifeCycleStagesAndEmissions: ProductLifeCycleStagesAndEmissionsEntity[];
  attestationOfConformance?: AttestationOfConformanceEntity[];
  // Backend may also return metadata fields at root level
  id?: string;
  partCatenaXId?: string;
  companyName?: string;
  companyBpn?: string;
  productName?: string;
  productDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Flat form values type for the Edit page
// ---------------------------------------------------------------------------

/**
 * Flat representation of the PCF fields that can be edited via the Update form.
 * Covers the most relevant fields for recalculation and updates, organised by section.
 */
export interface PcfEditFormValues {
  // Scope
  partialFullPcf: 'Cradle-to-gate' | 'Cradle-to-grave';
  specVersion: string;

  // Product Information
  declaredUnitAmount: number;
  declaredUnitOfMeasurement: string;
  productMassPerDeclaredUnit: number;

  // Assessment — Data Quality
  primaryDataShare: number;
  technologicalDQR: number;
  temporalDQR: number;
  geographicalDQR: number;

  // Assessment — Time
  referencePeriodStart: string;
  referencePeriodEnd: string;
  validityPeriodEnd: string;

  // Assessment — Geography
  geographyCountry: string;
  geographyRegionOrSubregion: string;

  // Production Stage Emissions
  pcfIncludingBiogenicUptake: number;
  pcfExcludingBiogenicUptake: number;
  fossilGhgEmissions: number;
  biogenicCO2Uptake: number;
  landUseChangeGhgEmissions: number;
  aircraftGhgEmissions: number;

  // Distribution Stage
  distributionStageIncluded: boolean;
  distributionStagePcfIncludingBiogenicUptake: number;
  distributionStagePcfExcludingBiogenicUptake: number;

  // Carbon Content
  carbonContentTotal: number;
  fossilCarbonContent: number;
  biogenicCarbonContent: number;
  recycledCarbonContent: number;

  // General
  comment: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract flat form values from the nested PCF data structure.
 * Uses safe optional chaining throughout since any array may be empty.
 */
export function extractFormValues(data: PcfNestedData): PcfEditFormValues {
  const scope = data.scopeOfPcfForm?.[0];
  const productInfo = data.companyAndProductInformation?.[0]?.productInformation?.[0];
  const assessment = data.pcfAssessmentAndMethodology?.[0];
  const quality = assessment?.dataSourcesAndQuality?.[0];
  const assessmentInfo = assessment?.pcfAssessmentInformation?.[0];
  const time = assessmentInfo?.time?.[0];
  const geography = assessmentInfo?.geography?.[0];
  const production = data.productLifeCycleStagesAndEmissions?.[0]?.productionStage?.[0];
  const distribution = data.productLifeCycleStagesAndEmissions?.[0]?.distributionStage?.[0];
  const carbon = data.carbonContent?.[0];
  const general = data.general?.[0];

  return {
    // Scope
    partialFullPcf: (scope?.partialFullPcf as 'Cradle-to-gate' | 'Cradle-to-grave') ?? 'Cradle-to-gate',
    specVersion: scope?.specVersion ?? '',

    // Product
    declaredUnitAmount: productInfo?.declaredUnitAmount ?? 0,
    declaredUnitOfMeasurement: productInfo?.declaredUnitOfMeasurement ?? 'kilogram',
    productMassPerDeclaredUnit: productInfo?.productMassPerDeclaredUnit ?? 0,

    // Data Quality
    primaryDataShare: quality?.primaryDataShare ?? 0,
    technologicalDQR: quality?.technologicalDQR ?? 1,
    temporalDQR: quality?.temporalDQR ?? 1,
    geographicalDQR: quality?.geographicalDQR ?? 1,

    // Time
    referencePeriodStart: time?.referencePeriodStart ?? '',
    referencePeriodEnd: time?.referencePeriodEnd ?? '',
    validityPeriodEnd: time?.validityPeriodEnd ?? '',

    // Geography
    geographyCountry: geography?.geographyCountry ?? '',
    geographyRegionOrSubregion: geography?.geographyRegionOrSubregion ?? 'Global',

    // Production Stage
    pcfIncludingBiogenicUptake: production?.pcfIncludingBiogenicUptake ?? 0,
    pcfExcludingBiogenicUptake: production?.pcfExcludingBiogenicUptake ?? 0,
    fossilGhgEmissions: production?.fossilGhgEmissions ?? 0,
    biogenicCO2Uptake: production?.biogenicCO2Uptake ?? 0,
    landUseChangeGhgEmissions: production?.landUseChangeGhgEmissions ?? 0,
    aircraftGhgEmissions: production?.aircraftGhgEmissions ?? 0,

    // Distribution Stage
    distributionStageIncluded: distribution?.distributionStageIncluded ?? false,
    distributionStagePcfIncludingBiogenicUptake: distribution?.distributionStagePcfIncludingBiogenicUptake ?? 0,
    distributionStagePcfExcludingBiogenicUptake: distribution?.distributionStagePcfExcludingBiogenicUptake ?? 0,

    // Carbon Content
    carbonContentTotal: carbon?.carbonContentTotal ?? 0,
    fossilCarbonContent: carbon?.fossilCarbonContent ?? 0,
    biogenicCarbonContent: carbon?.biogenicCarbonContent ?? 0,
    recycledCarbonContent: carbon?.recycledCarbonContent ?? 0,

    // General
    comment: general?.comment ?? '',
  };
}

/**
 * Merge form values back into the original nested PCF data structure.
 * Creates a deep copy of the original and patches only the edited paths.
 * Preserves any fields not present in the edit form (e.g., attestation, methodology).
 */
export function mergePcfFormValues(
  original: PcfNestedData,
  form: PcfEditFormValues
): PcfNestedData {
  // Deep copy to avoid mutating the original state
  const merged: PcfNestedData = JSON.parse(JSON.stringify(original));

  // Scope
  if (!merged.scopeOfPcfForm?.length) merged.scopeOfPcfForm = [{ specVersion: '', partialFullPcf: 'Cradle-to-gate' }];
  merged.scopeOfPcfForm[0].partialFullPcf = form.partialFullPcf;
  merged.scopeOfPcfForm[0].specVersion = form.specVersion;

  // Product Information
  if (!merged.companyAndProductInformation?.length) merged.companyAndProductInformation = [{ companyInformation: [], productInformation: [] }];
  if (!merged.companyAndProductInformation[0].productInformation?.length)
    merged.companyAndProductInformation[0].productInformation = [{ productNameCompany: '', productIds: [], declaredUnitOfMeasurement: 'kilogram', declaredUnitAmount: 0, productMassPerDeclaredUnit: 0 }];
  const prodInfo = merged.companyAndProductInformation[0].productInformation[0];
  prodInfo.declaredUnitAmount = form.declaredUnitAmount;
  prodInfo.declaredUnitOfMeasurement = form.declaredUnitOfMeasurement as ProductInformationEntity['declaredUnitOfMeasurement'];
  prodInfo.productMassPerDeclaredUnit = form.productMassPerDeclaredUnit;

  // PCF Assessment — ensure nested arrays exist
  if (!merged.pcfAssessmentAndMethodology?.length) merged.pcfAssessmentAndMethodology = [{}];
  const assessment = merged.pcfAssessmentAndMethodology[0];

  if (!assessment.dataSourcesAndQuality?.length) assessment.dataSourcesAndQuality = [{}];
  const quality = assessment.dataSourcesAndQuality[0];
  quality.primaryDataShare = form.primaryDataShare;
  quality.technologicalDQR = form.technologicalDQR;
  quality.temporalDQR = form.temporalDQR;
  quality.geographicalDQR = form.geographicalDQR;

  if (!assessment.pcfAssessmentInformation?.length) assessment.pcfAssessmentInformation = [{}];
  const info = assessment.pcfAssessmentInformation[0];

  if (!info.time?.length) info.time = [{ referencePeriodStart: '', referencePeriodEnd: '', created: '', validityPeriodEnd: '' }];
  info.time[0].referencePeriodStart = form.referencePeriodStart;
  info.time[0].referencePeriodEnd = form.referencePeriodEnd;
  info.time[0].validityPeriodEnd = form.validityPeriodEnd;

  if (!info.geography?.length) info.geography = [{ geographyRegionOrSubregion: 'Global' }];
  info.geography[0].geographyCountry = form.geographyCountry;
  info.geography[0].geographyRegionOrSubregion = form.geographyRegionOrSubregion;

  // Production Stage
  if (!merged.productLifeCycleStagesAndEmissions?.length) merged.productLifeCycleStagesAndEmissions = [{}];
  const lifecycle = merged.productLifeCycleStagesAndEmissions[0];

  if (!lifecycle.productionStage?.length) lifecycle.productionStage = [{ pcfIncludingBiogenicUptake: 0, pcfExcludingBiogenicUptake: 0 }];
  const prod = lifecycle.productionStage[0];
  prod.pcfIncludingBiogenicUptake = form.pcfIncludingBiogenicUptake;
  prod.pcfExcludingBiogenicUptake = form.pcfExcludingBiogenicUptake;
  prod.fossilGhgEmissions = form.fossilGhgEmissions;
  prod.biogenicCO2Uptake = form.biogenicCO2Uptake;
  prod.landUseChangeGhgEmissions = form.landUseChangeGhgEmissions;
  prod.aircraftGhgEmissions = form.aircraftGhgEmissions;

  // Distribution Stage
  if (!lifecycle.distributionStage?.length) lifecycle.distributionStage = [{ distributionStageIncluded: false }];
  const dist = lifecycle.distributionStage[0];
  dist.distributionStageIncluded = form.distributionStageIncluded;
  dist.distributionStagePcfIncludingBiogenicUptake = form.distributionStagePcfIncludingBiogenicUptake;
  dist.distributionStagePcfExcludingBiogenicUptake = form.distributionStagePcfExcludingBiogenicUptake;

  // Carbon Content
  if (!merged.carbonContent?.length) merged.carbonContent = [{}];
  const carbon = merged.carbonContent[0];
  carbon.carbonContentTotal = form.carbonContentTotal;
  carbon.fossilCarbonContent = form.fossilCarbonContent;
  carbon.biogenicCarbonContent = form.biogenicCarbonContent;
  carbon.recycledCarbonContent = form.recycledCarbonContent;

  // General
  if (!merged.general?.length) merged.general = [{}];
  merged.general[0].comment = form.comment;

  return merged;
}
