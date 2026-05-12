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
            "Full-Stack Developer & Tech Lead at FPT Software. "
            "9+ years building scalable web and mobile applications. "
            "Passionate about clean architecture, performance, and developer experience."
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
            headline="Full-Stack Developer & Tech Lead",
            tagline="9+ years building scalable web & mobile apps",
            about=(
                "Experienced developer with 9 years of web development using .NET and C#, "
                "and 5 years of mobile development using React Native. "
                "Currently Sub Project Lead at FPT Software, leading teams delivering "
                "AI-powered document intelligence, real estate management systems, "
                "and blockchain loyalty platforms.\n\n"
                "Strong expertise in system design, cross-functional collaboration, "
                "and delivering production-quality software at scale."
            ),
            github_url="https://github.com/hoangan-dev",
            open_to_work=False,
        ))
        print("  Created portfolio profile")

    # Skills
    existing_skills = await db.execute(
        select(func.count()).select_from(Skill).where(Skill.user_id == user_id)
    )
    if existing_skills.scalar() == 0:
        skills_data = [
            # Frontend
            ("ReactJS", "Frontend", 90, 0),
            ("React Native", "Frontend", 88, 1),
            ("Angular", "Frontend", 85, 2),
            ("TypeScript", "Frontend", 87, 3),
            ("HTML / CSS", "Frontend", 90, 4),
            # Backend
            (".NET Core", "Backend", 95, 10),
            ("C#", "Backend", 95, 11),
            ("Node.js", "Backend", 78, 12),
            ("SpringBoot", "Backend", 72, 13),
            # Database
            ("MSSQL", "Database", 90, 20),
            ("PostgreSQL", "Database", 85, 21),
            ("MySQL", "Database", 85, 22),
            ("MongoDB", "Database", 80, 23),
            # Cloud & DevOps
            ("Azure", "Cloud/DevOps", 85, 30),
            ("AWS", "Cloud/DevOps", 75, 31),
            ("GCP", "Cloud/DevOps", 70, 32),
            ("Docker", "Cloud/DevOps", 82, 33),
            # Tools
            ("Redis", "Tools", 85, 40),
            ("RabbitMQ", "Tools", 80, 41),
            ("Elasticsearch", "Tools", 78, 42),
            ("Hangfire", "Tools", 82, 43),
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
                "title": "Sub Project Lead / Team Lead",
                "location": "Ho Chi Minh City, Vietnam",
                "start_date": "2015-11",
                "end_date": None,
                "description": (
                    "Led multiple sub-teams across diverse domains:\n"
                    "• CPE2024 - AI document intelligence platform (30 members)\n"
                    "• KIZUNA - Real estate contract management system (28 members)\n"
                    "• FCTAKC - Blockchain-based loyalty system (50 members)\n"
                    "• CPE Phase 2/3 - OCR document processing system (20 members)\n"
                    "• CT_CAD - Medical DICOM imaging system (40 members)\n\n"
                    "Responsibilities: estimation, planning, tracking, code review, "
                    "architecture design, and customer reporting across all projects."
                ),
                "technologies": ".NET Core, C#, Angular, ReactJS, React Native, Azure, AWS, GCP, "
                                "PostgreSQL, MSSQL, MongoDB, Redis, RabbitMQ, Elasticsearch, Hangfire",
                "sort_order": 0,
            },
            {
                "company": "Can Tho University",
                "title": "Bachelor of Engineering (Graduated with Distinction)",
                "location": "Can Tho, Vietnam",
                "start_date": "2011-09",
                "end_date": "2015-06",
                "description": (
                    "Bachelor of Engineering in Information Technology. "
                    "Graduated with Excellent distinction. "
                    "Thesis: Real-time data processing system using .NET and SQL Server."
                ),
                "technologies": "C#, .NET, SQL Server, Java",
                "sort_order": 1,
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
                "title": "CPE2024 — AI Document Intelligence",
                "description": (
                    "AI-powered platform for data capture, document scanning, and intelligent "
                    "document processing. Sub Project Lead for AI feature team (30 members total). "
                    "Used LLM and OCR to dramatically improve data extraction accuracy."
                ),
                "tech_stack": ".NET Core, Angular, Azure, SQLServer, MongoDB, Redis, RabbitMQ, Elasticsearch, ABBYY Fine Reader, LLM",
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
