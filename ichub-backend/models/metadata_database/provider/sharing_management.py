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
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import UniqueConstraint
from .twin_management import TwinExchange

class DataExchangeAgreement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    business_partner_id: int = Field(index=True, foreign_key="business_partner.id")
    business_partner: "BusinessPartner" = Relationship(back_populates="data_exchange_agreements")
    data_exchange_contracts: List["DataExchangeContract"] = Relationship(back_populates="data_exchange_agreement")
    twin_exchanges: List["TwinExchange"] = Relationship(back_populates="data_exchange_agreement")
    __table_args__ = (
        UniqueConstraint("business_partner_id", "name", name="uk_data_exchange_agreement_name_business_partner_id"),
    )
    __tablename__ = "data_exchange_agreement"


class DataExchangeContract(SQLModel, table=True):
    data_exchange_agreement_id: int = Field(foreign_key="data_exchange_agreement.id", primary_key=True)
    semantic_id: str = Field(primary_key=True)
    edc_usage_policy_id: str = Field()
    data_exchange_agreement: "DataExchangeAgreement" = Relationship(back_populates="data_exchange_contracts")
    __tablename__ = "data_exchange_contract"
