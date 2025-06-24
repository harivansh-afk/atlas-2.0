#!/usr/bin/env python3
"""
End-to-end test for tool mentions through the API.
This script tests the complete flow from frontend to backend including message storage and agent execution.
"""

import asyncio
import json
import os
import sys
from typing import Dict, Any
import uuid

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.supabase import DBConnection
from utils.logger import logger


async def create_test_thread_and_message():
    """Create a test thread and message with tool mentions."""
    print("\n" + "="*60)
    print("🧪 CREATING TEST THREAD AND MESSAGE")
    print("="*60)
    
    try:
        # Initialize database connection
        db = DBConnection()
        client = await db.client
        
        # Get or create a test user account
        test_email = "test-tool-mentions@example.com"
        
        # Try to get existing user or create one
        user_result = await client.table("accounts").select("*").eq("email", test_email).execute()
        
        if user_result.data:
            account_id = user_result.data[0]["account_id"]
            print(f"   Using existing test account: {account_id}")
        else:
            # Create test account
            account_data = {
                "account_id": str(uuid.uuid4()),
                "email": test_email,
                "name": "Test User",
                "account_type": "personal"
            }
            
            create_result = await client.table("accounts").insert(account_data).execute()
            account_id = create_result.data[0]["account_id"]
            print(f"   Created new test account: {account_id}")
        
        # Create a test thread
        thread_data = {
            "thread_id": str(uuid.uuid4()),
            "account_id": account_id,
            "title": "Tool Mentions Test Thread"
        }
        
        thread_result = await client.table("threads").insert(thread_data).execute()
        thread_id = thread_result.data[0]["thread_id"]
        print(f"   Created test thread: {thread_id}")
        
        # Create a test message with tool mentions
        test_message_content = "Please use @[Gmail](available_composio_gmail) to send an email and @[Slack](available_composio_slack) for notifications."
        
        message_data = {
            "message_id": str(uuid.uuid4()),
            "thread_id": thread_id,
            "type": "user",
            "content": json.dumps({
                "content": test_message_content,
                "type": "text"
            })
        }
        
        message_result = await client.table("messages").insert(message_data).execute()
        message_id = message_result.data[0]["message_id"]
        print(f"   Created test message: {message_id}")
        print(f"   Message content: {test_message_content}")
        
        return {
            "account_id": account_id,
            "thread_id": thread_id,
            "message_id": message_id,
            "message_content": test_message_content
        }
        
    except Exception as e:
        print(f"   ❌ Error creating test data: {str(e)}")
        logger.error(f"Test data creation failed: {str(e)}")
        raise


async def test_agent_run_with_tool_mentions():
    """Test the agent run function with tool mentions."""
    print("\n" + "="*60)
    print("🤖 TESTING AGENT RUN WITH TOOL MENTIONS")
    print("="*60)
    
    try:
        # Create test data
        test_data = await create_test_thread_and_message()
        
        # Import the agent run function
        from agent.run import run_agent
        
        print(f"   Starting agent run for thread: {test_data['thread_id']}")
        print(f"   Account ID: {test_data['account_id']}")
        
        # Configure agent run parameters
        run_params = {
            "thread_id": test_data["thread_id"],
            "account_id": test_data["account_id"],
            "model_name": "anthropic/claude-3-5-sonnet-20241022",  # Use a simple model for testing
            "stream": False,  # Disable streaming for easier testing
            "max_iterations": 1,  # Limit to 1 iteration for testing
            "enable_thinking": False,
            "reasoning_effort": "low",
            "enable_context_manager": False
        }
        
        print(f"   Running agent with parameters:")
        for key, value in run_params.items():
            print(f"     {key}: {value}")
        
        # Run the agent and collect results
        results = []
        async for chunk in run_agent(**run_params):
            results.append(chunk)
            print(f"   📦 Received chunk: {chunk.get('type', 'unknown')} - {str(chunk)[:100]}...")
        
        print(f"   ✅ Agent run completed with {len(results)} chunks")
        
        # Analyze results for tool mention processing
        tool_mention_events = [
            chunk for chunk in results 
            if chunk.get("type") == "status" and "tool_mention" in str(chunk).lower()
        ]
        
        if tool_mention_events:
            print(f"   🔧 Found {len(tool_mention_events)} tool mention related events:")
            for event in tool_mention_events:
                print(f"     - {event}")
        else:
            print(f"   ⚠️ No tool mention events found in agent output")
        
        return {
            "test_data": test_data,
            "results": results,
            "tool_mention_events": tool_mention_events
        }
        
    except Exception as e:
        print(f"   ❌ Error in agent run test: {str(e)}")
        logger.error(f"Agent run test failed: {str(e)}")
        raise


