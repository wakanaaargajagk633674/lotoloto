# sougaku Access Log

Date: 2026-06-25 JST

## Tried

- Browser/web open:
  - `http://sougaku.com/loto6/`
  - `http://sougaku.com/loto7/`
  - `http://sougaku.com/loto6/download/loto6.zip`
  - `http://sougaku.com/loto7/download/loto7.zip`
- Result: browser path attempted HTTPS-oriented access and returned 502 in this environment.

## Successful Method

Used `curl.exe` with HTTP direct and browser-like User-Agent:

- `http://sougaku.com/loto6/` -> 200 OK, saved to `data/raw/loto6/sougaku-loto6.html`
- `http://sougaku.com/loto7/` -> 200 OK, saved to `data/raw/loto7/sougaku-loto7.html`
- `http://sougaku.com/loto6/download/loto6.zip` -> 200 OK, `Content-Type: application/zip`, 78,803 bytes
- `http://sougaku.com/loto7/download/loto7.zip` -> 200 OK, `Content-Type: application/zip`, 30,262 bytes

## ZIP Metadata

- loto6 SHA-256: `DC74CBFAEE6CED67008628F03CF51E395A9CF8082BC4212AAEF6EE0846086E03`
- loto7 SHA-256: `D1738A88B8E0E7E1AAF793B3865A8C477C4DC62D31A714D74E84D2C3DE08C22E`

## Extraction

- `loto6.zip` contains `loto6.csv`, 205,810 bytes.
- `loto7.zip` contains `loto7.csv`, 77,381 bytes.
- CSV encoding is Shift_JIS/CP932.

