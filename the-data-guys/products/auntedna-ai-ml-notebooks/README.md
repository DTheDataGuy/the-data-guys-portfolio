# auntEDNA.ai Machine-Learning Notebooks: LLM Fine-Tuning, RAG & User Data Model

**Client / organization:** The Data Guys × auntEDNA.ai (co-authored with Ujjwal Suyash)  
**Built by:** Dei'Marlon Scisney · The Data Guys

## Overview

The machine-learning workbench behind auntEDNA.ai's wellness assistants. Six Colab notebooks cover the user data model on PostgreSQL, a retrieval-augmented QA prototype, LoRA fine-tuning of Llama 3.2 on conversation data pulled from S3, inference testing, and keyword analysis of conversation logs.

## Tech stack

`Python` · `PyTorch` · `Unsloth (LoRA / QLoRA)` · `Llama 3.2 3B Instruct` · `Hugging Face TRL / transformers` · `LangChain` · `Chroma` · `OpenAI` · `PostgreSQL (AWS RDS)` · `SQLAlchemy` · `AWS S3 (boto3)` · `spaCy / NLTK` · `Google Colab (GPU)`

## Engineering highlights

- **User data model** (`01`): SQLAlchemy schema for roles, universities and per-assistant user tables on PostgreSQL (AWS RDS), created and verified from code.
- **RAG prototype** (`02`): LangChain document loading, recursive text splitting, Chroma vector store, OpenAI embeddings and a retrieval QA chain.
- **LLM fine-tuning** (`03`, `05`): Unsloth 4-bit Llama 3.2 3B Instruct with LoRA adapters (r = 64) on all attention and MLP projections, chat-template formatting, response-only loss masking and TRL `SFTTrainer`.
- **Data pipeline from S3** (`03`–`05`): boto3 downloads of processed conversation datasets (CSV and Parquet) into Hugging Face `datasets`.
- **Inference testing** (`04`): load a trained checkpoint and generate responses to wellness prompts on GPU.
- **Conversation analytics** (`06`): spaCy and NLTK cleaning, TF-IDF keyword extraction and word clouds over user messages.

## Run it

```bash
pip install jupyterlab
jupyter lab notebooks/
```

All credentials were removed. The notebooks read keys from environment variables (`OPENAI_API_KEY`, `AWS_ACCESS_KEY_ID`, database settings), so set those before running cells that call external services.

## Code footprint

| Language | Authored lines |
|---|---:|
| Python | 535 |

## Confidentiality

Co-authored with Ujjwal Suyash. All credentials (OpenAI, LangChain, AWS keys, database host and password, bucket name) were removed and replaced with environment variables, and every cell output was cleared. Training data and conversation logs are not included.
