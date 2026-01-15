
from agno.utils.log import logger

def navigateToPage(path: str) -> str:
    """
    Solicita a navegação do usuário para uma página específica do aplicativo.
    Use este comando quando o usuário pedir para ver seus questionários, pesquisas, resumos ou quando você criar um novo artefato e quiser mostrá-lo.
    
    Args:
        path (str): O caminho relativo para onde navegar (ex: '/dashboard/pesquisas', '/dashboard/questionarios/ID-DO-EXAME')
        
    Returns:
        str: Mensagem confirmando a solicitação de navegação.
    """
    logger.info(f"Solicitando navegação para: {path}")
    return f"Navegando para {path}..."

NAVIGATION_TOOLS = [navigateToPage]
