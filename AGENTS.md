# Repository workflow

The user prefers Codex to handle Git directly in this local repository, including
committing and pushing completed work to GitHub. GitHub Desktop is optional and
should not be a required publishing step.

- For user-requested implementation work, run the checks appropriate to the change,
  commit the completed changes belonging to that task, and push them to the
  configured `origin` remote before reporting completion.
- The normal publishing branch is `main`. Respect an explicit request for a
  different branch, pull request, local-only work, or no commit/push. Do not switch
  branches merely to satisfy this default when work is already in progress.
- Publish at completed, validated checkpoints. Do not install a background watcher
  that commits every file save.
- Inspect the working tree before staging. Preserve unrelated user changes and
  never commit credentials, local environment files, or other secrets.
- Use ordinary pushes. Never force-push, discard work, or bypass branch protection.
  If the remote has moved, fetch and inspect the changes before integrating them;
  preserve both local and remote work.
- Verify that the intended commit reached the remote branch and report any actual
  authentication, protection, or connection blocker clearly.

Repository: https://github.com/beingdivine-jpg/untangle
