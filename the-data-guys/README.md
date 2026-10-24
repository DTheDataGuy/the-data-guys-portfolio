# The Data Guys: Products, Website & Presentations

## [Material Recovery Operations API](products/material-recovery-operations-api/)

The backend for a construction material-recovery product: it tracks material received from job sites, recovery events and disposal records so contractors can report diversion and reuse. Async FastAPI with SQLAlchemy models, nine Alembic migrations and a Lambda deployment handler.

**Stack:** Python, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, PostgreSQL / SQLite, AWS Lambda (Mangum), OpenAI, Stripe

## [auntEDNA.ai Machine-Learning Notebooks: LLM Fine-Tuning, RAG & User Data Model](products/auntedna-ai-ml-notebooks/)

The machine-learning workbench behind auntEDNA.ai's wellness assistants. Six Colab notebooks cover the user data model on PostgreSQL, a retrieval-augmented QA prototype, LoRA fine-tuning of Llama 3.2 on conversation data pulled from S3, inference testing, and keyword analysis of conversation logs.

**Stack:** Python, PyTorch, Unsloth (LoRA / QLoRA), Llama 3.2 3B Instruct, Hugging Face TRL / transformers, LangChain, Chroma, OpenAI, PostgreSQL (AWS RDS), SQLAlchemy, AWS S3 (boto3), spaCy / NLTK, Google Colab (GPU)

## [thedataguys.org: Company Website](thedataguys-website/)

The Data Guys' marketing and lead-generation site: a large React application with interactive diagnostics, calculators and content.

**Stack:** TypeScript, React 18, Vite, Tailwind CSS, shadcn/ui, React Router, Prerendering, Vercel  
**Live:** [thedataguys.org](https://thedataguys.org)

## [Stack & Chill: Investing & Paper-Trading Platform](products/stack-and-chill-investing-platform/)

A beginner-friendly investing platform that connects a monthly contribution plan to weekly portfolio review, research screens, Track It simulations and Alpaca paper-account automation.

**Stack:** React, TypeScript, Vite, Alpaca Paper Trading API, Tailwind CSS  
**Live:** [stackandchill.pplx.app](https://stackandchill.pplx.app)

## [Who Holds the Kill Switch? Interactive AI-Governance Presentation](presentations/who-holds-the-kill-switch/)

A 26-slide, editorial-style interactive web presentation on AI acceleration, regulation and emergency-shutdown authority for a business audience, with a separate speaker guide and participant takeaway.

**Stack:** HTML5, JavaScript, CSS3

[← Back to portfolio](../README.md)
