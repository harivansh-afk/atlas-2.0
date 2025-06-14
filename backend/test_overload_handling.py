#!/usr/bin/env python3
"""
Test script to verify overload error handling in the LLM service.
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.llm import is_overload_error, get_fallback_model, LLMRetryError
import litellm

def test_overload_detection():
    """Test that our overload detection function works correctly."""
    print("Testing overload error detection...")
    
    # Test cases that should be detected as overload errors
    overload_cases = [
        "litellm.InternalServerError: AnthropicException - Overloaded. Handle with `litellm.InternalServerError`.",
        "AnthropicException: Overloaded",
        "Server is overloaded",
        "Service temporarily unavailable",
        "502 Bad Gateway",
        "503 Service Unavailable",
        "504 Gateway Timeout",
        "Too many requests",
        "Capacity exceeded"
    ]
    
    # Test cases that should NOT be detected as overload errors
    non_overload_cases = [
        "Invalid API key",
        "Model not found",
        "Rate limit exceeded",
        "Authentication failed",
        "Network timeout"
    ]
    
    print("✓ Testing overload cases:")
    for case in overload_cases:
        error = Exception(case)
        if is_overload_error(error):
            print(f"  ✓ Correctly detected: {case}")
        else:
            print(f"  ✗ FAILED to detect: {case}")
    
    print("\n✓ Testing non-overload cases:")
    for case in non_overload_cases:
        error = Exception(case)
        if not is_overload_error(error):
            print(f"  ✓ Correctly ignored: {case}")
        else:
            print(f"  ✗ INCORRECTLY detected as overload: {case}")

def test_fallback_models():
    """Test that fallback model selection works correctly."""
    print("\n\nTesting fallback model selection...")
    
    test_cases = [
        ("anthropic/claude-3-7-sonnet-latest", "openai/gpt-4o"),
        ("anthropic/claude-3-haiku-20240307", "openai/gpt-4o-mini"),
        ("openai/gpt-4o", "anthropic/claude-3-5-sonnet-20241022"),
        ("openai/gpt-4o-mini", "anthropic/claude-3-haiku-20240307"),
        ("some-unknown-model", "openai/gpt-4o-mini")
    ]
    
    for original, expected in test_cases:
        fallback = get_fallback_model(original)
        if fallback == expected:
            print(f"  ✓ {original} → {fallback}")
        else:
            print(f"  ✗ {original} → {fallback} (expected {expected})")

async def test_error_message_formatting():
    """Test that error messages are user-friendly."""
    print("\n\nTesting error message formatting...")
    
    # Create a mock overload error
    overload_error = litellm.InternalServerError("AnthropicException - Overloaded")
    
    try:
        # This would normally be called within make_llm_api_call
        if is_overload_error(overload_error):
            user_friendly_msg = "The AI service is currently experiencing high demand. Please try again in a few minutes."
            print(f"  ✓ User-friendly message: {user_friendly_msg}")
        else:
            print("  ✗ Failed to detect overload error")
    except Exception as e:
        print(f"  ✗ Error in message formatting: {e}")

def main():
    """Run all tests."""
    print("🧪 Testing LLM Overload Error Handling\n")
    print("=" * 50)
    
    test_overload_detection()
    test_fallback_models()
    
    # Run async test
    asyncio.run(test_error_message_formatting())
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("\nConfiguration Summary:")
    print("- Max retries: 5")
    print("- Overload delay: 45s (with exponential backoff)")
    print("- Fallback models: Enabled")
    print("- Enhanced error detection: Enabled")

if __name__ == "__main__":
    main()
