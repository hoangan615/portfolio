"""
Seed script: creates owner account + portfolio data for Võ Hoàng Ân.
Run: python seed.py  (inside the api container / with venv activated after migrations)
"""
from __future__ import annotations

import asyncio
import os
import sys

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# ── Env ───────────────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:password@postgres:5432/portfolio_db",
)
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "hoangan@portfolio.local")
OWNER_USERNAME = os.environ.get("OWNER_USERNAME", "hoangan")
OWNER_PASSWORD = os.environ.get("OWNER_PASSWORD", "CHANGE_ME_STRONG_PASSWORD")

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def seed_owner(db: AsyncSession):
    from core.security import hash_password
    from modules.users.models import User, UserSettings

    result = await db.execute(select(User).where(User.email == OWNER_EMAIL))
    user = result.scalar_one_or_none()
    if user:
        print(f"  Owner already exists: {user.email}")
        return user

    user = User(
        username=OWNER_USERNAME,
        email=OWNER_EMAIL,
        password_hash=hash_password(OWNER_PASSWORD),
        display_name="Võ Hoàng Ân",
        bio=(
            ".NET Developer & Technical Lead at FPT Software. "
            "10+ years delivering enterprise software, specialized in AI/LLM solutions "
            "and GitHub Copilot agent development for the SDLC."
        ),
        role="owner",
        status="active",
        email_verified=True,
    )
    db.add(user)
    await db.flush()

    user_settings = UserSettings(user_id=user.id)
    db.add(user_settings)
    await db.flush()

    print(f"  Created owner: {user.email} (id={user.id})")
    return user


