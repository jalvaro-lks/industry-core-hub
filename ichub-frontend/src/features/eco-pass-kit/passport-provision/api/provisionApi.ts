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

import {
  DigitalProductPassport,
  DPPListItem,
  SerializedTwinSearchResult,
  DataspacePartner,
  SharingConfig,
  SharingRecord,
  TwinAssociation
} from '../types';

/**
 * Mock data store for DPPs
 */
const mockDPPs: DigitalProductPassport[] = [
  {
    id: 'CX:BAT-001:BAT-001-SN-12345',
    name: 'Battery Pack 12V Standard',
    version: '6.1.0',
    semanticId: 'urn:samm:io.catenax.generic.digital_product_passport:6.1.0#DigitalProductPassport',
    status: 'active',
    twinAssociation: {
      twinId: 'twin-001',
      aasId: 'aas-001',
      manufacturerPartId: 'BAT-001',
      serialNumber: 'BAT-001-SN-12345',
      twinName: 'Battery Pack 12V'
    },
    data: {
      "metadata": {
        "version": "6.1.0",
        "specVersion": "6.1.0",
        "status": "approved",
        "expirationDate": "2025-11-20",
        "issueDate": "2025-11-08",
        "passportIdentifier": "dc10cf6b-c7fc-41e5-8b10-bebb678100ca",
        "predecessor": "7cb09fa7-0651-4314-94ee-8abad2140a73",
        "backupReference": "backup-ref-001",
        "registrationIdentifier": "reg-001",
        "lastModification": "2025-11-07",
        "language": "en",
        "economicOperatorId": "BPNL000000000000"
      },
      "identification": {
        "type": {
          "manufacturerPartId": "BAT-001",
          "nameAtManufacturer": "Battery Pack 12V Standard"
        },
        "codes": [
          {
            "key": "EAN",
            "value": "1234567890123"
          }
        ],
        "dataCarrier": {
          "carrierType": "QR",
          "carrierLayout": "upper-left"
        },
        "classification": [
          {
            "classificationStandard": "ECLASS",
            "classificationID": "27-01-02-01"
          }
        ]
      },
      "operation": {
        "manufacturer": {
          "facility": [
            {
              "facility": "BPNS000000000000"
            }
          ],
          "manufacturer": "BPNL000000000000"
        },
        "import": {
          "content": {
            "eori": "TT000ABC9D",
            "id": "BPNL000000000000"
          },
          "applicable": true
        },
        "other": {
          "role": "distributor",
          "id": "BPNL000000000001"
        }
      },
      "handling": {
        "content": {
          "producer": [
            {
              "id": "BPNL000000000000"
            }
          ],
          "sparePart": [
            {
              "manufacturerPartId": "BAT-001-SPARE",
              "nameAtManufacturer": "Battery Spare Cell"
            }
          ]
        },
        "applicable": true
      },
      "characteristics": {
        "physicalDimension": {
          "width": {
            "value": "20",
            "unit": "unit:centimetre"
          },
          "length": {
            "value": "30",
            "unit": "unit:centimetre"
          },
          "diameter": {
            "value": "15",
            "unit": "unit:centimetre"
          },
          "height": {
            "value": "10",
            "unit": "unit:centimetre"
          },
          "grossWeight": {
            "value": "5000",
            "unit": "unit:gram"
          },
          "grossVolume": {
            "value": "6000",
            "unit": "unit:cubicCentimetre"
          },
          "weight": {
            "value": "4500",
            "unit": "unit:gram"
          },
          "volume": {
            "value": "5500",
            "unit": "unit:cubicCentimetre"
          }
        },
        "lifespan": [
          {
            "unit": "Days",
            "value": "1825",
            "key": "expected lifetime"
          }
        ]
      },
      "commercial": {
        "purpose": [
          "Automotive battery pack for electric vehicles"
        ],
        "recallInformation": {
          "applicable": false
        }
      },
      "materials": {
        "substancesOfConcern": {
          "applicable": true,
          "content": [
            {
              "location": "Battery cells",
              "unit": "unit:partPerMillion",
              "exemption": "none",
              "hazardClassification": "H302",
              "category": "toxic",
              "class": "lithium compound",
              "statement": "Contains lithium compounds",
              "concentrationRange": "< 1%",
              "id": "lithium-001",
              "documentation": "Safety data sheet available"
            }
          ]
        },
        "materialComposition": {
          "applicable": true,
          "content": [
            {
              "unit": "unit:partPerMillion",
              "id": "lithium",
              "critical": "true",
              "documentation": "Battery composition report"
            }
          ]
        }
      },
      "sustainability": {
        "productFootprint": {
          "carbon": [
            {
              "rulebook": "ISO 14067",
              "lifecycle": "production",
              "unit": "unit:kilogram",
              "type": "CO2 equivalent",
              "manufacturingPlant": "BPNS000000000000",
              "declaration": "Carbon footprint: 45 kg CO2e"
            }
          ]
        },
        "status": "original"
      },
      "sources": [
        {
          "content": "Technical specifications",
          "category": "documentation",
          "type": "product datasheet",
          "header": "Battery Pack 12V Standard - Technical Data"
        }
      ]
    },
    createdAt: '2025-11-15T10:30:00Z',
    updatedAt: '2025-11-20T14:22:00Z',
    createdBy: 'user@company.com'
  },
  {
    id: 'CX:MOT-A320:MOT-A320-SN-98765',
    name: 'Electric Motor A320',
    version: '6.1.0',
    semanticId: 'urn:samm:io.catenax.generic.digital_product_passport:6.1.0#DigitalProductPassport',
    status: 'shared',
    twinAssociation: {
      twinId: 'twin-002',
      aasId: 'aas-002',
      manufacturerPartId: 'MOT-A320',
      serialNumber: 'MOT-A320-SN-98765',
      twinName: 'Electric Motor A320'
    },
    data: {
      "metadata": {
        "version": "6.1.0",
        "specVersion": "6.1.0",
        "status": "approved",
        "expirationDate": "2025-12-31",
        "issueDate": "2025-11-10",
        "passportIdentifier": "a8f2d9c1-3b4e-4f5a-9c6d-7e8f9a0b1c2d",
        "predecessor": "b9e3c8d2-4c5f-5e6b-0d7e-8f9g0h1i2j3k",
        "backupReference": "backup-ref-002",
        "registrationIdentifier": "reg-002",
        "lastModification": "2025-11-18",
        "language": "en",
        "economicOperatorId": "BPNL000000000000"
      },
      "identification": {
        "type": {
          "manufacturerPartId": "MOT-A320",
          "nameAtManufacturer": "Electric Motor A320"
        },
        "codes": [
          {
            "key": "GTIN",
            "value": "9876543210987"
          }
        ],
        "dataCarrier": {
          "carrierType": "QR",
          "carrierLayout": "center"
        },
        "classification": [
          {
            "classificationStandard": "ECLASS",
            "classificationID": "27-02-30-01"
          }
        ]
      },
      "operation": {
        "manufacturer": {
          "facility": [
            {
              "facility": "BPNS000000000001"
            }
          ],
          "manufacturer": "BPNL000000000000"
        },
        "import": {
          "content": {
            "eori": "TT000XYZ1E",
            "id": "BPNL000000000002"
          },
          "applicable": true
        },
        "other": {
          "role": "assembler",
          "id": "BPNL000000000003"
        }
      },
      "handling": {
        "content": {
          "producer": [
            {
              "id": "BPNL000000000000"
            }
          ],
          "sparePart": [
            {
              "manufacturerPartId": "MOT-A320-ROTOR",
              "nameAtManufacturer": "Motor Rotor Assembly"
            }
          ]
        },
        "applicable": true
      },
      "characteristics": {
        "physicalDimension": {
          "width": {
            "value": "25",
            "unit": "unit:centimetre"
          },
          "length": {
            "value": "40",
            "unit": "unit:centimetre"
          },
          "diameter": {
            "value": "18",
            "unit": "unit:centimetre"
          },
          "height": {
            "value": "35",
            "unit": "unit:centimetre"
          },
          "grossWeight": {
            "value": "12000",
            "unit": "unit:gram"
          },
          "grossVolume": {
            "value": "35000",
            "unit": "unit:cubicCentimetre"
          },
          "weight": {
            "value": "11500",
            "unit": "unit:gram"
          },
          "volume": {
            "value": "33000",
            "unit": "unit:cubicCentimetre"
          }
        },
        "lifespan": [
          {
            "unit": "Days",
            "value": "3650",
            "key": "expected lifetime"
          }
        ]
      },
      "commercial": {
        "purpose": [
          "High-performance electric motor for automotive applications"
        ],
        "recallInformation": {
          "applicable": false
        }
      },
      "materials": {
        "substancesOfConcern": {
          "applicable": true,
          "content": [
            {
              "location": "Winding insulation",
              "unit": "unit:partPerMillion",
              "exemption": "none",
              "hazardClassification": "H315",
              "category": "irritant",
              "class": "polymer coating",
              "statement": "Contains polymer insulation materials",
              "concentrationRange": "< 0.5%",
              "id": "polymer-001",
              "documentation": "Material safety data sheet available"
            }
          ]
        },
        "materialComposition": {
          "applicable": true,
          "content": [
            {
              "unit": "unit:partPerMillion",
              "id": "copper",
              "critical": "false",
              "documentation": "Motor composition specification"
            }
          ]
        }
      },
      "sustainability": {
        "productFootprint": {
          "carbon": [
            {
              "rulebook": "ISO 14067",
              "lifecycle": "production",
              "unit": "unit:kilogram",
              "type": "CO2 equivalent",
              "manufacturingPlant": "BPNS000000000001",
              "declaration": "Carbon footprint: 85 kg CO2e"
            }
          ]
        },
        "status": "original"
      },
      "sources": [
        {
          "content": "Motor specifications and performance data",
          "category": "documentation",
          "type": "technical manual",
          "header": "Electric Motor A320 - Technical Documentation"
        }
      ]
    },
    createdAt: '2025-11-10T08:15:00Z',
    updatedAt: '2025-11-18T16:45:00Z',
    createdBy: 'user@company.com',
  }
];

