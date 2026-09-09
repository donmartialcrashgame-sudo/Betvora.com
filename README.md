# Betvora

Modern sportsbook landing page for **Betvora**, designed as the public-facing entry point to the platform.

## Current scope

The landing page is intentionally **non-betting**. Visitors can view live-match previews, upcoming matches, sports categories and promotions, but actual betting will happen inside the sportsbook after authentication.

## Features

- Responsive Betvora landing page
- Modern sportsbook-inspired design
- Live match preview section
- Upcoming match preview
- Football, basketball, tennis and motorsport showcase
- Promotions/benefits section
- Login and registration calls to action
- Mobile navigation
- Responsible gambling notice
- Ready to connect to the Betvora football backend later

## Project structure

```text
.
├── index.html
├── style.css
├── script.js
├── README.md
└── LICENSE
```

## Running locally

This is a static frontend, so it can be opened directly in a browser or served with any static web server.

For example, with VS Code, open the project folder and use a Live Server extension, or deploy the repository as a static site.

## Data strategy

The current match cards are demonstration content so the interface can be designed and tested without depending on the football API provider. Later, the live and upcoming sections can be connected to the Betvora football backend.

## Roadmap

- [x] Create Betvora landing page
- [x] Add responsive navigation
- [x] Add live-match preview section
- [x] Add sports showcase
- [x] Add promotions/benefits section
- [ ] Connect live football data
- [ ] Build sportsbook page
- [ ] Build match details page
- [ ] Build bet slip
- [ ] Add authentication pages
- [ ] Add user dashboard
- [ ] Add wallet and account features

## Important

Betvora is intended to operate as a regulated betting platform where applicable. Production betting, payments, account features and odds should only be enabled after the required legal, regulatory, age-verification and responsible-gambling requirements have been addressed.

## License

MIT License. See [LICENSE](LICENSE).
