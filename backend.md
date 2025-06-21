# Scheduled Tasks Feature - Backend Implementation Plan

## Overview

This document outlines the comprehensive backend implementation plan for the scheduled tasks feature. The feature allows users to export chat threads, generate summarized prompts using LLM, and schedule agent executions for automated task processing.

## Architecture Integration

### Current System Integration Points

- **Agent Execution**: Leverages existing `run_agent_background` infrastructure
- **Thread Management**: Integrates with current `ThreadManager` and message system
- **Authentication**: Uses existing JWT-based auth with `get_current_user_id_from_jwt`
- **Database**: Extends current Supabase schema with new tables
- **Background Jobs**: Utilizes existing Dramatiq actor system for async processing

## Database Schema Design

### New Tables

#### 1. scheduled_tasks Table

```sql
CREATE TABLE scheduled_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    source_thread_id UUID NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(agent_id) ON DELETE SET NULL,

    -- Task Configuration
    name VARCHAR(255) NOT NULL,
    description TEXT,
    generated_prompt TEXT NOT NULL, -- LLM-generated summarized prompt
    original_messages JSONB NOT NULL, -- Backup of original thread messages

    -- Scheduling Configuration
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_type VARCHAR(50), -- 'once', 'daily', 'weekly', 'monthly', 'cron'
    scheduled_at TIMESTAMP WITH TIME ZONE, -- For one-time execution
    cron_expression VARCHAR(100), -- For recurring schedules
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Execution Tracking
    last_executed_at TIMESTAMP WITH TIME ZONE,
    next_execution_at TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    max_executions INTEGER, -- NULL for unlimited

    -- Status and Metadata
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed', 'failed'
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

#### 2. task_executions Table

```sql
CREATE TABLE task_executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES scheduled_tasks(task_id) ON DELETE CASCADE,
    agent_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
    thread_id UUID REFERENCES threads(thread_id) ON DELETE SET NULL, -- New thread created for execution

    -- Execution Details
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    -- Execution Context
    execution_context JSONB DEFAULT '{}'::jsonb, -- Environment, triggers, etc.
    results JSONB DEFAULT '{}'::jsonb, -- Execution results/outputs

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### Indexes and Constraints

```sql
-- Indexes for scheduled_tasks
CREATE INDEX idx_scheduled_tasks_account_id ON scheduled_tasks(account_id);
CREATE INDEX idx_scheduled_tasks_source_thread_id ON scheduled_tasks(source_thread_id);
CREATE INDEX idx_scheduled_tasks_agent_id ON scheduled_tasks(agent_id);
CREATE INDEX idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX idx_scheduled_tasks_next_execution ON scheduled_tasks(next_execution_at) WHERE status = 'active';
CREATE INDEX idx_scheduled_tasks_created_at ON scheduled_tasks(created_at);

-- Indexes for task_executions
CREATE INDEX idx_task_executions_task_id ON task_executions(task_id);
CREATE INDEX idx_task_executions_status ON task_executions(status);
CREATE INDEX idx_task_executions_started_at ON task_executions(started_at);

-- Triggers for updated_at
CREATE TRIGGER update_scheduled_tasks_updated_at
    BEFORE UPDATE ON scheduled_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_executions_updated_at
    BEFORE UPDATE ON task_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## API Endpoints Design

### 1. Thread Export API

#### POST /api/thread/{thread_id}/export

**Purpose**: Export thread messages and generate summarized prompt

**Request Body**:

```json
{
  "task_name": "string (optional)",
  "task_description": "string (optional)"
}
```

**Response**:

```json
{
  "task_id": "uuid",
  "generated_prompt": "string",
  "original_message_count": "integer",
  "agent_id": "uuid",
  "source_thread_id": "uuid"
}
```

**Implementation Flow**:

1. Verify thread access permissions
2. Fetch all messages from thread
3. Extract user messages for LLM processing
4. Generate summarized prompt using LLM with specialized system prompt
5. Create draft scheduled_task record
6. Return task details for frontend

### 2. Task Management API

#### GET /api/tasks

**Purpose**: List all scheduled tasks for user

**Query Parameters**:

- `status`: Filter by task status
- `limit`: Pagination limit (default: 50)
- `offset`: Pagination offset
- `sort`: Sort field (created_at, name, next_execution_at)
- `order`: Sort order (asc, desc)

#### GET /api/tasks/{task_id}

**Purpose**: Get specific task details

#### PUT /api/tasks/{task_id}

**Purpose**: Update task configuration

**Request Body**:

```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "generated_prompt": "string (optional)",
  "status": "string (optional)"
}
```

#### DELETE /api/tasks/{task_id}

**Purpose**: Delete scheduled task

### 3. Scheduling API

#### POST /api/tasks/{task_id}/schedule

**Purpose**: Schedule task execution

**Request Body**:

```json
{
  "schedule_type": "once|daily|weekly|monthly|cron",
  "scheduled_at": "ISO datetime (for once)",
  "cron_expression": "string (for cron)",
  "timezone": "string (optional, default UTC)",
  "max_executions": "integer (optional)"
}
```

#### POST /api/tasks/{task_id}/execute

**Purpose**: Manually trigger task execution

#### GET /api/tasks/{task_id}/executions

**Purpose**: Get execution history for task

#### POST /api/tasks/{task_id}/pause

**Purpose**: Pause scheduled task

#### POST /api/tasks/{task_id}/resume

**Purpose**: Resume paused task

## LLM Prompt Generation System

### System Prompt for Thread Summarization

```
You are an expert at analyzing conversation threads and creating comprehensive, actionable prompts for AI agents.

