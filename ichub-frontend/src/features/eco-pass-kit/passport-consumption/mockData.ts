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
 * Mock Digital Product Passport Data
 * Based on Battery Passport DPP standard
 */
export const mockBatteryPassport = {
  metadata: {
    version: '6.1.0',
    status: 'active',
    issueDate: '2024-11-27T10:30:00Z',
    expiryDate: '2034-11-27T10:30:00Z'
  },
  identification: {
    digitalProductPassportId: 'DPP-BAT-2024-001',
    productPassportId: 'PP-IMR18650V1-2024-001',
    batteryId: 'IMR18650V1-2024001',
    manufacturerPartId: 'SDI-IMR18650-V1',
    serialNumber: 'SN2024001',
    batchNumber: 'BATCH2024-Q1-001'
  },
  generalInformation: {
    productName: 'Lithium-ion Battery Cell',
    productDescription: 'High-performance 18650 lithium-ion rechargeable battery cell for electric vehicles',
    manufacturer: {
      name: 'Samsung SDI',
      street: '150 Gongse-ro',
      zipCode: '16678',
      city: 'Yongin-si',
      country: 'South Korea',
      website: 'https://www.samsungsdi.com'
    },
    manufacturingDate: '2024-01-15',
    manufacturingPlace: {
      facility: 'Samsung SDI Cheonan Plant',
      country: 'South Korea',
      city: 'Cheonan'
    },
    productType: 'Battery Cell',
    productModel: 'IMR18650V1',
    weight: 45.5,
    dimensions: {
      length: 65.0,
      diameter: 18.0,
      height: 65.0
    }
  },
  productCondition: {
    stateOfHealth: 92.5,
    stateOfCharge: 85.0,
    cycleCount: 450,
    remainingCapacity: 2405,
    nominalCapacity: 2600,
    capacityFade: 7.5,
    powerFade: 5.2,
    internalResistance: 28.5,
    lastTestDate: '2024-11-20'
  },
  components: {
    cathode: {
      material: 'Lithium Nickel Manganese Cobalt Oxide (NMC)',
      supplier: 'LG Chem',
      composition: {
        nickel: 60,
        manganese: 20,
        cobalt: 20
      }
    },
    anode: {
      material: 'Graphite',
      supplier: 'Hitachi Chemical',
      type: 'Synthetic Graphite'
    },
    electrolyte: {
      material: 'LiPF6 in organic carbonates',
      supplier: 'Mitsubishi Chemical'
    },
    separator: {
      material: 'Polyethylene (PE)',
      supplier: 'Asahi Kasei',
      thickness: 20
    }
  },
  batteryComposition: {
    cathode: 45.2,
    anode: 32.8,
    electrolyte: 15.5,
    separator: 6.5,
    casing: 12.5,
    otherMaterials: 5.5
  },
  cellChemistry: {
    cathodeActiveMaterial: 'NMC622',
    anodeActiveMaterial: 'Graphite',
    electrolyteType: 'Liquid',
    cellType: 'Cylindrical',
    cellFormat: '18650'
  },
  electrochemicalProperties: {
    nominalVoltage: 3.7,
    maxVoltage: 4.2,
    minVoltage: 2.5,
    nominalCapacity: 2600,
    ratedCapacity: 2600,
    capacityThresholdExhaustion: 1560,
    internalResistance: 28.5,
    powerCapability: 25.0,
    energyDensity: 245,
    powerDensity: 1800,
    temperatureRange: {
      charging: {
        min: 0,
        max: 45
      },
      discharging: {
        min: -20,
        max: 60
      },
      storage: {
        min: -20,
        max: 45
      }
    },
    roundtripEfficiency: 95.5,
    expectedLifetime: 2000
  },
  performance: {
    powerCapability: 25.0,
    maximumAllowedBatteryPower: 75.0,
    powerCapabilityAt20Percent: 20.0,
    powerCapabilityAt80Percent: 22.0,
    energyRoundtripEfficiency: 95.5,
    capacityFade: 7.5,
    nominalVoltage: 3.7,
    capacity: 2600,
    energyDensity: 245,
    powerDensity: 1800
  },
  health: {
    stateOfHealth: 92.5,
    stateOfCharge: 85.0,
    statusBattery: 'operational',
    cycleCount: 450,
    expectedLifetime: 2000,
    remainingUsefulLife: 1550,
    capacityThroughput: 1170000
  },
  sustainability: {
    carbonFootprint: 15.2,
    carbonFootprintTotal: 6916,
    renewableContent: 35.0,
    recyclability: 95.0,
    recycledContent: 12.5,
    criticalRawMaterials: ['Cobalt', 'Lithium', 'Nickel'],
    hazardousSubstances: {
      present: true,
      list: ['Lithium Hexafluorophosphate (LiPF6)']
    }
  },
  materials: {
    criticalRawMaterials: [
      {
        name: 'Cobalt',
        percentage: 8.5,
        origin: 'Democratic Republic of Congo',
        certified: true
      },
      {
        name: 'Lithium',
        percentage: 4.2,
        origin: 'Australia',
        certified: true
      },
      {
        name: 'Nickel',
        percentage: 25.5,
        origin: 'Indonesia',
        certified: true
      }
    ],
    hazardousMaterials: [
      {
        name: 'Lithium Hexafluorophosphate',
        casNumber: '21324-40-3',
        concentration: 1.2
      }
    ]
  },
  safetyInformation: {
    safetyInstructions: 'Do not disassemble, crush, or expose to fire. Store in cool, dry place.',
    extinguishingAgent: 'Class D fire extinguisher required',
    safetyMeasures: [
      'Avoid short circuit',
      'Do not expose to temperatures above 60°C',
      'Use appropriate charger only',
      'Recycle properly at end of life'
    ]
  },
  additionalInformation: {
    certifications: [
      {
        name: 'UN38.3',
        issuer: 'UN',
        issueDate: '2024-01-10',
        validUntil: '2027-01-10'
      },
      {
        name: 'IEC 62133',
        issuer: 'IEC',
        issueDate: '2024-01-10',
        validUntil: '2027-01-10'
      }
    ],
    standards: ['UN38.3', 'IEC 62133', 'ISO 12405'],
    labels: ['CE', 'RoHS', 'WEEE'],
    warranty: {
      warrantyPeriod: 8,
      warrantyConditions: 'Covers manufacturing defects. Does not cover abuse or improper use.'
    }
  },
  dataExchangeInformation: {
    dataCarrier: 'QR Code',
    dataFormat: 'JSON',
    dataProtocol: 'HTTPS',
    dataEncryption: 'TLS 1.3',
    accessRights: 'Authorized parties only',
    dataRetention: 15
  },
  circularityInformation: {
    dismantlingInstructions: 'Professional dismantling required. Follow safety procedures.',
    recyclingInstructions: 'Return to authorized recycling facility. Contains recoverable materials.',
    repairability: 'Not user-serviceable. Contact manufacturer for repair.',
    sparePartsAvailability: 'Not applicable for battery cells',
    endOfLifeInstructions: 'Must be recycled. Do not dispose with household waste.'
  }
};