/**
 * Mock sharing records
 */
const mockSharingRecords: SharingRecord[] = [];

/**
 * Fetch all DPPs created by current user
 */
export const fetchUserDPPs = async (): Promise<DPPListItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return mockDPPs.map(dpp => {
    const metadata = dpp.data?.metadata as { passportIdentifier?: string } | undefined;
    return {
      id: dpp.id,
      name: dpp.name,
      version: dpp.version,
      semanticId: dpp.semanticId,
      status: dpp.status.toLowerCase() as DPPListItem['status'],
      twinId: dpp.twinAssociation?.twinId,
      manufacturerPartId: dpp.twinAssociation?.manufacturerPartId,
      serialNumber: dpp.twinAssociation?.serialNumber,
      createdAt: dpp.createdAt,
      shareCount: dpp.shareCount,
      passportIdentifier: metadata?.passportIdentifier
    };
  });
};

/**
 * Get DPP by ID with full details
 */
export const getDPPById = async (id: string): Promise<DigitalProductPassport | null> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const dpp = mockDPPs.find(d => d.id === id);
  return dpp || null;
};

/**
 * Create a new DPP
 */
export const createDPP = async (
  version: string,
  semanticId: string,
  data: Record<string, unknown>,
  status: 'draft' | 'active' = 'active',
  twinAssociation?: TwinAssociation
): Promise<DigitalProductPassport> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newDPP: DigitalProductPassport = {
    id: `dpp-${Date.now()}`,
    name: String(data.productDescription || 'Unnamed Product'),
    version,
    semanticId,
    status,
    twinAssociation: twinAssociation || {
      twinId: 'default-twin',
      manufacturerPartId: 'DEFAULT',
      serialNumber: 'NEW'
    },
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user@company.com',
    shareCount: 0
  };
  
  mockDPPs.push(newDPP);
  return newDPP;
};