async def seed_portfolio(db: AsyncSession, user_id) -> None:
    from modules.portfolio.models import Experience, PortfolioProfile, Project, Skill

    # Profile
    result = await db.execute(
        select(PortfolioProfile).where(PortfolioProfile.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        db.add(PortfolioProfile(
            user_id=user_id,
            headline=".NET Developer & Technical Lead",
            tagline="10+ years delivering enterprise software — AI/LLM solutions & GitHub Copilot agent development",
            about=(
                "Results-driven Technical Lead and AI Engineer with 10+ years at FPT Software. "
                "Specializes in leveraging AI and LLMs to optimize the SDLC — building custom GitHub Copilot "
                "agents that automate code generation, code reviews, refactoring, and unit test creation.\n\n"
                "Deep expertise in the .NET ecosystem (C#, .NET Core, .NET 8) combined with applied AI "
                "engineering: Azure OpenAI, Azure Document Intelligence, LangChain, RAG, and vector databases. "
                "Has led teams of up to 60 engineers across enterprise platforms in AI/document intelligence, "
                "blockchain loyalty, real estate management, OCR processing, and DICOM medical imaging."
            ),
            github_url="https://github.com/hoangan615",
            open_to_work=False,
        ))
        print("  Created portfolio profile")

    # Skills
    existing_skills = await db.execute(
        select(func.count()).select_from(Skill).where(Skill.user_id == user_id)
    )
    if existing_skills.scalar() == 0:
        skills_data = [
            # AI & LLM — primary differentiator
            ("Azure OpenAI", "AI & LLM", 95, 0),
            ("GitHub Copilot Agent Dev", "AI & LLM", 93, 1),
            ("Azure Document Intelligence", "AI & LLM", 90, 2),
            ("LangChain / RAG", "AI & LLM", 85, 3),
            ("Embeddings / Vector DB", "AI & LLM", 82, 4),
            ("ABBYY Fine Reader", "AI & LLM", 85, 5),
            # Backend
            ("C#", "Backend", 95, 10),
            (".NET Core / .NET 8", "Backend", 95, 11),
            ("Entity Framework", "Backend", 88, 12),
            ("Node.js", "Backend", 75, 13),
            ("SignalR / Azure Service Bus", "Backend", 80, 14),
            # Frontend
            ("Angular", "Frontend", 85, 20),
            ("ReactJS", "Frontend", 85, 21),
            ("React Native", "Frontend", 83, 22),
            ("TypeScript", "Frontend", 87, 23),
            ("HTML / CSS", "Frontend", 88, 24),
            # Database
            ("MSSQL", "Database", 90, 30),
            ("MySQL", "Database", 82, 31),
            ("MongoDB", "Database", 80, 32),
            ("Elasticsearch", "Database", 78, 33),
            # Cloud & DevOps
            ("Azure", "Cloud & DevOps", 88, 40),
            ("AWS", "Cloud & DevOps", 72, 41),
            ("GCP", "Cloud & DevOps", 68, 42),
            ("Docker", "Cloud & DevOps", 80, 43),
            # Tools
            ("Redis", "Tools", 85, 50),
            ("RabbitMQ", "Tools", 80, 51),
            ("Hangfire", "Tools", 82, 52),
            ("Datadog / Sentry", "Tools", 72, 53),
        ]
        for name, category, proficiency, sort_order in skills_data:
            db.add(Skill(
                user_id=user_id,
                name=name,
                category=category,
                proficiency=proficiency,
                sort_order=sort_order,
            ))
        print(f"  Created {len(skills_data)} skills")

    # Experiences
    existing_exp = await db.execute(
        select(func.count()).select_from(Experience).where(Experience.user_id == user_id)
    )
    if existing_exp.scalar() == 0:
        experiences_data = [
            {
                "company": "FPT Software",
                "title": "Sub Project Lead / AI Engineer",
                "location": "Ho Chi Minh City, Vietnam",
                "start_date": "2024-12",
                "end_date": None,
                "description": (
                    "Leading AI feature development for an enterprise document intelligence platform "
                    "(CPE2024/CPE2025) serving a major Japanese financial institution. Spearheaded the "
                    "initiative to integrate GitHub Copilot agents and Azure OpenAI into both the product "
                    "and the engineering workflow across a 60-member team.\n\n"
                    "Key achievements:\n"
                    "• Built custom GitHub Copilot agents: code generation (−15–25% effort), "
                    "code review & refactoring (−20–30% review time, −40% review bugs), "
                    "and unit test generation (−40% UT effort)\n"
                    "• Leveraged Azure OpenAI + Azure Document Intelligence → 99% data capture accuracy\n"
                    "• Architected RAG-powered AI Chatbot for customer support\n"
                    "• Led AI feature sub-team: requirements analysis, architecture, code reviews"
                ),
                "technologies": ".NET Core, .NET 8, Angular, Azure OpenAI, Azure Document Intelligence, "
                                "GitHub Copilot, LangChain, RAG, OCR (ABBYY), SQLServer, MongoDB, Redis, "
                                "RabbitMQ, Elasticsearch",
                "sort_order": 0,
            },
            {
                "company": "FPT Software",
                "title": "Sub Leader",
                "location": "Ho Chi Minh City, Vietnam",
                "start_date": "2026-01",
                "end_date": "2026-04",
                "description": (
                    "Concurrent assignment as Sub Leader on COPATIS26 — a Carton Production Management "
                    "System for a Japanese manufacturing client within a 112-member project organisation. "
                    "Handled feature delivery alongside the main CPE2024/2025 engagement."
                ),
                "technologies": ".NET Framework, VB.Net, SQLServer",
                "sort_order": 1,
            },
            {
                "company": "FPT Software",
                "title": "Sub Project Lead",
                "location": "Ho Chi Minh City, Vietnam",
                "start_date": "2023-07",
                "end_date": "2024-11",
                "description": (
                    "Led full-cycle development of an integrated real estate contract management and "
                    "construction-progress monitoring platform (KIZUNA23/24) for a leading Japanese "
                    "property developer. 28-member team across web and mobile channels.\n\n"
                    "Key achievements:\n"
                    "• Contract processing time: 7 days → 1 day (7× improvement via e-signature integration)\n"
                    "• Eliminated 95% of paper-based approval processes\n"
                    "• Delivered real-time construction monitoring module with geo-tagged evidence\n"
                    "• Shared component libraries accelerated feature delivery by 30%"
                ),
                "technologies": "Java, SpringBoot, Angular, ReactJS, ReactNative, SQLServer, Redis, GCP",
                "sort_order": 2,
            },
            {
                "company": "FPT Software",
                "title": "Sub Project Lead",
                "location": "Ho Chi Minh City, Vietnam",
                "start_date": "2020-04",
                "end_date": "2023-07",
                "description": (
                    "Spearheaded architecture and delivery of a blockchain-based enterprise loyalty ecosystem "
                    "(FCTAKC) for a Japanese corporate network. Led from pilot to full production — 50-member team.\n\n"
                    "Key achievements:\n"
                    "• Microservice architecture on Azure/AWS — transaction volume 3× over legacy system\n"
                    "• Private blockchain ensuring immutable audit trails with sub-second API response\n"
                    "• Built consumer web/mobile, merchant portal, and back-office suite on shared design system\n"
                    "• 50-engineer organisation; 99.9% SLA with <4 hours MTTR"
                ),
                "technologies": ".NET Core, ABP, Angular, ReactJS, ReactNative, Blockchain, "
                                "SQLServer, MySQL, PostgreSQL, MongoDB, RabbitMQ, Redis, Azure, AWS",
                "sort_order": 3,
            },
            {
                "company": "FPT Software",
                "title": "Core Member",
                "location": "Ho Chi Minh City, Vietnam",
                "start_date": "2018-02",
                "end_date": "2020-04",
                "description": (
                    "Core engineer on a high-throughput OCR document processing system (CPE Phase 2/3) "
                    "integrated with ABBYY FineReader Engine — 20-member team.\n\n"
                    "Key achievements:\n"
                    "• Automated OCR pipeline processing tens of thousands of pages/day\n"
                    "• Throughput improved 40%, character error rate reduced below 2%\n"
                    "• Angular operator interfaces reduced review time per document by 35%\n"
                    "• Automated regression suite covering 500+ document templates"
                ),
                "technologies": ".NET Core, Angular, SQLServer, MongoDB, Elasticsearch, "
                                "Redis, RabbitMQ, Hangfire, Azure, ABBYY OCR FineReader",
                "sort_order": 4,
            },
            {
                "company": "FPT Software",
                "title": "Project Manager",
                "location": "Ho Chi Minh City, Vietnam",
                "start_date": "2019-02",
                "end_date": "2019-04",
                "description": (
                    "Managed delivery of a virtual printer driver project (VPD) targeting macOS and Windows, "
                    "upgrading a legacy codebase to use modern platform APIs. 5-member team, concurrent with "
                    "CPE Phase 2/3. Delivered with a perfect 100 CSS (Customer Satisfaction Score)."
                ),
                "technologies": "C, C++, QT Creator, macOS, Windows",
                "sort_order": 5,
            },
            {
                "company": "FPT Software",
                "title": "Team Lead / Member",
                "location": "Ho Chi Minh City, Vietnam",
                "start_date": "2015-11",
                "end_date": "2017-12",
                "description": (
                    "Led delivery of a DICOM-compliant medical imaging platform (CT_CAD series) for CT/MRI "
                    "diagnostics, serving hospitals and radiology centres in the Japanese healthcare market. "
                    "40-member team.\n\n"
                    "Key achievements:\n"
                    "• DICOM-standards-compliant system (CT, MRI, X-Ray) — zero critical defects in clinical validation\n"
                    "• Volume rendering algorithms doubled CT scan resolution vs prior release\n"
                    "• PACS integration layer reduced image retrieval time from minutes to seconds"
                ),
                "technologies": "C#, .NET Framework, WPF, WCF, C++, SQLServer, Git, SVN",
                "sort_order": 6,
            },
            {
                "company": "Can Tho University",
                "title": "Bachelor of Engineering (Graduated with Distinction)",
                "location": "Can Tho, Vietnam",
                "start_date": "2011-09",
                "end_date": "2015-06",
                "description": (
                    "Bachelor of Engineering in Information Technology. "
                    "Graduated with Excellent distinction."
                ),
                "technologies": "C#, .NET, SQL Server, Java",
                "sort_order": 7,
            },
        ]
        for exp in experiences_data:
            db.add(Experience(user_id=user_id, **exp))
        print(f"  Created {len(experiences_data)} experiences")

    # Projects
    existing_proj = await db.execute(
        select(func.count()).select_from(Project).where(Project.user_id == user_id)
    )
    if existing_proj.scalar() == 0:
        projects_data = [
            {
                "title": "CPE2024 — AI Document Intelligence Platform",
                "description": (
                    "Enterprise AI document intelligence platform built with Azure OpenAI and Azure Document "
                    "Intelligence, achieving 99% data capture accuracy. Also engineered custom GitHub Copilot "
                    "agents that reduced implementation effort by 15–25% and review time by 20–30% across the "
                    "60-member team. RAG-powered AI Chatbot significantly reduced customer support tickets."
                ),
                "tech_stack": ".NET Core, .NET 8, Angular, Azure OpenAI, Azure Document Intelligence, "
                              "GitHub Copilot, LangChain, RAG, SQLServer, MongoDB, Redis, RabbitMQ, "
                              "Elasticsearch, ABBYY Fine Reader Engine",
                "featured": True,
                "sort_order": 0,
            },
            {
                "title": "FCTAKC — Blockchain Loyalty Platform",
                "description": (
                    "Enterprise blockchain-based loyalty system for medium and large companies. "
                    "Led the 6-member mobile team, designed micro-frontend architecture, "
                    "and delivered both web and mobile apps. 50 total team members."
                ),
                "tech_stack": ".NET Core, ABP, Angular, ReactJS, React Native, Blockchain, PostgreSQL, MySQL, Azure, AWS, Redis, RabbitMQ",
                "featured": True,
                "sort_order": 1,
            },
            {
                "title": "KIZUNA — Real Estate Management System",
                "description": (
                    "Contract management system and construction project monitoring app for real "
                    "estate business. Sub Project Lead (28 members). Built both web application "
                    "and mobile app for construction site monitoring."
                ),
                "tech_stack": "SpringBoot, Angular, ReactJS, React Native, SQLServer, Redis, GCP",
                "featured": True,
                "sort_order": 2,
            },
            {
                "title": "CPE — OCR Document Processing System",
                "description": (
                    "OCR system using ABBYY FineReader to extract and process data from generic "
                    "business documents (POs, registration forms, event docs). Supports email, "
                    "web upload, and cloud storage input. Core Member responsible for algorithm "
                    "optimization and system integration."
                ),
                "tech_stack": ".NET Core, Angular, SQLServer, MongoDB, Elasticsearch, Redis, RabbitMQ, Azure, ABBYY OCR",
                "featured": False,
                "sort_order": 3,
            },
            {
                "title": "CT_CAD — DICOM Medical Imaging System",
                "description": (
                    "System to view, analyze, and transfer DICOM medical images. "
                    "Handles filming progress display, storage, DVD burning, and automatic "
                    "analysis services. Team Lead role, trained new members, designed and "
                    "implemented core features."
                ),
                "tech_stack": "C#, .NET Framework, WPF, WCF, SQL Server, C++",
                "featured": False,
                "sort_order": 4,
            },
            {
                "title": "Community Platform",
                "description": (
                    "This portfolio platform — a community-style site with blog, video channel, "
                    "social feeds, and full content management. Built to showcase both content "
                    "and engineering skills."
                ),
                "tech_stack": "Python, FastAPI, PostgreSQL, Redis, React, Next.js, TypeScript, S3",
                "featured": True,
                "sort_order": 5,
            },
        ]
        for proj in projects_data:
            db.add(Project(user_id=user_id, **proj))
        print(f"  Created {len(projects_data)} projects")


async def seed_categories(db: AsyncSession) -> None:
    from modules.posts.models import Category

    existing = await db.execute(select(func.count()).select_from(Category))
    if existing.scalar() == 0:
        categories = [
            ("Technology", "technology"),
            ("Web Development", "web-development"),
            ("Mobile Development", "mobile-development"),
            ("DevOps & Cloud", "devops-cloud"),
            ("AI & Machine Learning", "ai-ml"),
            ("Database", "database"),
            ("Career", "career"),
            ("Tutorial", "tutorial"),
        ]
        for name, slug in categories:
            db.add(Category(name=name, slug=slug))
        print(f"  Created {len(categories)} categories")


async def main() -> None:
    print("Starting seed...")

    # Ensure the app root is on path
    app_root = os.path.dirname(os.path.abspath(__file__))
    if app_root not in sys.path:
        sys.path.insert(0, app_root)

    async with SessionLocal() as db:
        owner = await seed_owner(db)
        await seed_portfolio(db, owner.id)
        await seed_categories(db)
        await db.commit()

    print("Seed complete!")
    print(f"  Owner login: {OWNER_EMAIL} / {OWNER_PASSWORD}")
    print("  API docs: http://localhost:8000/docs")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