/**
 * Alternative mock data for testing with different schema
 */
export const mockProductPassport = {
  identification: {
    productId: 'PROD-2024-12345',
    gtin: '04260578090064',
    serialNumber: 'SN-ABC-123456'
  },
  generalInformation: {
    productName: 'Electric Motor Assembly',
    manufacturer: 'Bosch',
    manufacturingDate: '2024-03-20',
    weight: 25.8,
    dimensions: {
      length: 350,
      width: 280,
      height: 420
    }
  },
  performance: {
    efficiency: 94.5,
    powerOutput: 150,
    torque: 310,
    rpmRange: {
      min: 0,
      max: 15000
    }
  },
  materials: {
    primaryMaterials: [
      { name: 'Steel', percentage: 45.0 },
      { name: 'Copper', percentage: 25.0 },
      { name: 'Aluminum', percentage: 18.0 },
      { name: 'Rare Earth Magnets', percentage: 8.0 }
    ]
  },
  sustainability: {
    carbonFootprint: 125.5,
    recyclability: 88.0,
    energyConsumption: 2.5
  }
};

/**
 * Provided mock passport (user-specified payload)
 */
export const mockProvidedPassport = {
  metadata: {
    backupReference: 'https://dummy.link',
    specVersion: 'urn:io.catenax.generic.digital_product_passport:6.1.0',
    registrationIdentifier: 'https://dummy.link/ID8283746239078',
    economicOperatorId: 'BPNL0123456789ZZ',
    lastModification: '2000-01-01',
    language: 'EN',
    predecessor: 'urn:uuid:00000000-0000-0000-0000-000000000000',
    issueDate: '2000-01-01',
    version: '1.0.0',
    passportIdentifier: 'urn:uuid:550e8400-e29b-41d4-a716-446655440000',
    status: 'draft',
    expirationDate: '2030-01-01'
  },
  characteristics: {
    generalPerformanceClass: 'A',
    physicalState: 'solid',
    physicalDimension: {
      volume: { value: 20.0, unit: 'unit:cubicMetre' },
      grossWeight: { value: 20.0, unit: 'unit:gram' },
      diameter: { value: 20.0, unit: 'unit:millimetre' },
      grossVolume: { value: 20.0, unit: 'unit:cubicMetre' },
      width: { value: 20.0, unit: 'unit:millimetre' },
      length: { value: 20.0, unit: 'unit:millimetre' },
      weight: { value: 20.0, unit: 'unit:gram' },
      height: { value: 20.0, unit: 'unit:millimetre' }
    },
    lifespan: [
      {
        value: 36,
        unit: 'unit:day',
        key: 'guaranteed lifetime'
      }
    ]
  },
  commercial: {
    placedOnMarket: '2000-01-01',
    purchaseOrder: 'eOMtThyhVNLWUZNRcBaQKxI',
    purpose: ['automotive'],
    recallInformation: {
      recallInformationDocumentation: [
        {
          contentType: 'URL',
          header: 'Example Document XYZ',
          content: 'https://dummy.link'
        }
      ],
      applicable: true
    }
  },
  identification: {
    batch: [
      { value: 'BID12345678', key: 'batchId' }
    ],
    codes: [
      { value: '8703 24 10 00', key: 'TARIC' }
    ],
    type: {
      manufacturerPartId: '123-0.740-3434-A',
      nameAtManufacturer: 'Mirror left'
    },
    classification: [
      {
        classificationStandard: 'GIN 20510-21513',
        classificationID: '1004712',
        classificationDescription:
          'Generic standard for classification of parts in the automotive industry.'
      }
    ],
    serial: [
      { value: 'SN12345678', key: 'partInstanceId' }
    ],
    dataCarrier: {
      carrierType: 'QR',
      carrierLayout: 'upper-left side'
    }
  },
  sources: [
    {
      header: 'Example Document XYZ',
      category: 'Product Specifications',
      type: 'URL',
      content: 'https://dummy.link'
    }
  ],
  materials: {
    substancesOfConcern: {
      applicable: true,
      content: [
        {
          unit: 'unit:partPerMillion',
          hazardClassification: {
            category: 'category 1A',
            statement: 'Causes severe skin burns and eye damage.',
            class: 'Skin corrosion'
          },
          documentation: [
            { contentType: 'URL', header: 'Example Document XYZ', content: 'https://dummy.link' }
          ],
          concentrationRange: [ { max: 2.6, min: 2.1 } ],
          location: 'Housing',
          concentration: 5.3,
          exemption: 'shall not apply to product x containing not more than 1,5 ml of liquid',
          id: [ { type: 'CAS', name: 'phenolphthalein', id: '201-004-7' } ]
        }
      ]
    },
    materialComposition: {
      applicable: true,
      content: [
        {
          unit: 'unit:partPerMillion',
          recycled: 12.5,
          critical: true,
          renewable: 23.5,
          documentation: [ { contentType: 'URL', header: 'Example Document XYZ', content: 'https://dummy.link' } ],
          concentration: 5.3,
          id: [ { type: 'CAS', name: 'phenolphthalein', id: '201-004-7' } ]
        }
      ]
    }
  },
  handling: {
    applicable: true,
    content: {
      producer: [ { id: 'BPNL0123456789ZZ' } ],
      sparePart: [ { manufacturerPartId: '123-0.740-3434-A', nameAtManufacturer: 'Mirror left' } ]
    }
  },
  additionalData: [
    {
      description: 'Description of an attribute',
      label: 'Maximum permitted battery power',
      type: { typeUnit: 'unit:volume', dataType: 'array' },
      data: '23',
      children: [
        {
          description: 'Description of an attribute',
          label: 'Maximum permitted battery power',
          type: { typeUnit: 'unit:volume', dataType: 'array' },
          data: '23'
        }
      ]
    }
  ],
  operation: {
    import: {
      applicable: true,
      content: { eori: 'GB123456789000', id: 'BPNL0123456789ZZ' }
    },
    other: { id: 'BPNL0123456789XX', role: 'distributor' },
    manufacturer: {
      facility: [ { facility: 'BPNA1234567890AA' } ],
      manufacturingDate: '2000-01-31',
      manufacturer: 'BPNL1bVQKsz1Ci8l'
    }
  },
  sustainability: {
    reparabilityScore: 'B',
    productFootprint: {
      material: [
        {
          lifecycle: 'main product production',
          rulebook: [ { contentType: 'URL', header: 'Example Document XYZ', content: 'https://dummy.link' } ],
          unit: 'kg CO2 / kWh',
          performanceClass: 'A',
          manufacturingPlant: [ { facility: 'BPNA1234567890AA' } ],
          type: 'Climate Change Total',
          value: 12.678,
          declaration: [ { contentType: 'URL', header: 'Example Document XYZ', content: 'https://dummy.link' } ]
        }
      ],
      carbon: [
        {
          lifecycle: 'main product production',
          rulebook: [ { contentType: 'URL', header: 'Example Document XYZ', content: 'https://dummy.link' } ],
          unit: 'kg CO2 / kWh',
          performanceClass: 'A',
          manufacturingPlant: [ { facility: 'BPNA1234567890AA' } ],
          type: 'Climate Change Total',
          value: 12.678,
          declaration: [ { contentType: 'URL', header: 'Example Document XYZ', content: 'https://dummy.link' } ]
        }
      ],
      environmental: [
        {
          lifecycle: 'main product production',
          rulebook: [ { contentType: 'URL', header: 'Example Document XYZ', content: 'https://dummy.link' } ],
          unit: 'kg CO2 / kWh',
          performanceClass: 'A',
          manufacturingPlant: [ { facility: 'BPNA1234567890AA' } ],
          type: 'Climate Change Total',
          value: 12.678,
          declaration: [ { contentType: 'URL', header: 'Example Document XYZ', content: 'https://dummy.link' } ]
        }
      ]
    },
    status: 'original',
    durabilityScore: 'A'
  }
};
