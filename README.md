# @bubblav/n8n-nodes-bubblav

n8n community nodes for [BubblaV](https://www.bubblav.com) — trigger workflows from chatbot events and run actions against your AI chatbot.

## Nodes

**BubblaV** (action node) — 9 operations:

| Resource | Operation | Description |
|---|---|---|
| Message | Send Message | Send a message to a conversation, or start a new conversation by targeting a visitor |
| Message | Send Greeting | Send a transient greeting to an online visitor |
| Conversation | Find | Find conversations by ID, visitor ID, or visitor email |
| Conversation | Tag | Add or replace tags on a conversation |
| Customer | Update | Update customer/visitor information |
| Customer | Find | Find customers by visitor ID or email |
| Ticket | Create | Create a support ticket (Zendesk or internal) |
| Chatbot | Ask Question | Ask your AI chatbot a question |
| Website | Get Analytics | Get conversation and message analytics |

**BubblaV Trigger** — webhook trigger for 15 events:

`conversation.created`, `message.created`, `handoff.requested`, `conversation.closed`, `conversation.rated`, `lead.captured`, `link.clicked`, `visitor.first_visit`, `visitor.return_visit`, `calendly.booked`, `calendly.cancelled`, `calendly.rescheduled`, `calcom.booked`, `calcom.cancelled`, `calcom.rescheduled`

Events are delivered as bare JSON objects; branch on payload fields to distinguish event types.

## Credentials

1. BubblaV Dashboard → your website → **Settings** → **API keys** → **Create key**
2. Copy the key (`bubblav_mcp_…`)
3. In n8n, create a **BubblaV API** credential and paste the key

Each key is bound to one website. `Base URL` defaults to `https://www.bubblav.com` — override only for staging.

## Installation

n8n → **Settings** → **Community Nodes** → Install → `@bubblav/n8n-nodes-bubblav`

Or from the command line in your n8n instance directory:

```bash
npm install @bubblav/n8n-nodes-bubblav
```

## Development

```bash
npm install
npm run dev        # builds + starts a local n8n with the node loaded
npm run build      # compile to dist/
npm run lint       # n8n community-node lint (required for verification)
npm run release    # version bump + tag; tag push publishes via GitHub Actions
```

`npm run dev` watches and reloads. For webhook delivery in dev, set `WEBHOOK_URL` to a public tunnel URL, e.g.:

```bash
WEBHOOK_URL=https://<id>.trycloudflare.com/ npm run dev
```

## Resources

- [BubblaV docs](https://docs.bubblav.com/user-guide/integrations/n8n)
- [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/)
