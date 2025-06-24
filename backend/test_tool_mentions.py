#!/usr/bin/env python3
"""
Test script to verify tool mention processing in the backend.
This script tests the complete flow from parsing tool mentions to fetching tool information.
"""

import asyncio
import json
import os
import sys
from typing import Dict, Any

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.tool_mention_processor import ToolMentionProcessor, ParsedToolMention
from services.tool_information_fetcher import ToolInformationFetcher
from utils.logger import logger


async def test_tool_mention_parsing():
    """Test the basic tool mention parsing functionality."""
    print("\n" + "="*60)
    print("🧪 TESTING TOOL MENTION PARSING")
    print("="*60)
    
    processor = ToolMentionProcessor()
    
    # Test cases with different mention formats
    test_messages = [
        "Can you help me send an email using @[Gmail](available_composio_gmail)?",
        "Please use @[Slack](available_composio_slack) and @[Notion](available_composio_notion) to organize this.",
        "Use @[Custom Tool](custom_mcp_my_tool) for this task.",
        "No mentions in this message.",
        "Multiple @[Gmail](available_composio_gmail) mentions @[Gmail](available_composio_gmail) in one message.",
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n📝 Test Case {i}: {message}")
        
        # Check if mentions are detected
        has_mentions = processor.has_tool_mentions(message)
        print(f"   Has mentions: {has_mentions}")
        
        if has_mentions:
            # Parse the mentions
            mentions = processor.parse_tool_mentions(message)
            print(f"   Found {len(mentions)} mentions:")
            
            for mention in mentions:
                print(f"     - ID: {mention.id}")
                print(f"       Display: {mention.display}")
                print(f"       Type: {mention.type}")
                print(f"       Original: {mention.original_text}")
        else:
            print("   No mentions found.")


async def test_tool_information_fetching():
    """Test the tool information fetching functionality."""
    print("\n" + "="*60)
    print("🔧 TESTING TOOL INFORMATION FETCHING")
    print("="*60)
    
    processor = ToolMentionProcessor()
    fetcher = ToolInformationFetcher()
    
    # Test message with Composio tool mentions
    test_message = "Please use @[Gmail](available_composio_gmail) to send an email."
    
    print(f"📝 Test Message: {test_message}")
    
    # Parse mentions
    mentions = processor.parse_tool_mentions(test_message)
    print(f"   Parsed {len(mentions)} mentions")
    
    if mentions:
        # Test with a dummy user ID (in real scenario this would be from auth)
        test_user_id = "test-user-123"
        
        try:
            print(f"   Fetching tool information for user: {test_user_id}")
            
            # Fetch tool information
            tool_info_list = await fetcher.fetch_tool_information(mentions, test_user_id)
            
            print(f"   ✅ Fetched information for {len(tool_info_list)} tools:")
            
            for tool_info in tool_info_list:
                print(f"     - Name: {tool_info.name}")
                print(f"       Description: {tool_info.description[:100]}...")
                print(f"       App Key: {tool_info.app_key}")
                print(f"       Error: {tool_info.error}")
                
        except Exception as e:
            print(f"   ❌ Error fetching tool information: {str(e)}")
            logger.error(f"Tool information fetching failed: {str(e)}")


async def test_prompt_enhancement():
    """Test the complete prompt enhancement flow."""
    print("\n" + "="*60)
    print("📝 TESTING PROMPT ENHANCEMENT")
    print("="*60)
    
    processor = ToolMentionProcessor()
    fetcher = ToolInformationFetcher()
    
    # Test message with multiple tool mentions
    test_message = "Use @[Gmail](available_composio_gmail) to send emails and @[Slack](available_composio_slack) for notifications."
    
    print(f"📝 Test Message: {test_message}")
    
    # Parse mentions
    mentions = processor.parse_tool_mentions(test_message)
    print(f"   Parsed {len(mentions)} mentions")
    
    if mentions:
        test_user_id = "test-user-123"
        
        try:
            # Get the formatted prompt enhancement
            tool_context = await fetcher.get_tool_schemas_for_prompt(mentions, test_user_id)
            
            if tool_context:
                print(f"   ✅ Generated tool context prompt:")
                print("   " + "-"*50)
                # Print the context with proper indentation
                for line in tool_context.split('\n'):
                    print(f"   {line}")
                print("   " + "-"*50)
            else:
                print(f"   ⚠️ No tool context generated")
                
        except Exception as e:
            print(f"   ❌ Error generating tool context: {str(e)}")
            logger.error(f"Tool context generation failed: {str(e)}")


async def test_backend_integration():
    """Test integration with backend message processing."""
    print("\n" + "="*60)
    print("🔗 TESTING BACKEND INTEGRATION")
    print("="*60)
    
    # Simulate the backend message processing flow
    test_message_data = {
        "content": "Please use @[Gmail](available_composio_gmail) to send an important email."
    }
    
    print(f"📝 Simulating backend message processing...")
    print(f"   Message content: {test_message_data['content']}")
    
    # This simulates the flow in run.py
    processor = ToolMentionProcessor()
    user_message_content = test_message_data.get("content", "")
    
    if processor.has_tool_mentions(user_message_content):
        print(f"   🔧 Tool mentions detected, processing...")
        
        # Parse tool mentions
        mentions = processor.parse_tool_mentions(user_message_content)
        print(f"   Found {len(mentions)} tool mentions: {[m.display for m in mentions]}")
        
        # Fetch tool information
        fetcher = ToolInformationFetcher()
        test_user_id = "test-user-123"
        
        try:
            tool_mention_context = await fetcher.get_tool_schemas_for_prompt(mentions, test_user_id)
            
            if tool_mention_context:
                print(f"   ✅ Successfully fetched tool information")
                print(f"   📝 Enhanced system prompt would include:")
                print("   " + "-"*40)
                # Show first few lines of the context
                lines = tool_mention_context.split('\n')[:10]
                for line in lines:
                    print(f"   {line}")
                if len(tool_mention_context.split('\n')) > 10:
                    print(f"   ... and {len(tool_mention_context.split('\n')) - 10} more lines")
                print("   " + "-"*40)
            else:
                print(f"   ⚠️ No tool information could be fetched")
                
        except Exception as e:
            print(f"   ❌ Error in backend integration test: {str(e)}")
            logger.error(f"Backend integration test failed: {str(e)}")
    else:
        print(f"   ℹ️ No tool mentions detected in message")


async def main():
    """Run all tests."""
    print("🚀 STARTING TOOL MENTION PROCESSING TESTS")
    print("="*60)
    
    try:
        # Run all test functions
        await test_tool_mention_parsing()
        await test_tool_information_fetching()
        await test_prompt_enhancement()
        await test_backend_integration()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ TEST SUITE FAILED: {str(e)}")
        logger.error(f"Test suite failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())
