"""
Tool Executor - Executes tool calls from LLM responses
Part of the EAILI5 multi-agent tool system
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime
import json
from .tool_registry import ToolRegistry, ToolDefinition

logger = logging.getLogger(__name__)

class ToolExecutor:
    """
    Executes tool calls from LLM responses and manages tool execution
    """
    
    def __init__(self, tool_registry: ToolRegistry):
        self.tool_registry = tool_registry
        self.execution_timeout = 30  # seconds
        self.max_retries = 3
    
    async def execute_tool_call(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        user_id: str = None
    ) -> Dict[str, Any]:
        """Execute a single tool call"""
        try:
            logger.info(f"Executing tool: {tool_name} with parameters: {parameters}")
            
            # Execute with timeout
            result = await asyncio.wait_for(
                self.tool_registry.execute_tool(tool_name, parameters, user_id),
                timeout=self.execution_timeout
            )
            
            logger.info(f"Tool {tool_name} executed successfully")
            return result
            
        except asyncio.TimeoutError:
            logger.error(f"Tool {tool_name} execution timed out")
            return {"error": f"Tool {tool_name} execution timed out"}
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {e}")
            return {"error": f"Tool execution failed: {str(e)}"}
    
    async def execute_batch_tool_calls(
        self,
        tool_calls: List[Dict[str, Any]],
        user_id: str = None
    ) -> List[Dict[str, Any]]:
        """Execute multiple tool calls in parallel"""
        try:
            if not tool_calls:
                return []
            
            # Create execution tasks
            tasks = []
            for tool_call in tool_calls:
                task = self.execute_tool_call(
                    tool_name=tool_call.get("name"),
                    parameters=tool_call.get("parameters", {}),
                    user_id=user_id
                )
                tasks.append(task)
            
            # Execute all tools in parallel
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    processed_results.append({
                        "tool": tool_calls[i].get("name"),
                        "error": str(result),
                        "success": False
                    })
                else:
                    processed_results.append({
                        "tool": tool_calls[i].get("name"),
                        "result": result,
                        "success": "error" not in result
                    })
            
            logger.info(f"Executed {len(tool_calls)} tool calls")
            return processed_results
            
        except Exception as e:
            logger.error(f"Error executing batch tool calls: {e}")
            return [{"error": f"Batch execution failed: {str(e)}"}]
    
    async def execute_with_retry(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        user_id: str = None,
        max_retries: int = None
    ) -> Dict[str, Any]:
        """Execute tool with retry logic"""
        try:
            if max_retries is None:
                max_retries = self.max_retries
            
            last_error = None
            for attempt in range(max_retries + 1):
                try:
                    result = await self.execute_tool_call(tool_name, parameters, user_id)
                    
                    # Check if execution was successful
                    if "error" not in result:
                        return result
                    
                    # If it's a rate limit error, don't retry
                    if "rate limit" in result.get("error", "").lower():
                        return result
                    
                    last_error = result.get("error")
                    
                except Exception as e:
                    last_error = str(e)
                
                # Wait before retry (exponential backoff)
                if attempt < max_retries:
                    wait_time = 2 ** attempt
                    await asyncio.sleep(wait_time)
            
            return {"error": f"Tool {tool_name} failed after {max_retries} retries: {last_error}"}
            
        except Exception as e:
            logger.error(f"Error in execute_with_retry: {e}")
            return {"error": f"Retry execution failed: {str(e)}"}
    
    async def validate_tool_calls(
        self,
        tool_calls: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """Validate tool calls before execution"""
        try:
            valid_calls = []
            errors = []
            
            for i, tool_call in enumerate(tool_calls):
                tool_name = tool_call.get("name")
                parameters = tool_call.get("parameters", {})
                
                # Check if tool exists
                tool_def = self.tool_registry.get_tool(tool_name)
                if not tool_def:
                    errors.append(f"Tool '{tool_name}' not found")
                    continue
                
                # Validate parameters
                validation_result = self._validate_tool_parameters(tool_def, parameters)
                if not validation_result["valid"]:
                    errors.append(f"Tool '{tool_name}' validation failed: {validation_result['errors']}")
                    continue
                
                # Check rate limits
                if not tool_def.can_call():
                    errors.append(f"Tool '{tool_name}' rate limit exceeded")
                    continue
                
                valid_calls.append(tool_call)
            
            return valid_calls, errors
            
        except Exception as e:
            logger.error(f"Error validating tool calls: {e}")
            return [], [f"Validation error: {str(e)}"]
    
    def _validate_tool_parameters(
        self,
        tool_def: ToolDefinition,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate tool parameters"""
        try:
            required_params = tool_def.parameters.get("required", [])
            properties = tool_def.parameters.get("properties", {})
            
            errors = []
            
            # Check required parameters
            for param in required_params:
                if param not in parameters:
                    errors.append(f"Missing required parameter: {param}")
            
            # Check parameter types and values
            for param_name, param_value in parameters.items():
                if param_name in properties:
                    param_schema = properties[param_name]
                    
                    # Check type
                    expected_type = param_schema.get("type")
                    if expected_type and not self._check_parameter_type(param_value, expected_type):
                        errors.append(f"Parameter '{param_name}' should be {expected_type}")
                    
                    # Check enum values
                    if "enum" in param_schema and param_value not in param_schema["enum"]:
                        errors.append(f"Parameter '{param_name}' must be one of {param_schema['enum']}")
                    
                    # Check minimum/maximum values
                    if "minimum" in param_schema and param_value < param_schema["minimum"]:
                        errors.append(f"Parameter '{param_name}' must be >= {param_schema['minimum']}")
                    
                    if "maximum" in param_schema and param_value > param_schema["maximum"]:
                        errors.append(f"Parameter '{param_name}' must be <= {param_schema['maximum']}")
            
            return {
                "valid": len(errors) == 0,
                "errors": errors
            }
            
        except Exception as e:
            logger.error(f"Error validating tool parameters: {e}")
            return {"valid": False, "errors": [str(e)]}
    
    def _check_parameter_type(self, value: Any, expected_type: str) -> bool:
        """Check if parameter value matches expected type"""
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
            logger.error(f"Error checking parameter type: {e}")
            return False
    
    async def get_execution_summary(
        self,
        tool_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Get summary of tool execution results"""
        try:
            total_calls = len(tool_results)
            successful_calls = sum(1 for result in tool_results if result.get("success", False))
            failed_calls = total_calls - successful_calls
            
            # Get tool names
            tool_names = [result.get("tool", "unknown") for result in tool_results]
            
            # Get errors
            errors = [result.get("error") for result in tool_results if result.get("error")]
            
            return {
                "total_calls": total_calls,
                "successful_calls": successful_calls,
                "failed_calls": failed_calls,
                "success_rate": successful_calls / total_calls if total_calls > 0 else 0,
                "tools_used": list(set(tool_names)),
                "errors": errors,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting execution summary: {e}")
            return {"error": str(e)}
    
    async def format_tool_results_for_llm(
        self,
        tool_results: List[Dict[str, Any]]
    ) -> str:
        """Format tool results for LLM consumption"""
        try:
            formatted_results = []
            
            for result in tool_results:
                tool_name = result.get("tool", "unknown")
                success = result.get("success", False)
                
                if success:
                    tool_result = result.get("result", {})
                    formatted_results.append(f"Tool {tool_name}: {json.dumps(tool_result, indent=2)}")
                else:
                    error = result.get("error", "Unknown error")
                    formatted_results.append(f"Tool {tool_name} failed: {error}")
            
            return "\n\n".join(formatted_results)
            
        except Exception as e:
            logger.error(f"Error formatting tool results: {e}")
            return f"Error formatting results: {str(e)}"
