#################################################################################
# Eclipse Tractus-X - Industry Core Hub Backend
#
# Copyright (c) 2025 DRÄXLMAIER Group
# (represented by Lisa Dräxlmaier GmbH)
# Copyright (c) 2025 Contributors to the Eclipse Foundation
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the
# License for the specific language govern in permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
#################################################################################

from typing import Any, Dict, List, Optional
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, JSON
from .part_management import CatalogPart
from .sharing_management import DataExchangeAgreement
from .twin_management import TwinAspectRegistration, TwinRegistration

class LegalEntity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    bpnl: str = Field(index=True, unique=True, description="The BPNL of the legal entity.")
    catalog_parts: List["CatalogPart"] = Relationship(back_populates="legal_entity")
    enablement_service_stacks: List["EnablementServiceStack"] = Relationship(back_populates="legal_entity")
    __tablename__ = "legal_entity"


class BusinessPartner(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, description="The name of the business partner.")
    bpnl: str = Field(index=True, unique=True, description="The BPNL of the business partner.")
    data_exchange_agreements: List["DataExchangeAgreement"] = Relationship(back_populates="business_partner")
    __tablename__ = "business_partner"


class EnablementServiceStack(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    connection_settings: Optional[Dict[str, Any]] = Field(sa_column=Column(JSON))
    legal_entity_id: int = Field(index=True, foreign_key="legal_entity.id")
    legal_entity: LegalEntity = Relationship(back_populates="enablement_service_stacks")
    twin_aspect_registrations: List["TwinAspectRegistration"] = Relationship(back_populates="enablement_service_stack")
    twin_registrations: List["TwinRegistration"] = Relationship(back_populates="enablement_service_stack")
    __tablename__ = "enablement_service_stack"
