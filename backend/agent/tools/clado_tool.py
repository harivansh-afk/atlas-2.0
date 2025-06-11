import os
import json
import asyncio
import httpx
from typing import Optional, List, Dict, Any, Union
from agentpress.tool import Tool, ToolResult, openapi_schema, xml_schema
from utils.logger import logger
from utils.config import config


class CladoTool(Tool):
    """
    Clado API Tool for comprehensive LinkedIn data search and enrichment.

    Provides Atlas with access to all Clado API endpoints including:
    - Natural language search for users and companies
    - Profile enrichment and contact information retrieval
    - Deep research with async job processing
    - LinkedIn post analysis and engagement data

    This tool enables Atlas to perform sophisticated LinkedIn research
    using natural language queries with AI-powered criteria matching.
    """

    def __init__(self):
        super().__init__()

        # Configuration
        self.base_url = "https://search.linkd.inc"
        self.api_key = config.CLADO_API_KEY or os.getenv("CLADO_API_KEY")
        self.timeout = 120
        self.max_retries = 3

        if not self.api_key:
            logger.warning(
                "CLADO_API_KEY not found in configuration. Clado tool will not be functional."
            )
            raise ValueError(
                "CLADO_API_KEY environment variable is required for Clado integration"
            )

        logger.info("Initialized CladoTool with Clado API integration")

    def _get_headers(self) -> Dict[str, str]:
        """Get standard headers for Clado API requests."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make an HTTP request to the Clado API with retry logic.

        Args:
            method: HTTP method (GET, POST)
            endpoint: API endpoint path
            params: Query parameters for GET requests
            json_data: JSON payload for POST requests

        Returns:
            API response as dictionary

        Raises:
            Exception: If request fails after all retries
        """
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()

        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    if method.upper() == "GET":
                        response = await client.get(url, headers=headers, params=params)
                    elif method.upper() == "POST":
                        response = await client.post(
                            url, headers=headers, json=json_data
                        )
                    else:
                        raise ValueError(f"Unsupported HTTP method: {method}")

                    response.raise_for_status()
                    return response.json()

            except httpx.TimeoutException:
                logger.warning(
                    f"Request timeout on attempt {attempt + 1}/{self.max_retries}"
                )
                if attempt == self.max_retries - 1:
                    raise Exception(
                        f"Request timed out after {self.max_retries} attempts"
                    )
                await asyncio.sleep(2**attempt)  # Exponential backoff

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    raise Exception("Invalid or expired Clado API key")
                elif e.response.status_code == 402:
                    raise Exception("Insufficient Clado API credits")
                elif e.response.status_code == 422:
                    raise Exception(f"Validation error: {e.response.text}")
                elif e.response.status_code >= 500:
                    logger.warning(
                        f"Server error on attempt {attempt + 1}/{self.max_retries}: {e.response.status_code}"
                    )
                    if attempt == self.max_retries - 1:
                        raise Exception(f"Server error: {e.response.status_code}")
                    await asyncio.sleep(2**attempt)
                else:
                    raise Exception(
                        f"HTTP error {e.response.status_code}: {e.response.text}"
                    )

            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise Exception(f"Request failed: {str(e)}")
                await asyncio.sleep(2**attempt)

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "search_linkedin_users",
                "description": "Search through millions of LinkedIn profiles using natural language queries with AI-powered criteria matching. Perfect for finding people based on job titles, companies, skills, education, or any combination of professional criteria. Use this when you need to find specific types of professionals or people with particular backgrounds.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Natural language search query describing the people you're looking for. Examples: 'software engineers at FAANG companies', 'product managers with MBA', 'founders in fintech', 'data scientists with PhD', 'marketing directors in healthcare'",
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of results to return (default: 30, max: 100)",
                            "default": 30,
                            "minimum": 1,
                            "maximum": 100,
                        },
                        "school": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Filter by school names (e.g., ['Stanford University', 'Harvard University'])",
                        },
                        "company": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Filter by company names - searches both current and past employers (e.g., ['Google', 'Facebook', 'Apple'])",
                        },
                        "acceptance_threshold": {
                            "type": "integer",
                            "description": "Match score threshold 0-100 (default: 73). Higher values return fewer but more relevant results",
                            "default": 73,
                            "minimum": 0,
                            "maximum": 100,
                        },
                    },
                    "required": ["query"],
                },
            },
        }
    )
    @xml_schema(
        tag_name="search-linkedin-users",
        mappings=[
            {"param_name": "query", "node_type": "attribute", "path": "."},
            {"param_name": "limit", "node_type": "attribute", "path": "."},
            {
                "param_name": "school",
                "node_type": "attribute",
                "path": ".",
                "is_list": True,
            },
            {
                "param_name": "company",
                "node_type": "attribute",
                "path": ".",
                "is_list": True,
            },
            {
                "param_name": "acceptance_threshold",
                "node_type": "attribute",
                "path": ".",
            },
        ],
        example="""
        <!-- Search for software engineers at major tech companies -->
        <function_calls>
        <invoke name="search_linkedin_users">
        <parameter name="query">software engineers at FAANG companies</parameter>
        <parameter name="limit">20</parameter>
        <parameter name="acceptance_threshold">80</parameter>
        </invoke>
        </function_calls>

        <!-- Search for product managers with specific education -->
        <function_calls>
        <invoke name="search_linkedin_users">
        <parameter name="query">product managers with MBA</parameter>
        <parameter name="school">["Stanford University", "Harvard Business School"]</parameter>
        <parameter name="company">["Google", "Meta", "Apple"]</parameter>
        <parameter name="limit">15</parameter>
        </invoke>
        </function_calls>
        """,
    )
    async def search_linkedin_users(
        self,
        query: str,
        limit: int = 30,
        school: Optional[List[str]] = None,
        company: Optional[List[str]] = None,
        acceptance_threshold: int = 73,
    ) -> ToolResult:
        """
        Search LinkedIn profiles using natural language queries.

        This endpoint uses AI-powered criteria matching to find relevant profiles
        based on your natural language description. Each result costs 1 credit.
        """
        try:
            # Validate parameters
            if not query or not isinstance(query, str):
                return self.fail_response("A valid search query is required")

            if limit < 1 or limit > 100:
                limit = min(max(limit, 1), 100)

            if acceptance_threshold < 0 or acceptance_threshold > 100:
                acceptance_threshold = max(min(acceptance_threshold, 100), 0)

            # Build parameters
            params = {
                "query": query,
                "limit": limit,
                "acceptance_threshold": acceptance_threshold,
            }

            # Add optional filters
            if school:
                params["school"] = school
            if company:
                params["company"] = company

            logger.info(
                f"Searching LinkedIn users with query: '{query}', limit: {limit}"
            )

            # Make API request
            response = await self._make_request(
                "GET", "/api/search/users", params=params
            )

            # Format response
            results = response.get("results", [])
            total = response.get("total", 0)

            logger.info(f"Found {len(results)} LinkedIn profiles for query: '{query}'")

            return self.success_response(
                {
                    "query": query,
                    "total_results": total,
                    "results_returned": len(results),
                    "results": results,
                    "cost": f"{len(results)} credits used",
                }
            )

        except Exception as e:
            logger.error(f"Error searching LinkedIn users: {str(e)}")
            return self.fail_response(f"Failed to search LinkedIn users: {str(e)}")

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "search_linkedin_companies",
                "description": "Search for companies using natural language queries with AI-powered criteria matching. Perfect for finding companies based on industry, size, location, technology focus, or business model. Use this when you need to research companies, find potential clients, or analyze market segments.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Natural language search query describing the companies you're looking for. Examples: 'AI startups in healthcare', 'fintech companies with Series A funding', 'manufacturing companies in automotive', 'SaaS companies in California', 'biotech companies with recent funding'",
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of results to return (default: 30, max: 100)",
                            "default": 30,
                            "minimum": 1,
                            "maximum": 100,
                        },
                        "acceptance_threshold": {
                            "type": "integer",
                            "description": "Match score threshold 0-100 (default: 73). Higher values return fewer but more relevant results",
                            "default": 73,
                            "minimum": 0,
                            "maximum": 100,
                        },
                    },
                    "required": ["query"],
                },
            },
        }
    )
    @xml_schema(
        tag_name="search-linkedin-companies",
        mappings=[
            {"param_name": "query", "node_type": "attribute", "path": "."},
            {"param_name": "limit", "node_type": "attribute", "path": "."},
            {
                "param_name": "acceptance_threshold",
                "node_type": "attribute",
                "path": ".",
            },
        ],
        example="""
        <!-- Search for AI startups in healthcare -->
        <function_calls>
        <invoke name="search_linkedin_companies">
        <parameter name="query">AI startups in healthcare</parameter>
        <parameter name="limit">20</parameter>
        <parameter name="acceptance_threshold">80</parameter>
        </invoke>
        </function_calls>

        <!-- Search for fintech companies -->
        <function_calls>
        <invoke name="search_linkedin_companies">
        <parameter name="query">fintech companies with Series A funding</parameter>
        <parameter name="limit">15</parameter>
        </invoke>
        </function_calls>
        """,
    )
    async def search_linkedin_companies(
        self, query: str, limit: int = 30, acceptance_threshold: int = 73
    ) -> ToolResult:
        """
        Search for companies using natural language queries.

        This endpoint uses AI-powered criteria matching to find relevant companies
        based on your natural language description. Each result costs 1 credit.
        """
        try:
            # Validate parameters
            if not query or not isinstance(query, str):
                return self.fail_response("A valid search query is required")

            if limit < 1 or limit > 100:
                limit = min(max(limit, 1), 100)

            if acceptance_threshold < 0 or acceptance_threshold > 100:
                acceptance_threshold = max(min(acceptance_threshold, 100), 0)

            # Build parameters
            params = {
                "query": query,
                "limit": limit,
                "acceptance_threshold": acceptance_threshold,
            }

            logger.info(
                f"Searching LinkedIn companies with query: '{query}', limit: {limit}"
            )

            # Make API request
            response = await self._make_request(
                "GET", "/api/search/companies", params=params
            )

            # Format response
            results = response.get("results", [])
            total = response.get("total", 0)

            logger.info(f"Found {len(results)} LinkedIn companies for query: '{query}'")

            return self.success_response(
                {
                    "query": query,
                    "total_results": total,
                    "results_returned": len(results),
                    "results": results,
                    "cost": f"{len(results)} credits used",
                }
            )

        except Exception as e:
            logger.error(f"Error searching LinkedIn companies: {str(e)}")
            return self.fail_response(f"Failed to search LinkedIn companies: {str(e)}")

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "enrich_linkedin_profile",
                "description": "Retrieve detailed profile information using LinkedIn URL, email address, or phone number. Perfect for getting comprehensive profile data including work experience, education, skills, and personal information. Use this when you have a specific person's identifier and need their complete professional background.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "LinkedIn profile URL to look up (e.g., 'https://www.linkedin.com/in/johndoe')",
                        },
                        "email": {
                            "type": "string",
                            "description": "Email address to search for (e.g., 'john.doe@company.com')",
                        },
                        "phone": {
                            "type": "string",
                            "description": "Phone number to search for (e.g., '+1-555-123-4567')",
                        },
                    },
                    "required": [],
                },
            },
        }
    )
    @xml_schema(
        tag_name="enrich-linkedin-profile",
        mappings=[
            {"param_name": "url", "node_type": "attribute", "path": "."},
            {"param_name": "email", "node_type": "attribute", "path": "."},
            {"param_name": "phone", "node_type": "attribute", "path": "."},
        ],
        example="""
        <!-- Enrich profile by LinkedIn URL -->
        <function_calls>
        <invoke name="enrich_linkedin_profile">
        <parameter name="url">https://www.linkedin.com/in/johndoe</parameter>
        </invoke>
        </function_calls>

        <!-- Enrich profile by email -->
        <function_calls>
        <invoke name="enrich_linkedin_profile">
        <parameter name="email">john.doe@company.com</parameter>
        </invoke>
        </function_calls>

        <!-- Enrich profile by phone -->
        <function_calls>
        <invoke name="enrich_linkedin_profile">
        <parameter name="phone">+1-555-123-4567</parameter>
        </invoke>
        </function_calls>
        """,
    )
    async def enrich_linkedin_profile(
        self,
        url: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> ToolResult:
        """
        Retrieve detailed profile information using LinkedIn URL, email, or phone.

        Exactly one of url, email, or phone must be provided.
        Each request costs 1 credit.
        """
        try:
            # Validate that exactly one parameter is provided
            provided_params = [p for p in [url, email, phone] if p]
            if len(provided_params) != 1:
                return self.fail_response(
                    "Exactly one of 'url', 'email', or 'phone' must be provided"
                )

            # Build parameters
            params = {}
            if url:
                params["url"] = url
                logger.info(f"Enriching LinkedIn profile by URL: {url}")
            elif email:
                params["email"] = email
                logger.info(f"Enriching LinkedIn profile by email: {email}")
            elif phone:
                params["phone"] = phone
                logger.info(f"Enriching LinkedIn profile by phone: {phone}")

            # Make API request
            response = await self._make_request(
                "GET", "/api/enrich/linkedin", params=params
            )

            # Format response
            data = response.get("data", [])

            if not data:
                return self.fail_response(
                    "No profile data found for the provided identifier"
                )

            profile_data = data[0] if isinstance(data, list) else data

            # Check if it's an error response
            if isinstance(profile_data, dict) and profile_data.get("message"):
                return self.fail_response(
                    f"Profile not found: {profile_data['message']}"
                )

            logger.info(f"Successfully enriched LinkedIn profile")

            return self.success_response(
                {"profile_data": profile_data, "cost": "1 credit used"}
            )

        except Exception as e:
            logger.error(f"Error enriching LinkedIn profile: {str(e)}")
            return self.fail_response(f"Failed to enrich LinkedIn profile: {str(e)}")

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "get_linkedin_contacts",
                "description": "Get email addresses and phone numbers for LinkedIn profiles using URL, email, or phone lookup. Perfect for finding contact information when you need to reach out to someone. Returns contact details with confidence ratings and social media links.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "linkedin_url": {
                            "type": "string",
                            "description": "LinkedIn profile URL to look up (e.g., 'https://www.linkedin.com/in/johndoe')",
                        },
                        "email": {
                            "type": "string",
                            "description": "Email address to search for (e.g., 'john.doe@company.com')",
                        },
                        "phone": {
                            "type": "string",
                            "description": "Phone number to search for (e.g., '+1-555-123-4567')",
                        },
                    },
                    "required": [],
                },
            },
        }
    )
    @xml_schema(
        tag_name="get-linkedin-contacts",
        mappings=[
            {"param_name": "linkedin_url", "node_type": "attribute", "path": "."},
            {"param_name": "email", "node_type": "attribute", "path": "."},
            {"param_name": "phone", "node_type": "attribute", "path": "."},
        ],
        example="""
        <!-- Get contacts by LinkedIn URL -->
        <function_calls>
        <invoke name="get_linkedin_contacts">
        <parameter name="linkedin_url">https://www.linkedin.com/in/johndoe</parameter>
        </invoke>
        </function_calls>

        <!-- Get contacts by email -->
        <function_calls>
        <invoke name="get_linkedin_contacts">
        <parameter name="email">john.doe@company.com</parameter>
        </invoke>
        </function_calls>
        """,
    )
    async def get_linkedin_contacts(
        self,
        linkedin_url: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> ToolResult:
        """
        Get email addresses and phone numbers for LinkedIn profiles.

        Exactly one of linkedin_url, email, or phone must be provided.
        Each request costs 1 credit.
        """
        try:
            # Validate that exactly one parameter is provided
            provided_params = [p for p in [linkedin_url, email, phone] if p]
            if len(provided_params) != 1:
                return self.fail_response(
                    "Exactly one of 'linkedin_url', 'email', or 'phone' must be provided"
                )

            # Build parameters
            params = {}
            if linkedin_url:
                params["linkedin_url"] = linkedin_url
                logger.info(f"Getting contacts for LinkedIn URL: {linkedin_url}")
            elif email:
                params["email"] = email
                logger.info(f"Getting contacts for email: {email}")
            elif phone:
                params["phone"] = phone
                logger.info(f"Getting contacts for phone: {phone}")

            # Make API request
            response = await self._make_request(
                "GET", "/api/enrich/contacts", params=params
            )

            # Format response
            data = response.get("data", [])

            if not data:
                return self.fail_response(
                    "No contact data found for the provided identifier"
                )

            contact_data = data[0] if isinstance(data, list) else data

            # Check if it's an error response
            if isinstance(contact_data, dict) and contact_data.get("error"):
                return self.fail_response(
                    f"Contact lookup failed: {contact_data.get('message', 'Unknown error')}"
                )

            # Extract contact information
            contacts = contact_data.get("contacts", [])
            social = contact_data.get("social", [])

            logger.info(
                f"Successfully retrieved {len(contacts)} contacts and {len(social)} social links"
            )

            return self.success_response(
                {
                    "contacts": contacts,
                    "social_media": social,
                    "total_contacts": len(contacts),
                    "total_social_links": len(social),
                    "cost": "1 credit used",
                }
            )

        except Exception as e:
            logger.error(f"Error getting LinkedIn contacts: {str(e)}")
            return self.fail_response(f"Failed to get LinkedIn contacts: {str(e)}")

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "scrape_linkedin_profile",
                "description": "Extract detailed profile data and posts with comments from LinkedIn profiles using real-time scraping. Perfect for getting the most up-to-date profile information including recent posts, comments, and engagement data. This provides live data directly from LinkedIn.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "linkedin_url": {
                            "type": "string",
                            "description": "LinkedIn profile URL to scrape (e.g., 'https://www.linkedin.com/in/johndoe')",
                        }
                    },
                    "required": ["linkedin_url"],
                },
            },
        }
    )
    @xml_schema(
        tag_name="scrape-linkedin-profile",
        mappings=[
            {"param_name": "linkedin_url", "node_type": "attribute", "path": "."}
        ],
        example="""
        <!-- Scrape complete LinkedIn profile with posts -->
        <function_calls>
        <invoke name="scrape_linkedin_profile">
        <parameter name="linkedin_url">https://www.linkedin.com/in/johndoe</parameter>
        </invoke>
        </function_calls>
        """,
    )
    async def scrape_linkedin_profile(self, linkedin_url: str) -> ToolResult:
        """
        Extract comprehensive profile data including posts, comments, and engagement metrics.

        This endpoint uses real-time scraping to fetch the most current data.
        Each request costs 2 credits.
        """
        try:
            # Validate parameters
            if not linkedin_url or not isinstance(linkedin_url, str):
                return self.fail_response("A valid LinkedIn URL is required")

            # Build parameters
            params = {"linkedin_url": linkedin_url}

            logger.info(f"Scraping LinkedIn profile: {linkedin_url}")

            # Make API request
            response = await self._make_request(
                "GET", "/api/enrich/scrape", params=params
            )

            # Format response
            data = response.get("data", {})

            if not data:
                return self.fail_response("No profile data found for the provided URL")

            # Extract key information
            name = data.get("name", "")
            headline = data.get("headline", "")
            location = data.get("location", "")
            connection_count = data.get("connection_count", 0)
            posts = data.get("posts", [])

            logger.info(
                f"Successfully scraped profile for {name} with {len(posts)} posts"
            )

            return self.success_response(
                {
                    "profile_data": data,
                    "summary": {
                        "name": name,
                        "headline": headline,
                        "location": location,
                        "connection_count": connection_count,
                        "total_posts": len(posts),
                    },
                    "cost": "2 credits used",
                }
            )

        except Exception as e:
            logger.error(f"Error scraping LinkedIn profile: {str(e)}")
            return self.fail_response(f"Failed to scrape LinkedIn profile: {str(e)}")

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "get_linkedin_post_reactions",
                "description": "Retrieve reactions (likes, comments, shares) for a specific LinkedIn post. Perfect for analyzing engagement, understanding who interacted with content, and gathering insights about post performance. Returns detailed information about who reacted and what type of reactions they gave.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "LinkedIn post URL to analyze (e.g., 'https://www.linkedin.com/posts/username_activity-123456789-abcd')",
                        },
                        "page": {
                            "type": "integer",
                            "description": "Page number for pagination (default: 1)",
                            "default": 1,
                            "minimum": 1,
                        },
                        "reaction_type": {
                            "type": "string",
                            "description": "Type of reaction to filter by. Leave empty for all reactions. Options: LIKE, LOVE, CELEBRATE, SUPPORT, FUNNY, ANGRY, PRAISE, APPRECIATION, EMPATHY",
                            "default": "",
                        },
                    },
                    "required": ["url"],
                },
            },
        }
    )
    @xml_schema(
        tag_name="get-linkedin-post-reactions",
        mappings=[
            {"param_name": "url", "node_type": "attribute", "path": "."},
            {"param_name": "page", "node_type": "attribute", "path": "."},
            {"param_name": "reaction_type", "node_type": "attribute", "path": "."},
        ],
        example="""
        <!-- Get all reactions for a LinkedIn post -->
        <function_calls>
        <invoke name="get_linkedin_post_reactions">
        <parameter name="url">https://www.linkedin.com/posts/username_activity-123456789-abcd</parameter>
        <parameter name="page">1</parameter>
        </invoke>
        </function_calls>

        <!-- Get only LIKE reactions -->
        <function_calls>
        <invoke name="get_linkedin_post_reactions">
        <parameter name="url">https://www.linkedin.com/posts/username_activity-123456789-abcd</parameter>
        <parameter name="reaction_type">LIKE</parameter>
        </invoke>
        </function_calls>
        """,
    )
    async def get_linkedin_post_reactions(
        self, url: str, page: int = 1, reaction_type: str = ""
    ) -> ToolResult:
        """
        Get detailed reaction data for any LinkedIn post.

        Returns information about who reacted and what type of reaction they gave.
        Each request costs 1 credit.
        """
        try:
            # Validate parameters
            if not url or not isinstance(url, str):
                return self.fail_response("A valid LinkedIn post URL is required")

            if page < 1:
                page = 1

            # Build parameters
            params = {"url": url, "page": page, "reaction_type": reaction_type}

            logger.info(f"Getting reactions for LinkedIn post: {url}, page: {page}")

            # Make API request
            response = await self._make_request(
                "GET", "/api/enrich/post-reactions", params=params
            )

            # Format response
            data = response.get("data", {})

            if not data or not data.get("success", False):
                return self.fail_response(
                    "No reaction data found for the provided post URL"
                )

            # Extract reaction information
            reaction_data = data.get("data", {})
            items = reaction_data.get("items", [])
            total = reaction_data.get("total", 0)
            current_page = reaction_data.get("currentPage", 1)
            total_pages = reaction_data.get("totalPages", 1)

            logger.info(
                f"Successfully retrieved {len(items)} reactions from page {current_page} of {total_pages}"
            )

            return self.success_response(
                {
                    "reactions": items,
                    "pagination": {
                        "current_page": current_page,
                        "total_pages": total_pages,
                        "total_reactions": total,
                        "reactions_on_page": len(items),
                    },
                    "filter": {
                        "reaction_type": reaction_type if reaction_type else "all"
                    },
                    "cost": "1 credit used",
                }
            )

        except Exception as e:
            logger.error(f"Error getting LinkedIn post reactions: {str(e)}")
            return self.fail_response(
                f"Failed to get LinkedIn post reactions: {str(e)}"
            )

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "start_deep_research",
                "description": "Initiate an advanced deep research job that combines multiple search variations with optional email enrichment. Perfect for comprehensive research projects that need extensive data collection. This is an async operation that returns a job ID for tracking progress.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search query to research in depth (e.g., 'software engineers in San Francisco', 'AI researchers at universities')",
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of results to return (default: 30, max: 100)",
                            "default": 30,
                            "minimum": 1,
                            "maximum": 100,
                        },
                        "school": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Filter by school names (e.g., ['Stanford University', 'MIT'])",
                        },
                        "company": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Filter by company names (e.g., ['Google', 'Facebook', 'Apple'])",
                        },
                        "enrich_emails": {
                            "type": "boolean",
                            "description": "Whether to enrich results with contact information (default: true)",
                            "default": True,
                        },
                        "acceptance_threshold": {
                            "type": "integer",
                            "description": "Acceptance score threshold (0-100) for matches (default: 85)",
                            "default": 85,
                            "minimum": 0,
                            "maximum": 100,
                        },
                    },
                    "required": ["query"],
                },
            },
        }
    )
    @xml_schema(
        tag_name="start-deep-research",
        mappings=[
            {"param_name": "query", "node_type": "attribute", "path": "."},
            {"param_name": "limit", "node_type": "attribute", "path": "."},
            {
                "param_name": "school",
                "node_type": "attribute",
                "path": ".",
                "is_list": True,
            },
            {
                "param_name": "company",
                "node_type": "attribute",
                "path": ".",
                "is_list": True,
            },
            {"param_name": "enrich_emails", "node_type": "attribute", "path": "."},
            {
                "param_name": "acceptance_threshold",
                "node_type": "attribute",
                "path": ".",
            },
        ],
        example="""
        <!-- Start deep research for AI engineers -->
        <function_calls>
        <invoke name="start_deep_research">
        <parameter name="query">AI engineers at tech companies</parameter>
        <parameter name="limit">50</parameter>
        <parameter name="enrich_emails">true</parameter>
        <parameter name="acceptance_threshold">85</parameter>
        </invoke>
        </function_calls>
        """,
    )
    async def start_deep_research(
        self,
        query: str,
        limit: int = 30,
        school: Optional[List[str]] = None,
        company: Optional[List[str]] = None,
        enrich_emails: bool = True,
        acceptance_threshold: int = 85,
    ) -> ToolResult:
        """
        Initiate a deep research job with multiple search variations.

        This is an async operation that returns a job ID for tracking progress.
        The process involves generating multiple query variations, running parallel searches,
        deduplicating results, and optionally enriching with contact information.
        """
        try:
            # Validate parameters
            if not query or not isinstance(query, str):
                return self.fail_response("A valid search query is required")

            if limit < 1 or limit > 100:
                limit = min(max(limit, 1), 100)

            if acceptance_threshold < 0 or acceptance_threshold > 100:
                acceptance_threshold = max(min(acceptance_threshold, 100), 0)

            # Build request payload
            payload = {
                "query": query,
                "limit": limit,
                "enrich_emails": enrich_emails,
                "acceptance_threshold": acceptance_threshold,
            }

            # Add optional filters
            if school:
                payload["school"] = school
            if company:
                payload["company"] = company

            logger.info(f"Starting deep research for query: '{query}', limit: {limit}")

            # Make API request
            response = await self._make_request(
                "POST", "/api/search/deep_research", json_data=payload
            )

            # Extract job information
            job_id = response.get("job_id")
            status = response.get("status", "pending")
            message = response.get("message", "")

            if not job_id:
                return self.fail_response(
                    "Failed to start deep research job - no job ID returned"
                )

            logger.info(f"Deep research job started with ID: {job_id}")

            return self.success_response(
                {
                    "job_id": job_id,
                    "status": status,
                    "message": message,
                    "query": query,
                    "parameters": {
                        "limit": limit,
                        "enrich_emails": enrich_emails,
                        "acceptance_threshold": acceptance_threshold,
                        "school_filters": school,
                        "company_filters": company,
                    },
                    "next_step": f"Use get_deep_research_status with job_id '{job_id}' to check progress",
                }
            )

        except Exception as e:
            logger.error(f"Error starting deep research: {str(e)}")
            return self.fail_response(f"Failed to start deep research: {str(e)}")

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "get_deep_research_status",
                "description": "Get the status and results of a deep research job. Use this to monitor progress and retrieve results when the job is complete. The job goes through stages: pending -> processing -> completed/error.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "job_id": {
                            "type": "string",
                            "description": "The job ID returned from start_deep_research",
                        }
                    },
                    "required": ["job_id"],
                },
            },
        }
    )
    @xml_schema(
        tag_name="get-deep-research-status",
        mappings=[{"param_name": "job_id", "node_type": "attribute", "path": "."}],
        example="""
        <!-- Check status of deep research job -->
        <function_calls>
        <invoke name="get_deep_research_status">
        <parameter name="job_id">550e8400-e29b-41d4-a716-446655440000</parameter>
        </invoke>
        </function_calls>
        """,
    )
    async def get_deep_research_status(self, job_id: str) -> ToolResult:
        """
        Get the status and results of a deep research job.

        Returns progress information and results when complete.
        No additional cost for checking status.
        """
        try:
            # Validate parameters
            if not job_id or not isinstance(job_id, str):
                return self.fail_response("A valid job ID is required")

            logger.info(f"Checking deep research status for job: {job_id}")

            # Make API request
            response = await self._make_request(
                "GET", f"/api/search/deep_research/{job_id}"
            )

            # Extract status information
            status = response.get("status", "unknown")
            message = response.get("message", "")
            job_id_response = response.get("job_id", job_id)

            # Build response based on status
            result_data = {
                "job_id": job_id_response,
                "status": status,
                "message": message,
            }

            # Add progress information if available
            if "progress" in response:
                result_data["progress"] = response["progress"]

            # Add creation time if available
            if "created_at" in response:
                result_data["created_at"] = response["created_at"]

            # Handle completed jobs
            if status == "completed":
                results = response.get("results", [])
                total = response.get("total", 0)
                query = response.get("query", "")
                enrichment_stats = response.get("enrichment_stats", {})

                result_data.update(
                    {
                        "results": results,
                        "total_results": total,
                        "query": query,
                        "enrichment_stats": enrichment_stats,
                        "cost": f"{total} credits used for results",
                    }
                )

                logger.info(
                    f"Deep research job {job_id} completed with {total} results"
                )

            # Handle error status
            elif status == "error":
                error_details = response.get("error", "Unknown error")
                result_data["error_details"] = error_details
                logger.error(f"Deep research job {job_id} failed: {error_details}")

            # Handle processing status
            elif status == "processing":
                logger.info(f"Deep research job {job_id} is still processing")

            return self.success_response(result_data)

        except Exception as e:
            logger.error(f"Error getting deep research status: {str(e)}")
            return self.fail_response(f"Failed to get deep research status: {str(e)}")
