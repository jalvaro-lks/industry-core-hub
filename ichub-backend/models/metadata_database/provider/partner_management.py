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
