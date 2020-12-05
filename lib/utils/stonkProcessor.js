import CorpusBlacklist from "./stonkProcessorBlacklist";
import TextCleaner from "text-cleaner";
import sentiment from "wink-sentiment";

export const stonkProcessor = (responseData = []) =>
  new Promise((resolve) => {
    // Flatten response data.
    responseData = responseData.flat();

    function parse(corpus) {
      // Filter tokens that have a length more than 1 character,
      // a length less than 6 characters, have characters that are
      // all caps, and aren't included in the corpus blacklist.
      let filter = (token) =>
        token &&
        token.length > 1 &&
        token.length < 6 &&
        token === token.toUpperCase() &&
        !CorpusBlacklist.includes(token);

      // Create token list after cleaning the corpus (fixing the
      // spacing, removing non-alpha characters, removing stop
      // words) and applying the token filter.
      let tokens = TextCleaner(corpus)
        .trim()
        .condense()
        .removeChars()
        .removeStopWords()
        .s.split(" ")
        .filter(filter);

      // Use sort and pop to return the most common token.
      // Which is assumed to be the stonk-of-focus for the post.
      let sort = (a, b) =>
        tokens.filter((v) => v === a).length -
        tokens.filter((v) => v === b).length;

      return tokens.sort(sort).pop();
    }

    // Initiate stonks store.
    let stonks = [];

    // Loop through responseData (reddit posts) for stonk data.
    for (let i = responseData.length - 1; i >= 0; i--) {
      // Declare reddit post.
      let post = responseData[i];

      // Create corpus for parsing.
      let corpus = post.title + " " + post.text;

      // Parse corpus for stonk.
      let stonk = parse(corpus);

      // Get sentiment score for corpus.
      post.sentiment = sentiment(corpus).score;

      // Check for index in stonks for stonk if it exists.
      const existingStonkIndex = stonks.findIndex((i) => i.stonk === stonk);

      // If there's an index, push the post to the stonk's
      // post list, otherwise push a new stonk object.
      existingStonkIndex === -1
        ? stonks.push({ stonk, posts: [post] })
        : stonks[existingStonkIndex].posts.push(post);
    }

    // Resolve stonks store.
    resolve(stonks.filter((i) => i.stonk));
  });