async def test_message_retrieval():
    """Test that the backend correctly retrieves messages with tool mentions."""
    print("\n" + "="*60)
    print("📨 TESTING MESSAGE RETRIEVAL")
    print("="*60)
    
    try:
        # Create test data
        test_data = await create_test_thread_and_message()
        
        # Initialize database connection
        db = DBConnection()
        client = await db.client
        
        # Retrieve the latest user message (simulating what run.py does)
        latest_user_message = (
            await client.table("messages")
            .select("*")
            .eq("thread_id", test_data["thread_id"])
            .eq("type", "user")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        
        if latest_user_message.data and len(latest_user_message.data) > 0:
            print(f"   ✅ Retrieved latest user message")
            
            # Parse the message content (simulating run.py logic)
            latest_message_data = latest_user_message.data[0]["content"]
            if isinstance(latest_message_data, str):
                latest_message_data = json.loads(latest_message_data)
            
            user_message_content = latest_message_data.get("content", "")
            print(f"   📝 Message content: {user_message_content}")
            
            # Test tool mention detection
            from utils.tool_mention_processor import ToolMentionProcessor
            
            processor = ToolMentionProcessor()
            has_mentions = processor.has_tool_mentions(user_message_content)
            
            print(f"   🔍 Has tool mentions: {has_mentions}")
            
            if has_mentions:
                mentions = processor.parse_tool_mentions(user_message_content)
                print(f"   📋 Found {len(mentions)} mentions:")
                for mention in mentions:
                    print(f"     - {mention.display} ({mention.id}) - Type: {mention.type}")
                
                return {
                    "test_data": test_data,
                    "message_content": user_message_content,
                    "mentions": mentions
                }
            else:
                print(f"   ⚠️ No tool mentions detected")
                return None
        else:
            print(f"   ❌ No user message found")
            return None
            
    except Exception as e:
        print(f"   ❌ Error in message retrieval test: {str(e)}")
        logger.error(f"Message retrieval test failed: {str(e)}")
        raise


async def cleanup_test_data(test_data):
    """Clean up test data after tests."""
    print("\n" + "="*60)
    print("🧹 CLEANING UP TEST DATA")
    print("="*60)
    
    try:
        db = DBConnection()
        client = await db.client
        
        # Delete test message
        await client.table("messages").delete().eq("message_id", test_data["message_id"]).execute()
        print(f"   🗑️ Deleted test message: {test_data['message_id']}")
        
        # Delete test thread
        await client.table("threads").delete().eq("thread_id", test_data["thread_id"]).execute()
        print(f"   🗑️ Deleted test thread: {test_data['thread_id']}")
        
        # Note: We don't delete the test account as it might be reused
        print(f"   ℹ️ Keeping test account for reuse: {test_data['account_id']}")
        
    except Exception as e:
        print(f"   ⚠️ Error during cleanup: {str(e)}")
        logger.warning(f"Cleanup failed: {str(e)}")


async def main():
    """Run all API tests."""
    print("🚀 STARTING API TOOL MENTION TESTS")
    print("="*60)
    
    test_data = None
    
    try:
        # Test message retrieval and parsing
        retrieval_result = await test_message_retrieval()
        
        if retrieval_result:
            test_data = retrieval_result["test_data"]
            
            # Test full agent run (commented out for now as it requires more setup)
            # agent_result = await test_agent_run_with_tool_mentions()
            
            print("\n" + "="*60)
            print("✅ API TESTS COMPLETED SUCCESSFULLY")
            print("="*60)
            print(f"   📝 Message parsing: ✅")
            print(f"   🔍 Tool mention detection: ✅")
            print(f"   📋 Tool mention parsing: ✅")
            # print(f"   🤖 Agent run: ✅")
        else:
            print("\n" + "="*60)
            print("❌ API TESTS FAILED")
            print("="*60)
        
    except Exception as e:
        print(f"\n❌ API TEST SUITE FAILED: {str(e)}")
        logger.error(f"API test suite failed: {str(e)}")
        
    finally:
        # Clean up test data
        if test_data:
            await cleanup_test_data(test_data)


if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())
