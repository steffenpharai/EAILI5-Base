"""
Tool Registry - Manages all available tools for agents
Part of the EAILI5 multi-agent tool system
"""

import asyncio
from typing import Dict, List, Any, Optional, Callable, Type
import logging
from datetime import datetime
import json
import inspect
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class ToolDefinition:
    """Definition of a tool for LLM function calling"""
    
    def __init__(
        self,
        name: str,
        description: str,
        parameters: Dict[str, Any],
        function: Callable,
        category: str = "general",
        requires_auth: bool = False,
        rate_limit: int = 100  # calls per hour
    ):
        self.name = name
        self.description = description
        self.parameters = parameters
        self.function = function
        self.category = category
        self.requires_auth = requires_auth
        self.rate_limit = rate_limit
        self.call_count = 0
        self.last_reset = datetime.now()
    
    def to_openai_schema(self) -> Dict[str, Any]:
        """Convert to OpenAI function calling schema"""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters
        }
    
    def can_call(self, user_id: str = None) -> bool:
        """Check if tool can be called (rate limiting)"""
        try:
            # Reset counter if it's been more than an hour
            if (datetime.now() - self.last_reset).seconds > 3600:
                self.call_count = 0
                self.last_reset = datetime.now()
            
            return self.call_count < self.rate_limit
        except Exception as e:
            logger.error(f"Error checking tool call eligibility: {e}")
            return False
    
    def increment_call_count(self):
        """Increment call count for rate limiting"""
        self.call_count += 1

