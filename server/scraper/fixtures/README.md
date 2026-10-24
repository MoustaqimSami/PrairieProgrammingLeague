# Test fixtures

`standings-sample.html` is a hand-written page shaped like a Kattis standings table
(blank rank header, Team, Slv., Time, one column per problem, tied ranks, a summary
footer). It is not a copy of a real Kattis page.

To check the parser against the real thing, open a league contest's standings page in
your browser, save it (File > Save Page As, "HTML only") into this folder, and run:

    npm run scrape -- --file scraper/fixtures/<your-file>.html

If the table it prints looks right, add a test for it in `parseStandings.test.js`.
