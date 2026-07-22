# I Built My Own Jarvis. Here Is How You Can Too.

Jarvis is more than just a project for me. It is an emotion. I started coding because of it. As a huge fan of Iron Man, I always dreamed of having a similar virtual assistant of my own, something that would listen, respond, and actually feel intelligent.

So I began searching on YouTube and found several tutorials about building your own Jarvis using Python. At the time I thought I just needed an app that could act like one. But most of those projects were built for general public demonstrations, not for personal everyday use. I followed one tutorial step by step and eventually messed things up completely. Then I realized that the video I was watching was actually the last one in a playlist called "Project Video." I had skipped the entire foundation. So I went back to the beginning, learned everything properly, and after about a year I finally made it work. By 2019 I was still refining it with newly learned skills.

Today I am going to show you how to build your own Jarvis, capable of voice commands, audio and text output, file handling, terminal-based interaction, and intelligent memory management.

## Installing the Required Modules

Run these commands in your terminal. Use Administrator mode on Windows or `sudo` on Mac and Linux.

```bash
pip install openai
pip install requests
pip install beautifulsoup4
pip install html
pip install re
pip install edge-tts
pip install asyncio
pip install pygame
pip install speechRecognition
```

## Building the AI Function

We will create a function that generates AI responses. You will need an API key for this. Any provider works, but Perplexity is recommended for its search-augmented responses. You can check their documentation at [docs.perplexity.ai](https://docs.perplexity.ai).

Save this as `askAI.py`. We will import it into the main script later.

```python
from openai import OpenAI
import requests
import os
from bs4 import BeautifulSoup
import html
import re

def askAI(userInput=None, file=None, url=None):
    API_KEY = "Your API Key"
    API_URL = "https://api.perplexity.ai/chat/completions"
    HEADERS = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    MODEL_NAME = "sonar"

    # Handle file upload
    if file:
        ext = os.path.splitext(file)[1].lower()
        try:
            if ext == ".txt":
                with open(file, "r", encoding="utf-8") as f:
                    userInput = f.read()
            elif ext == ".pdf":
                from PyPDF2 import PdfReader
                reader = PdfReader(file)
                userInput = "\n".join([page.extract_text() for page in reader.pages])
            elif ext in [".docx", ".doc"]:
                import docx
                doc = docx.Document(file)
                userInput = "\n".join([p.text for p in doc.paragraphs])
            else:
                raise ValueError("Unsupported file format. Use txt, pdf, or docx.")
        except Exception as e:
            return [], f"<p>Error reading file: {str(e)}</p>", []

    # Handle URL analysis
    elif url:
        try:
            page = requests.get(url, timeout=10)
            soup = BeautifulSoup(page.content, "html.parser")
            for script in soup(["script", "style"]):
                script.extract()
            userInput = soup.get_text(separator="\n")
            userInput = "\n".join([line.strip() for line in userInput.splitlines() if line.strip()])
        except Exception as e:
            return [], f"<p>Error fetching URL: {str(e)}</p>", []

    if not userInput:
        return [], "<p>No input provided.</p>", []

    # Make a chat_history.txt in your directory for saving past
    # interactions to use as context for the next question.
    with open("chat_history.txt", "r") as f:
        context = f.read()

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Your name is Jarvis. "
                    "You are designed and made by {Your Name}. "
                    "Brand that made you is {Your Brand Name}. "
                    "You are a super intelligent assistant. "
                    "Give answers in one line or maximum 2 lines. "
                    "Keep the answer very precise and filled with useful information without using too many jargons. "
                    "Give response in Jarvis accent but without jargons. "
                    "Give answer in plain text without using markdown syntax bold, italic, underline, bullets, citations or reference markers. "
                    f"{context}"
                )
            },
            {
                "role": "user",
                "content": userInput
            }
        ],
        "temperature": 0.7,
        "max_tokens": 3000,
        "stream": False,
        "search_mode": "academic",
    }

    response = requests.post(API_URL, headers=HEADERS, json=payload)
    response.raise_for_status()
    data = response.json()

    answer = data["choices"][0]["message"]["content"]
    content = answer
    citations = data.get("citations", [])
    search_results = data.get("search_results", [])

    return citations, content, search_results
```

To test it before moving forward, run this and make sure it gives a coherent response:

```python
if __name__ == "__main__":
    question = input("Enter your question: ")
    print(askAI(question)[1])
```

If it prints an answer, you are all set.

## Converting AI Responses to Speech

This function uses `edge-tts` to synthesize the AI response into audio and `pygame` to play it back.

```python
import edge_tts
import asyncio
import pygame

pygame.mixer.init()

async def text_to_speech(text: str, filename: str = "output.mp3"):
    try:
        filepath = os.path.abspath(filename)

        if pygame.mixer.get_init():
            pygame.mixer.music.stop()
            pygame.mixer.quit()
            await asyncio.sleep(0.1)

        if os.path.exists(filepath):
            for _ in range(10):
                try:
                    os.remove(filepath)
                    break
                except PermissionError:
                    await asyncio.sleep(0.1)
            else:
                print(f"Warning: Could not delete locked file {filepath}")

        tts = edge_tts.Communicate(text, "en-US-EmmaMultilingualNeural")
        await tts.save(filepath)

        for _ in range(10):
            try:
                with open(filepath, "rb") as f:
                    f.read(1)
                break
            except PermissionError:
                await asyncio.sleep(0.1)

        pygame.mixer.init()
        pygame.mixer.music.load(filepath)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            await asyncio.sleep(0.1)

        pygame.mixer.music.stop()
        pygame.mixer.quit()

    except Exception as e:
        print(f"Error during TTS: {e}")
```

## Adding Voice Recognition

This function listens through your microphone and returns whatever you said as a string.

```python
import speech_recognition as sr

r = sr.Recognizer()

def takeCommand():
    with sr.Microphone() as source:
        print("Listening...")
        r.pause_threshold = 1
        audio = r.listen(source)

    try:
        print("Recognizing...")
        query = r.recognize_google(audio, language='en-in')
        print(f"User said: {query}\n")

    except Exception as e:
        print("Say that again please...")
        return "None"
    return query
```

## The Complete main.py

This is the entry point that ties everything together. Make sure `askAI.py` is in the same directory before running it.

```python
import edge_tts
import asyncio
import time
import os
from askAI import askAI

os.environ["PYGAME_HIDE_SUPPORT_PROMPT"] = "1"

import pygame
import speech_recognition as sr
import threading

pygame.mixer.init()

async def text_to_speech(text: str, filename: str = "output.mp3"):
    try:
        filepath = os.path.abspath(filename)

        if pygame.mixer.get_init():
            pygame.mixer.music.stop()
            pygame.mixer.quit()
            await asyncio.sleep(0.1)

        if os.path.exists(filepath):
            for _ in range(10):
                try:
                    os.remove(filepath)
                    break
                except PermissionError:
                    await asyncio.sleep(0.1)
            else:
                print(f"Warning: Could not delete locked file {filepath}")

        tts = edge_tts.Communicate(text, "en-US-EmmaMultilingualNeural")
        await tts.save(filepath)

        for _ in range(10):
            try:
                with open(filepath, "rb") as f:
                    f.read(1)
                break
            except PermissionError:
                await asyncio.sleep(0.1)

        pygame.mixer.init()
        pygame.mixer.music.load(filepath)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            await asyncio.sleep(0.1)

        pygame.mixer.music.stop()
        pygame.mixer.quit()

    except Exception as e:
        print(f"Error during TTS: {e}")

r = sr.Recognizer()

def takeCommand():
    with sr.Microphone() as source:
        print("Listening...")
        r.pause_threshold = 1
        audio = r.listen(source)

    try:
        print("Recognizing...")
        query = r.recognize_google(audio, language='en-in')
        print(f"User said: {query}\n")

    except Exception as e:
        print("Say that again please...")
        return "None"
    return query

if __name__ == "__main__":
    while True:
        # Uncomment the line below for text input instead of voice
        # question = input("\n-->")

        # Comment this line if you want text input
        text = takeCommand()
        answer = askAI(text)[1]
        asyncio.run(text_to_speech(answer))
        stop = takeCommand()
        if stop.lower() == "stop":
            print("Exiting...")
            break
```

## Running the Project

Once both files are in the same directory, run `main.py` and your personal Jarvis will come to life. Speak your question, listen to the response, and say "stop" whenever you want to exit. Everything else takes care of itself.

Thank you for reading. If you found this useful, follow for more projects like this.