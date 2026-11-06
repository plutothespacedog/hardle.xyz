# Classic Hardle (easter egg)

`public/classic/` is the original version of Hardle, the one Sam built on their own, served at
`hardle.xyz/classic/`. It's the untouched build of commit `164301f` on `main` ("fixed white space").

To get there in the game: tap the little logo at the top of the start page 5 times.

The only addition to the original is a small back arrow in the top-left corner (back to the new
Hardle). It lives in `public/classic/index.html` just before `</body>`, marked with a comment.
Nothing in the original JavaScript or styles was changed.

Apart from that arrow, don't edit the files in `public/classic/` by hand; they're build output.
To rebuild it from the original source:

```bash
git archive 164301f hardle_js | tar -x -C /tmp/hardle-classic
ln -s "$PWD/node_modules" /tmp/hardle-classic/hardle_js/node_modules
(cd /tmp/hardle-classic/hardle_js && PUBLIC_URL=/classic GENERATE_SOURCEMAP=false npx react-scripts build)
rm -rf public/classic && cp -R /tmp/hardle-classic/hardle_js/build public/classic
```

After rebuilding, add the back-arrow snippet to `public/classic/index.html` again (copy it from git history).