/**
 * Update an existing DPP
 */
export const updateDPP = async (
  id: string,
  updates: Partial<DigitalProductPassport>
): Promise<DigitalProductPassport> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockDPPs.findIndex(d => d.id === id);
  if (index === -1) {
    throw new Error('DPP not found');
  }
  
  mockDPPs[index] = {
    ...mockDPPs[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  return mockDPPs[index];
};

/**
 * Delete a DPP
 */
export const deleteDPP = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const index = mockDPPs.findIndex(d => d.id === id);
  if (index !== -1) {
    mockDPPs.splice(index, 1);
  }
};

/**
 * Search for serialized part twins
 */
export const searchSerializedTwins = async (query: string): Promise<SerializedTwinSearchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockTwins: SerializedTwinSearchResult[] = [
    {
      id: 'twin-001',
      twinId: 'twin-001',
      aasId: 'aas-001',
      manufacturerPartId: 'BAT-001',
      serialNumber: 'BAT-001-SN-12345',
      name: 'Battery Pack 12V',
      location: 'Factory A',
      assetId: 'asset-bat-001',
      createdAt: '2025-10-15T10:00:00Z'
    },
    {
      id: 'twin-002',
      twinId: 'twin-002',
      aasId: 'aas-002',
      manufacturerPartId: 'MOT-A320',
      serialNumber: 'MOT-A320-SN-98765',
      name: 'Electric Motor A320',
      location: 'Factory B',
      assetId: 'asset-mot-a320',
      createdAt: '2025-10-20T14:30:00Z'
    },
    {
      id: 'twin-003',
      twinId: 'twin-003',
      aasId: 'aas-003',
      manufacturerPartId: 'GEAR-500',
      serialNumber: 'GEAR-500-SN-55555',
      name: 'Gearbox Assembly 500',
      location: 'Factory C',
      assetId: 'asset-gear-500',
      createdAt: '2025-11-01T09:15:00Z'
    }
  ];
  
  if (!query) return mockTwins;
  
  const lowercaseQuery = query.toLowerCase();
  return mockTwins.filter(twin => 
    twin.name.toLowerCase().includes(lowercaseQuery) ||
    twin.manufacturerPartId.toLowerCase().includes(lowercaseQuery) ||
    twin.serialNumber.toLowerCase().includes(lowercaseQuery)
  );
};

