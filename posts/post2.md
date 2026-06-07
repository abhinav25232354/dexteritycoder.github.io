# Artificial Intelligence and Machine Learning

I want to start with something honest: most of what is currently marketed as AI knowledge is surface-level familiarity dressed up as expertise.

Knowing how to write a prompt is not the same as understanding what a language model is doing when it generates a response. Knowing how to call an API is not the same as understanding the architecture that responds to it. Knowing which tools exist is not the same as knowing when to use them, when to avoid them, and why a particular tool produces the output it does. This distinction matters enormously, and it is the distinction I try to hold onto in everything I share here.

This section of the site exists at that boundary. It is not a collection of tutorials for people who want to appear knowledgeable. It is a collection of things I have actually worked through, understood well enough to explain, and found useful enough to share.

## What I Actually Know About This Field

I have built a real-time hand gesture recognition system using MediaPipe and OpenCV that detects hand landmarks at 21 points per frame, maps them to gesture classifications, and translates those gestures into system-level control actions using PyAutoGUI. This is not a weekend project. It required understanding how MediaPipe's landmark detection model works geometrically, how to normalise coordinate data across different hand sizes and camera distances, how to handle the inherent latency between gesture detection and system response, and how to make the whole pipeline run at a framerate that feels usable. Building it taught me more about how computer vision models represent spatial information than any course I could have taken.

I have built a local AI assistant using Ollama that runs entirely offline on my own hardware. The practical challenge of getting a 7-billion-parameter language model to run usably on consumer hardware, managing context window limitations, structuring prompts so the model produces reliably structured output, and integrating the model into a Python agent that can act on its responses, taught me things about inference architecture and quantisation that I could not have learned just by reading about them. I care deeply about local AI deployment because I believe that a tool you cannot run without a third party's permission is a tool you do not truly own.

I have worked extensively with prompt engineering not as a soft creative skill but as a technical discipline. A prompt is a specification. Like any specification, it can be precise or vague, overconstrained or underconstrained, and the quality of the output is a direct function of the quality of the specification. I have spent real time understanding how context window structure affects model behaviour, how few-shot examples train in-context without gradient descent, how chain-of-thought prompting externalises reasoning in ways that reliably improve output quality on multi-step problems, and how system prompts interact with user prompts in ways that are not always intuitive.

## What I Share Here

I share working models and model integrations with documentation detailed enough to let you actually use them. I share analysis of AI tools that goes past the surface, not "here are five tools you should know about" but genuine examination of what a tool does, what its limitations are, where it breaks down, and what problem it is actually solving versus what problem it claims to solve. I share techniques for making AI tools more useful in specific, concrete contexts, because generic advice about AI productivity is almost always useless, while specific, domain-grounded techniques can be genuinely transformative.

I share my thinking on the epistemological questions that practitioners in this field tend to avoid because they are uncomfortable. What does it mean to understand something versus being able to produce output that resembles understanding? What is the actual cognitive cost of offloading thinking to a generative model, and under what conditions is that cost worth paying? When does AI assistance accelerate learning and when does it short-circuit it? I do not have final answers to these questions. I have worked through them carefully enough to have positions that I can defend and update.

## My Position on This Technology

I am not an AI enthusiast in the sense of unconditional excitement about every development in the field. I think the current moment requires more epistemic sobriety than the popular discourse typically offers. The capabilities of large language models are genuinely remarkable. The tendency to anthropomorphise them, to attribute understanding where there is pattern completion, to treat output fluency as a proxy for correctness, is a genuine problem that leads to genuine failures.

I am also not a sceptic in the sense of dismissal. I have built systems with this technology. I know what it can do, and I know that what it can do is non-trivially useful. The question is always whether you understand what you are actually using, which requires being honest about what the technology is and is not.

What I try to bring to this section is the perspective of someone who has gotten their hands genuinely dirty with the actual systems, who has read enough of the underlying research to understand the architectural decisions that produce the behaviours we observe, and who cares enough about honest analysis to say when something is overhyped, when something is underappreciated, and when the correct answer is that we do not yet know.

That is the kind of thinking I want to share here, and the kind I hope to find from the people who read it.

*dexteritycoder*