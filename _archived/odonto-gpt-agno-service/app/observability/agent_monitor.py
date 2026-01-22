"""
Monitor de Agentes

Fornece logging estruturado, métricas e alertas para execuções de agentes.
"""

import logging
import json
from datetime import datetime
from typing import Any, Dict, Optional, Callable
from functools import wraps
import time
import asyncio

# Configurar logger estruturado
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("agent_pipeline")


class AgentMonitor:
    """
    Monitor de execução de agentes com métricas e alertas.
    
    Uso:
        monitor = AgentMonitor("artifact-analyzer")
        monitor.log_execution_start({"type": "research"})
        # ... execução ...
        monitor.log_execution_end({"artifacts": 1}, success=True)
    """
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.execution_start: Optional[float] = None
        self.metrics: Dict[str, Any] = {
            "total_executions": 0,
            "successful_executions": 0,
            "failed_executions": 0,
            "total_duration_seconds": 0,
            "tool_calls": 0
        }
    
    def log_execution_start(self, input_data: Dict[str, Any]) -> None:
        """
        Registra início de execução do agente.
        
        Args:
            input_data: Dados de entrada para o agente
        """
        self.execution_start = time.time()
        self.metrics["total_executions"] += 1
        
        log_entry = {
            "event": "agent_execution_start",
            "agent": self.agent_name,
            "timestamp": datetime.utcnow().isoformat(),
            "input_size": len(str(input_data)),
            "input_type": input_data.get("type", "unknown"),
            "input_preview": str(input_data)[:200]
        }
        
        logger.info(json.dumps(log_entry, ensure_ascii=False))
    
    def log_execution_end(
        self, 
        output_data: Dict[str, Any], 
        success: bool,
        error: Optional[str] = None
    ) -> None:
        """
        Registra fim de execução com métricas.
        
        Args:
            output_data: Dados de saída do agente
            success: Se a execução foi bem-sucedida
            error: Mensagem de erro (se aplicável)
        """
        duration = time.time() - (self.execution_start or time.time())
        self.metrics["total_duration_seconds"] += duration
        
        if success:
            self.metrics["successful_executions"] += 1
        else:
            self.metrics["failed_executions"] += 1
        
        log_entry = {
            "event": "agent_execution_end",
            "agent": self.agent_name,
            "timestamp": datetime.utcnow().isoformat(),
            "duration_seconds": round(duration, 3),
            "success": success,
            "output_size": len(str(output_data)),
            "output_type": type(output_data).__name__
        }
        
        if error:
            log_entry["error"] = error
        
        if success:
            logger.info(json.dumps(log_entry, ensure_ascii=False))
        else:
            logger.error(json.dumps(log_entry, ensure_ascii=False))
    
    def log_tool_call(
        self, 
        tool_name: str, 
        args: Dict[str, Any], 
        result: Any,
        duration_ms: Optional[float] = None
    ) -> None:
        """
        Registra chamada de ferramenta.
        
        Args:
            tool_name: Nome da ferramenta
            args: Argumentos passados
            result: Resultado retornado
            duration_ms: Duração em milissegundos
        """
        self.metrics["tool_calls"] += 1
        
        log_entry = {
            "event": "tool_call",
            "agent": self.agent_name,
            "tool": tool_name,
            "timestamp": datetime.utcnow().isoformat(),
            "args_keys": list(args.keys()) if isinstance(args, dict) else [],
            "result_type": type(result).__name__,
            "result_preview": str(result)[:100] if result else None
        }
        
        if duration_ms:
            log_entry["duration_ms"] = round(duration_ms, 2)
        
        logger.info(json.dumps(log_entry, ensure_ascii=False))
    
    def log_warning(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Registra warning com contexto."""
        log_entry = {
            "event": "agent_warning",
            "agent": self.agent_name,
            "timestamp": datetime.utcnow().isoformat(),
            "message": message,
            **(context or {})
        }
        logger.warning(json.dumps(log_entry, ensure_ascii=False))
    
    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas agregadas."""
        avg_duration = (
            self.metrics["total_duration_seconds"] / self.metrics["total_executions"]
            if self.metrics["total_executions"] > 0
            else 0
        )
        
        success_rate = (
            self.metrics["successful_executions"] / self.metrics["total_executions"] * 100
            if self.metrics["total_executions"] > 0
            else 0
        )
        
        return {
            **self.metrics,
            "average_duration_seconds": round(avg_duration, 3),
            "success_rate_percent": round(success_rate, 2)
        }


def monitored_agent(agent_name: Optional[str] = None):
    """
    Decorator para monitorar execuções de funções de agentes.
    
    Uso:
        @monitored_agent("artifact-analyzer")
        async def analyze_artifact(content: str) -> dict:
            ...
    
    Args:
        agent_name: Nome do agente (usa nome da função se não fornecido)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            name = agent_name or func.__name__
            monitor = AgentMonitor(name)
            
            # Preparar input para log
            input_data = {
                "args_count": len(args),
                "kwargs_keys": list(kwargs.keys()),
                "function": func.__name__
            }
            
            monitor.log_execution_start(input_data)
            
            try:
                result = await func(*args, **kwargs)
                
                output_data = {
                    "result_type": type(result).__name__,
                    "has_result": result is not None
                }
                
                monitor.log_execution_end(output_data, success=True)
                return result
                
            except Exception as e:
                monitor.log_execution_end(
                    {"error": str(e)}, 
                    success=False, 
                    error=str(e)
                )
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            name = agent_name or func.__name__
            monitor = AgentMonitor(name)
            
            input_data = {
                "args_count": len(args),
                "kwargs_keys": list(kwargs.keys()),
                "function": func.__name__
            }
            
            monitor.log_execution_start(input_data)
            
            try:
                result = func(*args, **kwargs)
                
                output_data = {
                    "result_type": type(result).__name__,
                    "has_result": result is not None
                }
                
                monitor.log_execution_end(output_data, success=True)
                return result
                
            except Exception as e:
                monitor.log_execution_end(
                    {"error": str(e)}, 
                    success=False, 
                    error=str(e)
                )
                raise
        
        # Retornar wrapper apropriado
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator
