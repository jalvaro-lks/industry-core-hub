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

from enum import Enum
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field as PydField
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, JSON, UniqueConstraint

class Unit(str, Enum):
    mm = "mm"
    cm = "cm"
    m  = "m"
    g  = "g"
    kg = "kg"

class Measurement(SQLModel, table=False):
    value: float = PydField(description="Numeric value of the measurement")
    unit: Unit = PydField(description="Unit of measure")

class Material(BaseModel):
    name: str = PydField(description="Name of the material")
    share: int = PydField(description="Share of the material in percent. 0-100")

class CatalogPart(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    manufacturer_part_id: str = Field(index=True, description="The manufacturer part ID.")
    legal_entity_id: int = Field(index=True, foreign_key="legal_entity.id", description="The ID of the associated legal entity.")
    legal_entity: Optional["LegalEntity"] = Relationship(back_populates="catalog_parts")
    twin_id: Optional[int] = Field(unique=True, foreign_key="twin.id")
    name: str = Field(default="", description="The name of the catalog part at the manufacturer.")
    description: Optional[str] = Field(default=None, description="The description of the catalog part.")
    category: Optional[str] = Field(default=None)
    bpns: Optional[str] = Field(default=None)
    materials: List[Material] = Field(default_factory=list, sa_column=Column(JSON))
    width: Optional[Measurement] = Field(default=None, sa_column=Column(JSON))
    height: Optional[Measurement] = Field(default=None, sa_column=Column(JSON))
    length: Optional[Measurement] = Field(default=None, sa_column=Column(JSON))
    weight: Optional[Measurement] = Field(default=None, sa_column=Column(JSON))

    __table_args__ = (
        UniqueConstraint("legal_entity_id", "manufacturer_part_id", name="uk_catalog_part_legal_entity_id_manufacturer_part_id"),
    )

    __tablename__ = "catalog_part"

class PartnerCatalogPart(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    business_partner_id: int = Field(index=True, foreign_key="business_partner.id")
    catalog_part_id: int = Field(index=True, foreign_key="catalog_part.id")
    customer_part_id: str = Field(index=True, default="")

    __table_args__ = (
        UniqueConstraint("business_partner_id", "catalog_part_id", name="uk_partner_catalog_part_business_partner_id_catalog_part_id"),
    )

    __tablename__ = "partner_catalog_part"

class SerializedPart(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    partner_catalog_part_id: int = Field(index=True, foreign_key="partner_catalog_part.id")
    part_instance_id: str = Field(index=True)
    van: Optional[str] = Field(index=True, default=None)
    twin_id: Optional[int] = Field(unique=True, foreign_key="twin.id")

    __table_args__ = (
        UniqueConstraint("part_instance_id", "partner_catalog_part_id", name="uk_serialized_part_partner_catalog_part_id_part_instance_id"),
    )

    __tablename__ = "serialized_part"

class JISPart(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    partner_catalog_part_id: int = Field(index=True, foreign_key="partner_catalog_part.id")
    jis_number: str = Field(index=True)
    parent_order_number: Optional[str] = Field(index=True, default=None)
    jis_call_date: Optional[str] = Field(index=True, default=None)
    twin_id: Optional[int] = Field(unique=True, foreign_key="twin.id")

    __table_args__ = (
        UniqueConstraint("jis_number", "partner_catalog_part_id", name="uk_jis_part_partner_catalog_part_id_jis_number"),
    )

    __tablename__ = "jis_part"

class Batch(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    batch_id: str = Field(index=True)
    catalog_part_id: int = Field(index=True, foreign_key="catalog_part.id")
    twin_id: Optional[int] = Field(unique=True, foreign_key="twin.id")
    twin: Optional["Twin"] = Relationship(back_populates="batch")

    __table_args__ = (
        UniqueConstraint("catalog_part_id", "batch_id", name="uk_batch_catalog_part_id_batch_id"),
    )

    __tablename__ = "batch"

class BatchBusinessPartner(SQLModel, table=True):
    batch_id: int = Field(foreign_key="batch.id", primary_key=True)
    business_partner_id: int = Field(foreign_key="business_partner.id", primary_key=True)

    __tablename__ = "batch_business_partner"