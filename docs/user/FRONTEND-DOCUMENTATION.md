
# Industry Core Hub Frontend Documentation

> **Welcome to the Industry Core Hub (ICHub) Frontend Documentation!**
>
> This guide will help you understand, navigate, and make the most of the ICHub frontend. The ICHub frontend is designed to provide a seamless, user-friendly interface for managing data space components and KITs, following modern UI/UX standards and focusing on usability and scalability.

---

## Table of Contents

- [Introduction](#introduction)
- [KITs and Features Overview](#kits-and-features-overview)
- [Generic Features](#generic-features)
- [Screenshots & Visuals](#screenshots--visuals)
- [Licensing](#licensing)

---

## Introduction

The Industry Core Hub frontend enables users to:
- Interact with Tractus-X data space components and KITs without complex configuration.
- Access, share, and manage automotive sector data products.
- Scale progressively as new KITs and features are integrated.

The application is organized by KITs, each providing a set of features. This documentation is divided accordingly, with each feature explained in its own document.

---

## KITs and Features Overview

### 1. **Industry Core Hub KIT**
- [Catalog Parts](features/ichub/CATALOG-PARTS.md): Create, register, and publish Catalog Parts in the data space.
- [Serialized Parts](features/ichub/SERIALIZED-PARTS.md): Create, assign to Catalog Parts, register, and publish Serialized Parts.
- [Dataspace Discovery](features/ichub/DATASPACE-DISCOVERY.md): Consume Catalog and Serialized Parts published by your contacts.
- [Contact List](features/ichub/CONTACT-LIST.md): Define and manage data space participants (Name and BPNL).

### 2. **Eco Pass KIT**
- [Passport Provision & Management](features/eco-pass/DPP-PROVIDER-MANAGEMENT.md): Use a wizard to create a Data Product Passport in the data space.
- [Passport Consumption & Visualization](features/eco-pass/DPP-CONSUMER-VIEWER.md): Consume and visualize a published Digital Passport via QR or identifier.

---

## Generic Features

- [KIT Features](features/KIT-FEATURES.md): Enable or disable KIT-based features in your application. Configure which features appear in the ICHub frontend.
- [Submodel Creator](features/SUBMODEL_CREATOR_GUIDE.md): Guided interface to create and register submodels for your parts, based on Tractus-X JSON Schemas.
- [Policy Management](features/POLICY-MANAGEMENT.md): Generate, view, and manage data space policies using a Policy Builder.
- [System Management](features/SYSTEM-MANAGEMENT.md): Connect, register, and manage systems related to your Industry Core Hub.

---

## Licensing

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode). For more details, see the [NOTICE](../../ichub-frontend/NOTICE.md) file.

---

> For detailed usage instructions, see each feature's documentation linked above. For questions or contributions, please refer to the [CONTRIBUTING.md](../../CONTRIBUTING.md).