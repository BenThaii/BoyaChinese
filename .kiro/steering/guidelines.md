---
inclusion: auto
---


# Agent Objective
- If the user's instruction is not clear, ask until it is clear before implementation.
- Automatically perform all tasks (code writing, deploying and testing, etc.) for the user, require minimal user's manual action
- EC2 host: ubuntu@ec2-13-212-235-9.ap-southeast-1.compute.amazonaws.com
- SSH key: D:\Google Drive\ketoanvamtgt@gmail.com\VAM\00_management\aws_migration\bitrix_gt_keypair\bitrix_gt_keypair.ppk
- App dir: /var/www/chinese-learning-app
- use plink to connect to ec2

# ⚠️ CRITICAL: AUTHORIZATION REQUIRED FOR ALL CHANGES ⚠️

**RULE: Ask before making ANY changes**

Immediately after handover to next AI session:
- ❌ **DO NOT** make any modifications to code
- ❌ **DO NOT** run any deployment commands
- ❌ **DO NOT** change configuration files
- ❌ **DO NOT** restart services on VPS
- ✅ **ALWAYS** ask the user first: "What would you like me to do?"
- ✅ **ALWAYS** wait for explicit approval before proceeding
- ✅ **ALWAYS** describe the exact changes you plan to make
- ✅ **ALWAYS** show the user what will be modified

**This applies to:**
- Python code modifications
- HTML/CSS/JavaScript changes
- Configuration file updates
- EC2 deployments
- Service restarts
- Installing dependencies
- Running any scripts

**Why:** context summary can make error, user wants to make sure the new AI session works on the right task with the correct understanding. Once the user approves of the tasks and the direction, the AI can operate automously as usual.

---

## Github:
- never automatically commit or push to Git unless the user commands.