"""Core LangChain agent with tools and memory."""
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from config import GOOGLE_API_KEY, LLM_MODEL
from chatbot.prompts import get_system_prompt
from chatbot.tools import ALL_TOOLS


def get_llm():
    """Initialize the LLM based on configuration."""
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not set in environment.")
    
    return ChatGoogleGenerativeAI(
        model=LLM_MODEL,
        google_api_key=GOOGLE_API_KEY,
        temperature=0.7,
        max_retries=0,
        timeout=30,
    )


def create_agent(hostel_context: str = "", student_context: str = ""):
    """Create a LangChain agent with hostel-specific tools."""
    llm = get_llm()

    system_prompt = get_system_prompt().format(
        hostel_context=hostel_context or "No specific hostel context available.",
        student_context=student_context or "No student context (user may be a guest).",
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_tool_calling_agent(llm, ALL_TOOLS, prompt)

    return AgentExecutor(
        agent=agent,
        tools=ALL_TOOLS,
        verbose=True,
        max_iterations=5,
        handle_parsing_errors=True,
    )


def format_chat_history(messages: list) -> list:
    """Convert stored messages to LangChain message format."""
    history = []
    for msg in messages:
        if isinstance(msg, dict):
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "user":
                history.append(HumanMessage(content=content))
            elif role == "assistant":
                history.append(AIMessage(content=content))
    return history
