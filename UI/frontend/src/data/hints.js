// Bandit hints, one entry per current level (index = the level a team is stuck on, hunting bandit[level+1]).
// `minutes` is the budget before hint 1; hint k appears at k × budget. Nudges, never the whole answer.
// Levels 0-14 show at most 2 hints; levels 15+ get a 3rd. Tips are capped by lib/hints.js.
export const HINTS = [
  { minutes: 2, tips: ['The password sits in a file in your home directory.', 'Try ls, then cat the readme.'] },
  { minutes: 2, tips: ['The file is literally named a dash: -', 'A leading - looks like an option. Use cat ./- or cat < -'] },
  { minutes: 3, tips: ['The filename has spaces in it.', 'Quote the whole name, or press Tab to complete it.'] },
  { minutes: 3, tips: ['There is a hidden file inside the inhere folder.', 'ls -a shows names that start with a dot.'] },
  { minutes: 3, tips: ['Only one file in inhere is human-readable text.', 'The file command tells you each one\'s type: file ./-file*'] },
  { minutes: 4, tips: ['Hunt by properties: 1033 bytes, readable, not executable.', 'find inhere -size 1033c and filter from there.'] },
  { minutes: 4, tips: ['The file is somewhere on the whole system, not just your home.', 'find / -user bandit7 -group bandit6 -size 33c 2>/dev/null'] },
  { minutes: 4, tips: ['The password sits right next to the word "millionth".', 'grep millionth data.txt'] },
  { minutes: 5, tips: ['It is the one line that appears exactly once.', 'sort data.txt | uniq -u'] },
  { minutes: 5, tips: ['Look for readable text that follows several = signs.', 'strings data.txt | grep ==='] },
  { minutes: 5, tips: ['The data is base64 encoded.', 'base64 -d data.txt'] },
  { minutes: 5, tips: ['Every letter is rotated 13 places (ROT13).', "cat data.txt | tr 'A-Za-z' 'N-ZA-Mn-za-m'"] },
  { minutes: 9, tips: ['It is a hexdump of a file compressed many times over.', 'Rebuild with xxd -r, then peel layers: file tells you gzip / bzip2 / tar each time.', 'Work in your own folder under /tmp and rename as you go.'] },
  { minutes: 6, tips: ['You are handed an SSH private key, not a password.', 'ssh -i sshkey.private bandit14@localhost, then read /etc/bandit_pass/bandit14'] },
  { minutes: 6, tips: ['Send the CURRENT password to a local port.', 'nc localhost 30000 and paste bandit14\'s password.'] },
  { minutes: 6, tips: ['Same idea as before, but the port speaks SSL.', 'openssl s_client -connect localhost:30001, then paste the password.', 'Add -quiet if the banner gets in the way.'] },
  { minutes: 8, tips: ['First find which ports in 31000-32000 are open.', 'nmap -p31000-32000 localhost', 'One open port answers over SSL and hands back a private key.'] },
  { minutes: 5, tips: ['The password changed between two files in your home.', 'diff passwords.old passwords.new — the differing line is it.', 'The > line is the new one.'] },
  { minutes: 6, tips: ['.bashrc logs you out the instant you connect.', 'Run one command without a login shell: ssh bandit18@localhost cat readme', 'Or: ssh bandit18@localhost -t "bash --noprofile"'] },
  { minutes: 6, tips: ['A setuid helper reads files as bandit20.', './bandit20-do cat /etc/bandit_pass/bandit20', 'Run it with no args first to see how it works.'] },
  { minutes: 8, tips: ['A setuid tool connects to a port you open and echoes the password back.', 'Open a listener feeding bandit20\'s password, then run ./suconnect with that port.', 'Background the listener (&) so you can run both in one shell.'] },
  { minutes: 7, tips: ['A cron job runs on a schedule — read /etc/cron.d.', 'Follow the script it points to and see where it writes.', 'The target file lands in /tmp; just cat it.'] },
  { minutes: 8, tips: ['The cron script names its output file from an MD5 of the username.', 'Read the script in /etc/cron.d, then run the same hash yourself.', 'echo I am userX | md5sum gives the filename under /tmp.'] },
  { minutes: 9, tips: ['A cron job runs any script dropped in a folder, as bandit24.', 'Write a short script that copies /etc/bandit_pass/bandit24 somewhere you can read.', 'Make it world-writable and wait a minute for cron to fire.'] },
]
