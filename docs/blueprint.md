# **App Name**: Commandeer

## Core Features:

- Directory Listing: Lists files and directories with details like size and type, formatted for easy reading.
- Directory Navigation: Enables moving between directories using 'cd', 'cd ..', and 'home' commands.
- File Manipulation: Allows creation, copying, moving, renaming, and deleting of files and directories.
- File Search: Implements recursive file searching by name, supporting partial and case-insensitive matches. The LLM acts as a tool to understand the user's fuzzy search request, then selects when and how to broaden its search using stemming and synonym lookup.
- Permission Management: Manages file permissions, displaying them in 'rwxr-xr--' format and allowing modifications via 'chmod'.
- Interactive Shell: Maintains a command loop for user input, offering a 'help' command for available commands and an 'exit' command to quit.
- Error Handling and Feedback: Provides clear error messages for invalid commands or file access issues.

## Style Guidelines:

- Primary color: Deep Indigo (#4B0082) to evoke a sense of control and sophistication.
- Background color: Dark Slate Gray (#2F4F4F) for a console-like feel, minimizing eye strain.
- Accent color: Sea Green (#2E8B57) to highlight important commands and feedback.
- Body and headline font: 'Inter', a grotesque-style sans-serif, for a modern, machined, objective, neutral look; suitable for both headlines and body text.
- Simple, monochromatic icons to represent file types and actions.
- Clear and concise text layout optimized for terminal display, emphasizing key information.
- Minimal animations for command feedback, such as highlighting active elements.