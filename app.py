from flask import Flask
import os
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
  raise ValueError("GOOGLE_API_KEY is not set in the environment file.")
os.environ["GOOGLE_API_KEY"] = api_key

app = Flask(__name__)