/**
 * Fetch dataspace partners available for sharing
 */
export const fetchDataspacePartners = async (): Promise<DataspacePartner[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return [
    {
      id: 'partner-001',
      name: 'OEM Automotive GmbH',
      bpn: 'BPNL000000000001',
      edcEndpoint: 'https://edc.oem-automotive.example.com',
      description: 'Leading automotive manufacturer'
    },
    {
      id: 'partner-002',
      name: 'Supplier Components Ltd',
      bpn: 'BPNL000000000002',
      edcEndpoint: 'https://edc.supplier-components.example.com',
      description: 'Tier-1 component supplier'
    },
    {
      id: 'partner-003',
      name: 'Recycling Solutions Inc',
      bpn: 'BPNL000000000003',
      edcEndpoint: 'https://edc.recycling-solutions.example.com',
      description: 'Certified recycling partner'
    }
  ];
};

/**
 * Share DPP with a partner
 */
export const shareDPPWithPartner = async (
  dppId: string,
  partnerId: string,
  config: SharingConfig
): Promise<SharingRecord> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const partners = await fetchDataspacePartners();
  const partner = partners.find(p => p.id === partnerId);
  
  if (!partner) {
    throw new Error('Partner not found');
  }
  
  const sharingRecord: SharingRecord = {
    id: `share-${Date.now()}`,
    dppId,
    partnerId,
    partnerName: partner.name,
    partner,
    config,
    accessConfig: {
      readOnly: config.readOnly,
      expiresAt: config.expirationDate,
      usagePolicy: config.usagePolicy
    },
    sharedAt: new Date().toISOString(),
    sharedBy: 'user@company.com',
    status: 'active'
  };
  
  mockSharingRecords.push(sharingRecord);
  
  // Update share count
  const dpp = mockDPPs.find(d => d.id === dppId);
  if (dpp) {
    dpp.shareCount += 1;
    dpp.status = 'shared';
  }
  
  return sharingRecord;
};

/**
 * Get sharing records for a DPP
 */
export const getSharingRecordsByDPP = async (dppId: string): Promise<SharingRecord[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return mockSharingRecords.filter(record => record.dppId === dppId);
};

/**
 * Revoke sharing access
 */
export const revokeSharingAccess = async (shareId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const record = mockSharingRecords.find(r => r.id === shareId);
  if (record) {
    record.status = 'revoked';
    
    // Update share count
    const dpp = mockDPPs.find(d => d.id === record.dppId);
    if (dpp) {
      dpp.shareCount = Math.max(0, dpp.shareCount - 1);
    }
  }
};
