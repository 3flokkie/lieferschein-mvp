# AIngeneer & WelcomeScreen Project Status

## 1. Domain & Legal Compliance
- Website: `https://aingeneer.com` and `https://aingeneer.pages.dev` (Cloudflare Pages, HTTP/2 200 OK, SSL Active).
- German DSGVO / GDPR & § 5 TMG / § 18 MStV compliance:
  - Impressum: `/Users/sashasyrota/PycharmProjects/aingeneer/impressum.html` (Oleksandr Syrota, Waginger Str. 46, 83395 Freilassing).
  - Datenschutz: `/Users/sashasyrota/PycharmProjects/aingeneer/datenschutz.html` (BayLDA jurisdiction, Cloudflare logs, zero cookies).
  - Self-hosted fonts: 27 WOFF2 files in `/fonts/`, Google US IP transfer eliminated.
- Email routing: `oleksandr@aingeneer.com` forwards to `syrotaoleksandr2@gmail.com`.

## 2. Startup Grants & Cloud Infrastructure
- **AWS Activate Founders:**
  - AWS Account ID: `160767497637` (linked to `startups.aws.com`).
  - Region: `eu-north-1` (Stockholm).
  - Claude Code plugin installed: `aws-startup-advisor@claude-plugins-official`.
  - Pending approval for $1,000–$5,000 credits on Amazon Bedrock / Claude 3.5 Sonnet.
- **Microsoft for Startups Founders Hub & Azure:**
  - Account: `sasha.sirota153@gmail.com` linked with GitHub `3flokkie`.
  - Current status: **200 € credits already active** in Azure!
  - Next step: Submit full Founders Hub profile at `foundershub.startups.microsoft.com` to upgrade to Level 1 ($1,000 credits) -> Level 2 ($5,000 credits) + free GitHub Enterprise + Microsoft 365 + Azure OpenAI.

## 3. Remote Control / Mobile Approval Bot
- Bot: `@Aingeneerbot` (Token configured in local environment variable `TELEGRAM_BOT_TOKEN`).
- Local bridge script: `/Users/sashasyrota/PycharmProjects/WelcomeScreen/scripts/telegram_approval_bridge.py`.
- Running daemon on port 8765 (`/ask`, `/notify`, `/screen`).
- User needs to click `/start` in `@Aingeneerbot` to pair iPhone.

## 4. Horror Series «Правило 304: Двойник за дверью»
- Character: Артём.
- Episode 1: `y0sXhlJvxBI` (Choice: Обернуться назад).
- Episode 2: `VuQk8XtsODw` (Choice: Спрятаться на кухне).
- Episode 3: `q-E7Eun5cwE` (Uploaded live, cliffhanger: рука лезет к щеколде).
- **Episode 4 (Completed & Rendered):**
  - Script chosen: Вариант 3 (Комбо: Тесак + Карниз 5 этажа).
  - Voice synthesized: `video-engine/public/horror_part4_liam.mp3` (59.5 sec, ElevenLabs Liam).
  - Whisper timestamps: `video-engine/public/horror_part4_words.json` (129 words).
  - SFX: 5 Earshot rendered sound effects (swish, cut hit, impact, wind gust, sub drop).
  - Rendered output: `video-engine/out/horror_part4_full.mp4` (27 MB, 1080x1920, 30fps).
  - Delivered to Telegram: `@Aingeneerbot` (Chat ID `898984755`).
  - Next step: Upload to YouTube via `scripts/uploader.py`.

## 5. Skills & Tools Installed
- `earshot` installed at `~/.local/bin/earshot`.
- 18 Emil Kowalski design skills installed in `~/.claude/skills/`.
