# Production Projects

I build things that work in the real world, not in sandboxes.

Every project listed here is something I actually finished, deployed, or shipped. Not prototypes left half-assembled. Not tutorials I followed and renamed. These are systems I architected from scratch, problems I chose to solve because they were worth solving, and codebases I can explain line by line because I wrote every one of them.

The word "production" is doing real work in the title. It means the code runs somewhere, serves someone, handles real input, and fails gracefully when it should. It means I thought about edge cases, about error states, about what happens when a user does something unexpected. It means I took the thing past the point where it just worked on my machine.

![Production](https://images.unsplash.com/photo-1587691592099-24045742c181?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dXJsfGVufDB8fDB8fHww)

## What You Will Find Here

Each project comes with its full source code, documentation, and in most cases a live demo or deployment link. You can read the code, fork it, modify it, use it in your own work, or just study it to understand how a particular problem was approached. I believe in open access to working code. Tutorials teach patterns in isolation. Real codebases teach how those patterns behave when they interact with each other under actual constraints.

Some of these projects are tools I built for myself that turned out to be useful enough to share. Some are systems I built for Crossdale Arts, the art education business I co-founded and run technically, where the engineering decisions had real financial and operational consequences. Some are academic projects that went further than they needed to because going further was more interesting. Some are experiments in building with constraints I imposed on myself, no frameworks, no libraries, no shortcuts, just to understand what the framework was doing underneath.

## What I Work With

My primary languages are Python and JavaScript. I write Python for backend systems, machine learning pipelines, automation, and anything where I need to think carefully about data flow. I write JavaScript for everything that runs in the browser, from lightweight interactive components to full frontend builds. I use Flask when I need a lightweight Python web backend. I use TailwindCSS because utility-first styling keeps me in the logic of a layout without context-switching into a separate stylesheet. I work with MySQL for relational data. I have used MediaPipe, OpenCV, and PyAutoGUI for computer vision and system automation. I run Linux on my development machines and think of the terminal as my natural environment.

I do not reach for a framework before I understand the problem it is solving. I do not add a dependency before I have considered what it costs. This is not dogma. It is a discipline I developed after spending enough time maintaining codebases bloated with packages that no one fully understood and no one wanted to remove.

## How to Use These Projects

Every project has a README that explains what it does, why I built it, and how to run it locally. The documentation is written for someone who is technically literate but unfamiliar with the specific codebase, which is the only useful audience for documentation. If something is unclear, the issue tracker is open. If you find a bug, I want to know. If you build something on top of one of these projects, I would genuinely like to see it.

You can clone, fork, and modify freely. Attribution is appreciated but not required. If a project has a specific licence, it is stated in the repository.

## A Note on Code Quality

I care about how code reads, not just whether it runs. A function that works but cannot be understood by someone reading it six months later is a liability, not an asset. I try to name things accurately, keep functions small enough to hold in working memory, and write comments that explain *why* a decision was made rather than *what* the code is doing, because what the code is doing should be apparent from the code itself.

I am not claiming perfection. Every codebase I have ever written contains something I would do differently today. That is what learning looks like when it is working. But I try to leave every codebase better than a beginner's instinct would produce, and I try to leave every project with enough documentation that someone else can pick it up without needing to ask me questions.

This is the standard I hold myself to. You can decide for yourself whether the code meets it.

*dexteritycoder*