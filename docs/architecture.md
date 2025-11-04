# System Architecture Overview

## Overview
Paradise ERP is a multi-tenant ERP/CRM platform built with:
- **Backend:** NestJS (Node.js + Mongoose)
- **Frontend:** React + TypeScript + Tailwind CSS
- **Database:** MongoDB
- **API:** REST, JWT-based authentication

## Folder Structure
- `/server` - Backend application
- `/client` - Frontend application
- `/docs` - Documentation and internal planning
- `/.cursor` - Cursor AI configuration and rules

## Backend Modules
- `users` - Authentication and user management
- `invoices` - Invoicing and billing
- `organizations` - Tenant and company management
- `payments` - Payment tracking and integrations
