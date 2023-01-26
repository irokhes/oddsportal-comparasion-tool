const start = async () => {
  const { execShellCommand } = require('../utils/utils');

  const cmd = "curl 'https://www.oddsportal.com/feed/match/1-1-#MATCH#-#LINE#-#PARAMS#'   -H 'authority: www.oddsportal.com' -H 'accept: application/json, text/plain, */*' -H 'accept-language: en-GB,en;q=0.9,es-ES;q=0.8,es;q=0.7,en-US;q=0.6' -H 'referer: https://www.oddsportal.com/' -H 'sec-ch-ua-mobile: ?0' -H 'sec-ch-ua-platform: \"macOS\"' -H 'sec-fetch-dest: empty' -H 'sec-fetch-mode: cors' -H 'sec-fetch-site: same-origin' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' -H 'x-requested-with: XMLHttpRequest' --compressed";

  const mycmd = "curl 'https://www.oddsportal.com/feed/match-event/1-1-Mkyd9crg-4-2-yj265.dat' -H 'authority: www.oddsportal.com' -H 'accept: application/json, text/plain, */*' -H 'accept-language: en-GB,en;q=0.9,es-ES;q=0.8,es;q=0.7,en-US;q=0.6' -H 'referer: https://www.oddsportal.com/' -H 'sec-ch-ua-mobile: ?0' -H 'sec-ch-ua-platform: \"macOS\"' -H 'sec-fetch-dest: empty' -H 'sec-fetch-mode: cors' -H 'sec-fetch-site: same-origin' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' -H 'x-requested-with: XMLHttpRequest' --compressed";

  const result = await execShellCommand(mycmd);
  console.log(result);
};

start();
