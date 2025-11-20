# Akeno Company - Key Information for Job Application

## Company Overview
- Product runs within each customer's intranet (on-premise deployment)
- Each customer has their own isolated instance (not a shared cloud solution)
- Handles sensitive customer data requiring high trust and reliability
- Small number of users per site but large amounts of complex data

## Technical Stack

### Core Technologies (ADOPT - actively used)
**Languages:**
- TypeScript
- Python

**Frontend:**
- React
- Tailwind CSS
- Cypress (testing)
- Brynt Scheduler Pro (scheduling UI)
- GraphQL Codegen

**Backend:**
- NestJS
- GraphQL
- REST APIs

**Data Management:**
- PostgreSQL (primary database)
- Hasura 2.x (GraphQL engine)

**Infrastructure & Tools:**
- Docker & Docker Compose (core deployment)
- Terraform (deployment automation)
- VS Code
- Nx (monorepo tooling)
- Grafana (monitoring)

**Optimization:**
- OR-Tools (Google's optimization library)

### Technologies in Trial/Assessment
- GitHub Actions (TRIAL)
- Hatchet (ASSESS)
- React Testing Library (ASSESS)
- Development Containers (ASSESS)
- Hasura 3.x (ASSESS)

### Technologies on Hold/Not Used
- Kubernetes (HOLD - may consider in future)
- MongoDB (HOLD)
- Flask (HOLD)
- Testcontainers (HOLD)
- Cloud-native development (HOLD)

## Technical Philosophy & Approach

### Deployment Strategy
- **Docker Compose over Kubernetes**: Simplified deployment using Docker Compose
- **Infrastructure agnostic**: Works on AWS, Azure, Google Cloud, or on-premise
- **Terraform-based**: Automated deployment and customer-specific configurations
- **Same images for all customers**: Standardized deployment across all sites
- **Developer-friendly**: Everything runs locally on developer machines

### Scaling Approach
- Focus on **data scalability** (handling large, complex datasets)
- Focus on **site scalability** (easy setup and maintenance of new customer sites)
- NOT focused on user scalability (small user base per site)
- No typical cloud SaaS scaling challenges (no SEO optimization, DDoS concerns, sudden spikes)

### Development Values
1. **Simplicity over complexity**: Avoid unnecessary tools and complexity
2. **Tried-and-tested over bleeding edge**: Stable, proven frameworks preferred
3. **Developer experience**: Easy local development, minimal infrastructure skills needed
4. **Pragmatism**: Focus on product improvement over over-optimization

### Quality & Reliability
- **High trust relationship** with customers is paramount
- **Testing strategy**: End-to-end and API-level integration tests (not excessive unit tests)
- **Reliability through simplicity**: Avoiding unnecessary complexity
- **Performance focus**: Quick, informed decisions with complex data visualization
- **Business impact**: Decisions can affect millions of Euros

## Key Differentiators

### What Makes This Role Unique
1. **On-premise architecture** in a cloud-dominated world
2. **Security-first approach** due to sensitive data
3. **Complex data processing & visualization** rather than user scaling
4. **Infrastructure simplicity** - no Kubernetes complexity
5. **Direct customer impact** - decisions affect million-Euro outcomes
6. **Isolated deployments** - each customer has dedicated system

### Technical Challenges
- Visualizing and processing large amounts of complex data efficiently
- Maintaining performance with complex calculations
- Ensuring quick user decision-making with responsive UI
- Deploying to diverse customer environments (not standardized cloud)
- Managing customer-specific configurations while maintaining standardization

## What They're NOT Looking For
- Cloud-native/Kubernetes experts (they deliberately avoid this complexity)
- Microservices architecture experience
- High-scale user traffic optimization
- SEO optimization
- Public SaaS experience

## What They ARE Looking For
- Strong TypeScript/React/NestJS skills
- PostgreSQL and GraphQL experience
- Docker and containerization knowledge
- Experience with complex data visualization
- Understanding of on-premise deployment challenges
- Pragmatic problem-solving approach
- Focus on reliability and trust
- Ability to work with optimization algorithms (OR-Tools is a plus)

## Cultural Fit Indicators
- Values **simplicity and pragmatism**
- Prefers **stability over novelty**
- Focuses on **user value** over technical perfection
- Appreciates **straightforward solutions**
- Emphasizes **developer experience**
- Prioritizes **reliability and trust**

## Application Tips

### For Cover Letter
- Emphasize experience with their core stack (TypeScript, React, NestJS, PostgreSQL)
- Highlight pragmatic approach to problem-solving
- Mention any on-premise deployment experience
- Discuss experience with complex data visualization
- Show understanding of their deployment model (isolated customer instances)
- Demonstrate value alignment (simplicity, reliability, trust)

### For Interview Preparation
- Be ready to discuss Docker Compose orchestration
- Understand trade-offs of on-premise vs cloud deployment
- Prepare examples of choosing simple solutions over complex ones
- Know about GraphQL, Hasura, and type-safe development
- Be familiar with Nx monorepos and development workflows
- Understand optimization problems (if applicable to your role)

