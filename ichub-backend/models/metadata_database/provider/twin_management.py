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

from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import UniqueConstraint, SmallInteger
from .part_management import Batch

class Twin(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    global_id: UUID = Field(default_factory=uuid4, unique=True)
    aas_id: UUID = Field(default_factory=uuid4, unique=True)
    created_date: datetime = Field(index=True, default_factory=datetime.utcnow)
    modified_date: datetime = Field(index=True, default_factory=datetime.utcnow)
    asset_class: Optional[str] = Field(default=None)
    additional_context: Optional[str] = Field(default=None)
    batch: Optional["Batch"] = Relationship(back_populates="twin")
    twin_aspects: List["TwinAspect"] = Relationship(back_populates="twin")
    twin_exchanges: List["TwinExchange"] = Relationship(back_populates="twin")
    twin_registrations: List["TwinRegistration"] = Relationship(back_populates="twin")
    __tablename__ = "twin"


class TwinAspect(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    submodel_id: UUID = Field(default_factory=uuid4, unique=True)
    semantic_id: str = Field(index=True)
    twin_id: int = Field(index=True, foreign_key="twin.id")
    twin: Twin = Relationship(back_populates="twin_aspects")
    twin_aspect_registrations: List["TwinAspectRegistration"] = Relationship(back_populates="twin_aspect")
    __table_args__ = (
        UniqueConstraint("twin_id", "semantic_id", name="uk_twin_aspect_twin_id_semantic_id"),
    )
    __tablename__ = "twin_aspect"


class TwinAspectRegistration(SQLModel, table=True):
    twin_aspect_id: int = Field(foreign_key="twin_aspect.id", primary_key=True)
    enablement_service_stack_id: int = Field(foreign_key="enablement_service_stack.id", primary_key=True)
    status: int = Field(index=True, default=0, sa_type=SmallInteger)
    registration_mode: int = Field(index=True, default=0, sa_type=SmallInteger)
    created_date: datetime = Field(index=True, default_factory=datetime.utcnow)
    modified_date: datetime = Field(index=True, default_factory=datetime.utcnow)
    twin_aspect: TwinAspect = Relationship(back_populates="twin_aspect_registrations")
    enablement_service_stack: "EnablementServiceStack" = Relationship(back_populates="twin_aspect_registrations")
    __tablename__ = "twin_aspect_registration"


class TwinExchange(SQLModel, table=True):
    twin_id: int = Field(foreign_key="twin.id", primary_key=True)
    data_exchange_agreement_id: int = Field(index=True, foreign_key="data_exchange_agreement.id", primary_key=True)
    twin: Twin = Relationship(back_populates="twin_exchanges")
    data_exchange_agreement: "DataExchangeAgreement" = Relationship(back_populates="twin_exchanges")
    __tablename__ = "twin_exchange"


class TwinRegistration(SQLModel, table=True):
    twin_id: int = Field(foreign_key="twin.id", primary_key=True)
    enablement_service_stack_id: int = Field(foreign_key="enablement_service_stack.id", primary_key=True)
    dtr_registered: bool = Field(index=True, default=False)
    twin: Twin = Relationship(back_populates="twin_registrations")
    enablement_service_stack: "EnablementServiceStack" = Relationship(back_populates="twin_registrations")
    __tablename__ = "twin_registration"
