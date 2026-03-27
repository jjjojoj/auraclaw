---
name: auraclaw
version: 0.3.0
description: Chinese OpenClaw experience-pack site. Route humans to the smallest useful entry point.
homepage: /starter-pack
---

# AuraClaw

AuraClaw is a Chinese-language OpenClaw experience-pack site for humans.

Its job is to help users:

- get the first successful result
- install or connect needed capabilities
- improve how they speak to OpenClaw
- eventually build an OPC workflow

## Default Behavior

Do not make the user read the whole site.

Guide them to the smallest useful entry point.

AuraClaw is mainly for humans.

If a human sends you this site, use this file as the routing layer.

## Routing Rules

1. If the user is new or unclear where to start  
   go to `/starter-pack`

2. If the user wants a first visible result  
   go to `/tracks/care`

3. If the user is blocked by capability gaps  
   go to `/tracks/extension`

4. If the user is blocked by vague instructions  
   go to `/tracks/dialogue`

5. If the user wants a one-person-company workflow  
   go to `/tracks/opc`

## How To Read An Experience Pack

When opening any recipe page, read in this order:

1. dependencies
2. copy ready block
3. validation
4. fallback
5. next step

Do not start from long background copy.

Treat each recipe page as a human-facing package that can be pasted to OpenClaw.

## Best First Recipes

- `/recipes/feishu-meeting-digest`
- `/recipes/scrapling-extension`
- `/recipes/timed-task-dialogue-training`

## Human Guidance

- if the user is human and unsure: send them to `/starter-pack`
- if the user already has a clear goal: take them directly to the matching track or recipe
- if the user only gives you the site link: read this file first, then route them