class ToolRegistry:
    """
    Registry for managing all available tools in the EAILI5 system
    """
    
    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self.categories: Dict[str, List[str]] = {}
        self.user_call_counts: Dict[str, Dict[str, int]] = {}  # user_id -> tool_name -> count
        
    def register_tool(self, tool_definition: ToolDefinition) -> bool:
        """Register a new tool"""
        try:
            self.tools[tool_definition.name] = tool_definition
            
            # Add to category
            if tool_definition.category not in self.categories:
                self.categories[tool_definition.category] = []
            self.categories[tool_definition.category].append(tool_definition.name)
            
            logger.info(f"Registered tool: {tool_definition.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error registering tool {tool_definition.name}: {e}")
            return False
    
    def get_tool(self, tool_name: str) -> Optional[ToolDefinition]:
        """Get a tool by name"""
        return self.tools.get(tool_name)
    
    def get_tools_by_category(self, category: str) -> List[ToolDefinition]:
        """Get all tools in a category"""
        try:
            tool_names = self.categories.get(category, [])
            return [self.tools[name] for name in tool_names if name in self.tools]
        except Exception as e:
            logger.error(f"Error getting tools by category {category}: {e}")
            return []
    
    def get_available_tools(
        self, 
        user_id: str = None, 
        categories: List[str] = None
    ) -> List[ToolDefinition]:
        """Get available tools for a user"""
        try:
            available_tools = []
            
            for tool_name, tool_def in self.tools.items():
                # Check category filter
                if categories and tool_def.category not in categories:
                    continue
                
                # Check rate limiting
                if not tool_def.can_call(user_id):
                    continue
                
                # Check user-specific rate limiting
                if user_id and not self._can_user_call_tool(user_id, tool_name, tool_def):
                    continue
                
                available_tools.append(tool_def)
            
            return available_tools
            
        except Exception as e:
            logger.error(f"Error getting available tools: {e}")
            return []
    
    def get_tool_descriptions(
        self, 
        user_id: str = None, 
        categories: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Get tool descriptions for LLM function calling"""
        try:
            available_tools = self.get_available_tools(user_id, categories)
            return [tool.to_openai_schema() for tool in available_tools]
            
        except Exception as e:
            logger.error(f"Error getting tool descriptions: {e}")
            return []
    
    async def execute_tool(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        user_id: str = None
    ) -> Dict[str, Any]:
        """Execute a tool with given parameters"""
        try:
            tool_def = self.get_tool(tool_name)
            if not tool_def:
                return {"error": f"Tool '{tool_name}' not found"}
            
            # Check if tool can be called
            if not tool_def.can_call(user_id):
                return {"error": f"Tool '{tool_name}' rate limit exceeded"}
            
            if user_id and not self._can_user_call_tool(user_id, tool_name, tool_def):
                return {"error": f"User rate limit exceeded for tool '{tool_name}'"}
            
            # Validate parameters
            validation_result = self._validate_parameters(tool_def, parameters)
            if not validation_result["valid"]:
                return {"error": f"Invalid parameters: {validation_result['errors']}"}
            
            # Execute tool
            try:
                if inspect.iscoroutinefunction(tool_def.function):
                    result = await tool_def.function(**parameters)
                else:
                    result = tool_def.function(**parameters)
                
                # Update call counts
                tool_def.increment_call_count()
                if user_id:
                    self._increment_user_call_count(user_id, tool_name)
                
                logger.info(f"Executed tool {tool_name} for user {user_id}")
                return {"result": result, "tool": tool_name}
                
            except Exception as e:
                logger.error(f"Error executing tool {tool_name}: {e}")
                return {"error": f"Tool execution failed: {str(e)}"}
            
        except Exception as e:
            logger.error(f"Error in execute_tool: {e}")
            return {"error": f"Tool execution error: {str(e)}"}
    
    def _validate_parameters(
        self, 
        tool_def: ToolDefinition, 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate tool parameters against schema"""
        try:
            required_params = tool_def.parameters.get("required", [])
            properties = tool_def.parameters.get("properties", {})
            
            errors = []
            
            # Check required parameters
            for param in required_params:
                if param not in parameters:
                    errors.append(f"Missing required parameter: {param}")
            
            # Check parameter types
            for param_name, param_value in parameters.items():
                if param_name in properties:
                    expected_type = properties[param_name].get("type")
                    if expected_type and not self._check_type(param_value, expected_type):
                        errors.append(f"Parameter '{param_name}' should be {expected_type}")
            
            return {
                "valid": len(errors) == 0,
                "errors": errors
            }
            
        except Exception as e:
            logger.error(f"Error validating parameters: {e}")
            return {"valid": False, "errors": [str(e)]}
    
    def _check_type(self, value: Any, expected_type: str) -> bool:
        """Check if value matches expected type"""
        try:
            type_mapping = {
                "string": str,
                "integer": int,
                "number": (int, float),
                "boolean": bool,
                "array": list,
                "object": dict
            }
            
            expected_python_type = type_mapping.get(expected_type)
            if not expected_python_type:
                return True  # Unknown type, assume valid
            
            return isinstance(value, expected_python_type)
            
        except Exception as e:
            logger.error(f"Error checking type: {e}")
            return False
    
    def _can_user_call_tool(
        self, 
        user_id: str, 
        tool_name: str, 
        tool_def: ToolDefinition
    ) -> bool:
        """Check if user can call a specific tool"""
        try:
            if user_id not in self.user_call_counts:
                self.user_call_counts[user_id] = {}
            
            user_tool_count = self.user_call_counts[user_id].get(tool_name, 0)
            return user_tool_count < tool_def.rate_limit
            
        except Exception as e:
            logger.error(f"Error checking user tool eligibility: {e}")
            return False
    
    def _increment_user_call_count(self, user_id: str, tool_name: str):
        """Increment user's call count for a tool"""
        try:
            if user_id not in self.user_call_counts:
                self.user_call_counts[user_id] = {}
            
            self.user_call_counts[user_id][tool_name] = \
                self.user_call_counts[user_id].get(tool_name, 0) + 1
                
        except Exception as e:
            logger.error(f"Error incrementing user call count: {e}")
    
    def get_tool_usage_stats(self, user_id: str = None) -> Dict[str, Any]:
        """Get tool usage statistics"""
        try:
            stats = {
                "total_tools": len(self.tools),
                "categories": list(self.categories.keys()),
                "user_stats": {}
            }
            
            if user_id:
                user_stats = self.user_call_counts.get(user_id, {})
                stats["user_stats"] = {
                    "tools_used": len(user_stats),
                    "total_calls": sum(user_stats.values()),
                    "tool_breakdown": user_stats
                }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting tool usage stats: {e}")
            return {}
    
    def reset_user_limits(self, user_id: str = None):
        """Reset rate limits for a user or all users"""
        try:
            if user_id:
                if user_id in self.user_call_counts:
                    del self.user_call_counts[user_id]
            else:
                self.user_call_counts.clear()
            
            logger.info(f"Reset rate limits for user {user_id or 'all users'}")
            
        except Exception as e:
            logger.error(f"Error resetting user limits: {e}")
    
    def get_tool_categories(self) -> List[str]:
        """Get all available tool categories"""
        return list(self.categories.keys())
    
    def search_tools(self, query: str) -> List[ToolDefinition]:
        """Search tools by name or description"""
        try:
            query_lower = query.lower()
            matching_tools = []
            
            for tool_def in self.tools.values():
                if (query_lower in tool_def.name.lower() or 
                    query_lower in tool_def.description.lower()):
                    matching_tools.append(tool_def)
            
            return matching_tools
            
        except Exception as e:
            logger.error(f"Error searching tools: {e}")
            return []