Your task is to analyze a conversation thread between a user and an AI assistant, then create a single, well-structured prompt that captures:

1. The user's primary objective and goals
2. Key context and requirements mentioned
3. Specific instructions and preferences
4. Expected deliverables or outcomes

Guidelines:
- Focus on the user's messages and intentions
- Ignore AI assistant responses unless they contain user confirmations
- Create a prompt that would allow an agent to complete the task autonomously
- Include all relevant context and constraints
- Structure the prompt clearly with sections if needed
- Make it actionable and specific

Input: Array of conversation messages
Output: A single, comprehensive prompt suitable for agent execution
```

### Implementation Details

```python
async def generate_task_prompt(thread_id: str, user_id: str) -> str:
    """Generate summarized prompt from thread messages"""

    # 1. Fetch thread messages
    messages = await get_thread_messages(thread_id, user_id)

    # 2. Filter user messages
    user_messages = [msg for msg in messages if not msg.is_llm_message]

    # 3. Prepare LLM input
    conversation_context = format_messages_for_llm(user_messages)

    # 4. Call LLM with system prompt
    response = await make_llm_api_call(
        model="openai/gpt-4o",
        messages=[
            {"role": "system", "content": TASK_GENERATION_SYSTEM_PROMPT},
            {"role": "user", "content": conversation_context}
        ],
        max_tokens=2000
    )

    return response.content
```

## Background Job System

### Task Scheduler Service

```python
@dramatiq.actor
async def execute_scheduled_task(task_id: str):
    """Execute a scheduled task"""

    # 1. Fetch task details
    task = await get_scheduled_task(task_id)

    # 2. Create execution record
    execution = await create_task_execution(task_id)

    try:
        # 3. Create new thread for execution
        thread_id = await create_execution_thread(task)

        # 4. Start agent execution
        agent_run_id = await start_agent_execution(
            thread_id=thread_id,
            prompt=task.generated_prompt,
            agent_id=task.agent_id,
            task_execution_id=execution.execution_id
        )

        # 5. Update execution record
        await update_execution_status(execution.execution_id, "running", agent_run_id)

        # 6. Update task execution count and next execution time
        await update_task_execution_tracking(task_id)

    except Exception as e:
        await update_execution_status(execution.execution_id, "failed", error=str(e))
        raise
