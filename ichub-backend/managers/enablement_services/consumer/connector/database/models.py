#################################################################################
# Eclipse Tractus-X - Industry Core Hub Backend
#
# Copyright (c) 2025 CGI Deutschland B.V. & Co. KG
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

from sqlalchemy import Column, String, DateTime, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime, timezone
from typing import Optional

Base = declarative_base()


class ConnectorCache(Base):
    """
    Database model for storing connector cache information.
    
    This table stores cached connector information for Business Partner Numbers (BPNs)
    with expiration timestamps for cache management.
    """
    
    __tablename__ = 'connector_cache'
    
    # Primary key: combination of BPN and connector_id ensures uniqueness
    bpn = Column(String(20), primary_key=True, nullable=False, doc="Business Partner Number")
    connector_id = Column(String(64), primary_key=True, nullable=False, doc="SHA3-256 hash of connector URL")
    
    # Connector information
    connector_url = Column(Text, nullable=False, doc="Full connector URL/endpoint")
    
    # Cache management
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, doc="When the cache entry was created")
    expires_at = Column(DateTime(timezone=True), nullable=False, doc="When the cache entry expires")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, doc="Last update timestamp")
    
    # Metadata
    dct_type = Column(String(50), nullable=True, doc="Data consumption type identifier")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_connector_cache_bpn', 'bpn'),
        Index('idx_connector_cache_expires_at', 'expires_at'),
        Index('idx_connector_cache_bpn_expires', 'bpn', 'expires_at'),
    )
    
    def __repr__(self):
        return f"<ConnectorCache(bpn='{self.bpn}', connector_id='{self.connector_id}', expires_at='{self.expires_at}')>"
    
    def is_expired(self) -> bool:
        """
        Check if this cache entry has expired.
        
        Returns:
            bool: True if the cache entry is expired, False otherwise
        """
        return datetime.now(timezone.utc) > self.expires_at
    
    def to_dict(self) -> dict:
        """
        Convert the cache entry to a dictionary.
        
        Returns:
            dict: Dictionary representation of the cache entry
        """
        return {
            'bpn': self.bpn,
            'connector_id': self.connector_id,
            'connector_url': self.connector_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'dct_type': self.dct_type,
            'is_expired': self.is_expired()
        }


class ConnectorDiscoveryLog(Base):
    """
    Database model for logging connector discovery operations.
    
    This table tracks discovery attempts and results for auditing and debugging purposes.
    """
    
    __tablename__ = 'connector_discovery_log'
    
    # Primary key
    id = Column(String(36), primary_key=True, doc="UUID for the log entry")
    
    # Discovery information
    bpn = Column(String(20), nullable=False, doc="Business Partner Number that was queried")
    discovery_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, doc="When the discovery was performed")
    
    # Results
    connectors_found = Column(String, nullable=True, doc="Number of connectors found")
    success = Column(String(5), nullable=False, doc="Whether the discovery was successful (true/false)")
    error_message = Column(Text, nullable=True, doc="Error message if discovery failed")
    
    # Metadata
    dct_type = Column(String(50), nullable=True, doc="Data consumption type identifier")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_discovery_log_bpn', 'bpn'),
        Index('idx_discovery_log_timestamp', 'discovery_timestamp'),
        Index('idx_discovery_log_bpn_timestamp', 'bpn', 'discovery_timestamp'),
    )
    
    def __repr__(self):
        return f"<ConnectorDiscoveryLog(id='{self.id}', bpn='{self.bpn}', success='{self.success}')>"
    
    def to_dict(self) -> dict:
        """
        Convert the log entry to a dictionary.
        
        Returns:
            dict: Dictionary representation of the log entry
        """
        return {
            'id': self.id,
            'bpn': self.bpn,
            'discovery_timestamp': self.discovery_timestamp.isoformat() if self.discovery_timestamp else None,
            'connectors_found': self.connectors_found,
            'success': self.success,
            'error_message': self.error_message,
            'dct_type': self.dct_type
        }