```

### Scheduler Daemon

```python
@dramatiq.actor
async def schedule_daemon():
    """Continuously check for tasks ready for execution"""

    while True:
        try:
            # Find tasks ready for execution
            ready_tasks = await get_tasks_ready_for_execution()

            for task in ready_tasks:
                # Queue task execution
                execute_scheduled_task.send(task.task_id)

            await asyncio.sleep(60)  # Check every minute

        except Exception as e:
            logger.error(f"Scheduler daemon error: {e}")
            await asyncio.sleep(300)  # Wait 5 minutes on error
```

## Integration Points

### 1. Agent Execution Integration

- Reuse existing `run_agent_background` infrastructure
- Create new threads for each task execution
- Maintain execution tracking through `agent_runs` table
- Support all existing agent configurations and MCP tools

### 2. Billing Integration

- Track task executions as billable events
- Apply existing usage limits and billing checks
- Support different execution limits per subscription tier

### 3. Authentication & Authorization

- Use existing JWT authentication
- Implement proper access controls for task management
- Ensure users can only access their own tasks

### 4. Monitoring & Logging

- Integrate with existing logging infrastructure
- Track execution metrics and performance
- Provide detailed error reporting and debugging

## Security Considerations

1. **Access Control**: Strict user isolation for tasks and executions
2. **Prompt Validation**: Sanitize and validate generated prompts
3. **Resource Limits**: Prevent excessive task creation and execution
4. **Audit Trail**: Complete logging of all task operations
5. **Data Privacy**: Secure storage of conversation data and prompts

## Performance Considerations

1. **Database Optimization**: Proper indexing for scheduling queries
2. **Background Processing**: Async execution to prevent blocking
3. **Resource Management**: Limit concurrent executions per user
4. **Cleanup**: Automatic cleanup of old execution records
5. **Caching**: Cache frequently accessed task data

## Error Handling

1. **Execution Failures**: Graceful handling with retry mechanisms
2. **Scheduling Conflicts**: Prevent overlapping executions
3. **Resource Exhaustion**: Proper error messages and fallbacks
4. **Data Consistency**: Transaction management for critical operations
5. **User Feedback**: Clear error messages and status updates

## Migration File

### File: `backend/supabase/migrations/20250620000000_scheduled_tasks.sql`

```sql
BEGIN;

-- Create scheduled_tasks table
CREATE TABLE scheduled_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    source_thread_id UUID NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(agent_id) ON DELETE SET NULL,

    -- Task Configuration
    name VARCHAR(255) NOT NULL,
    description TEXT,
    generated_prompt TEXT NOT NULL,
    original_messages JSONB NOT NULL,

    -- Scheduling Configuration
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_type VARCHAR(50),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    cron_expression VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Execution Tracking
    last_executed_at TIMESTAMP WITH TIME ZONE,
    next_execution_at TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    max_executions INTEGER,

    -- Status and Metadata
    status VARCHAR(50) DEFAULT 'draft',
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create task_executions table
CREATE TABLE task_executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES scheduled_tasks(task_id) ON DELETE CASCADE,
    agent_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
    thread_id UUID REFERENCES threads(thread_id) ON DELETE SET NULL,

    -- Execution Details
    status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    -- Execution Context
    execution_context JSONB DEFAULT '{}'::jsonb,
    results JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_scheduled_tasks_account_id ON scheduled_tasks(account_id);
CREATE INDEX idx_scheduled_tasks_source_thread_id ON scheduled_tasks(source_thread_id);
CREATE INDEX idx_scheduled_tasks_agent_id ON scheduled_tasks(agent_id);
CREATE INDEX idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX idx_scheduled_tasks_next_execution ON scheduled_tasks(next_execution_at) WHERE status = 'active';
CREATE INDEX idx_scheduled_tasks_created_at ON scheduled_tasks(created_at);

CREATE INDEX idx_task_executions_task_id ON task_executions(task_id);
CREATE INDEX idx_task_executions_status ON task_executions(status);
CREATE INDEX idx_task_executions_started_at ON task_executions(started_at);

-- Create triggers
CREATE TRIGGER update_scheduled_tasks_updated_at
    BEFORE UPDATE ON scheduled_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_executions_updated_at
    BEFORE UPDATE ON task_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```
